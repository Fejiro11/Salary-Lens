# Technical Documentation: The Salary Lens

## 🔐 FHE (Fully Homomorphic Encryption) Concepts

### What is FHE?

Fully Homomorphic Encryption allows computations on encrypted data without decrypting it first. The result, when decrypted, matches what you'd get from computing on the plaintext.

```
encrypt(a) + encrypt(b) = encrypt(a + b)
```

### How Zama's FHEVM Works

1. **Client-side encryption**: User encrypts data with `fhevmjs`
2. **On-chain computation**: Smart contract uses `TFHE` library for encrypted operations
3. **Gateway decryption**: Decryption requests go through the Zama Gateway

## 📊 Contract Design

### State Management

```solidity
euint32 private encryptedTotal;  // Encrypted sum
uint32 public count;              // Plaintext count
```

**Why `count` is plaintext:**
- Division by encrypted value isn't supported efficiently
- Count is not sensitive information
- Gas optimization

### Critical Pattern: `TFHE.allowThis()`

After every encrypted state update, we MUST call:

```solidity
TFHE.allowThis(encryptedTotal);
```

This grants the contract permission to use the encrypted value in future transactions. **Omitting this is a common bug!**

### Anti-Patterns Avoided

1. **No `view` functions returning encrypted values**
   - ❌ `function getTotal() view returns (euint32)` 
   - This would expose ciphertext handles inappropriately

2. **No in-contract decryption**
   - ❌ `TFHE.decrypt(encryptedTotal)`
   - Always use Gateway for decryption

## 🔄 Transaction Flow

### Submit Salary Flow

```
User                    Frontend               Contract              TFHE
 │                         │                      │                    │
 │─── Enter salary ───────▶│                      │                    │
 │                         │─── Encrypt ──────────┼───────────────────▶│
 │                         │◀── Ciphertext ───────┼────────────────────│
 │                         │                      │                    │
 │                         │─── addSalary(ct) ───▶│                    │
 │                         │                      │─── TFHE.add() ────▶│
 │                         │                      │◀── New total ──────│
 │                         │                      │─── allowThis() ───▶│
 │                         │◀── TX Receipt ───────│                    │
 │◀── Success ─────────────│                      │                    │
```

### Request Average Flow

```
User              Frontend              Contract              Gateway
 │                   │                      │                    │
 │─── Click ────────▶│                      │                    │
 │                   │─── requestAvg() ────▶│                    │
 │                   │                      │─── TFHE.div() ────▶│
 │                   │                      │─── Request ───────▶│
 │                   │◀── RequestId ────────│                    │
 │                   │                      │                    │
 │                   │    ... Gateway processes ...              │
 │                   │                      │                    │
 │                   │                      │◀── Callback ───────│
 │                   │◀── AverageDecrypted ─│                    │
 │◀── Show Average ──│                      │                    │
```

## 🧮 Math Operations

### Available TFHE Operations

| Operation | Example | Notes |
|-----------|---------|-------|
| `add` | `TFHE.add(a, b)` | Both encrypted or mixed |
| `sub` | `TFHE.sub(a, b)` | Subtraction |
| `mul` | `TFHE.mul(a, b)` | Multiplication |
| `div` | `TFHE.div(a, plaintext)` | Division by plaintext only |

### Why Division by Plaintext Only?

Encrypted division is computationally expensive and not fully supported. We work around this by keeping `count` as plaintext:

```solidity
euint32 average = TFHE.div(encryptedTotal, count); // count is uint32
```

## 🛡️ Security Model

### Trust Assumptions

1. **Zama Gateway**: Trusted for decryption (runs in secure enclaves)
2. **Smart Contract**: Trustless - code is law
3. **Client**: User controls their own encryption

### What's Protected

| Data | Protection Level |
|------|-----------------|
| Individual salaries | Fully encrypted |
| Running total | Encrypted |
| Count | Public (non-sensitive) |
| Average | Revealed on request |

### Attack Vectors Considered

1. **Front-running**: Mitigated - encrypted values are meaningless to observers
2. **Replay attacks**: Prevented - proof validation and nonce handling
3. **Sybil attacks**: Partially mitigated - one submission per address

## 🧪 Testing Strategy

### Local Testing Challenges

FHEVM operations require actual FHE infrastructure. For local tests:

1. **Mock Mode**: Use mock encrypted inputs
2. **Network Fork**: Fork Zama Devnet for realistic tests
3. **Integration Tests**: Full tests on actual devnet

### Test Coverage Goals

- Unit tests for all public functions
- Edge cases (zero values, max values)
- Access control verification
- Event emission verification

## ⛽ Gas Optimization

### Gas Costs

| Operation | Approximate Gas |
|-----------|----------------|
| `addSalary` | ~200,000 |
| `requestAverageDecryption` | ~150,000 |
| View functions | ~30,000 |

### Optimization Techniques

1. **Packed storage**: Using `uint32` instead of `uint256` where possible
2. **Custom errors**: Cheaper than string reverts
3. **Minimal state**: Only essential encrypted state

## 📦 Dependencies

### Smart Contract

```
fhevm ^0.5.0
├── TFHE.sol (core FHE operations)
└── GatewayCaller.sol (decryption requests)
```

### Frontend

```
fhevmjs ^0.5.0 (client-side encryption)
ethers ^6.9.0 (blockchain interaction)
```

## 🔧 Configuration

### Network Configuration

```typescript
{
  chainId: 8009,
  name: 'Zama Devnet',
  rpcUrl: 'https://devnet.zama.ai',
  gatewayUrl: 'https://gateway.zama.ai'
}
```

### Contract Deployment

After deployment, update `frontend/src/config.ts`:

```typescript
CONTRACT_ADDRESS: '0x...' // Your deployed address
```

## 🐛 Common Issues

### "TFHE operation failed"
- Check that `allowThis()` was called after previous updates
- Verify the encrypted value was properly initialized

### "Gateway timeout"
- Gateway may be congested; retry after a few minutes
- Check Gateway URL configuration

### "Invalid proof"
- Ensure fhevmjs is properly initialized
- Check that the contract address matches the encryption target

## 📚 References

- [TFHE Library Documentation](https://docs.zama.ai/fhevm/references/tfhe-library)
- [Gateway Documentation](https://docs.zama.ai/fhevm/tutorials/gateway)
- [Best Practices](https://docs.zama.ai/fhevm/guides/best-practices)
