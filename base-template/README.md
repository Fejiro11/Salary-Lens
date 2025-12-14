# FHEVM Example Template

Base template for building FHEVM examples using Zama's Fully Homomorphic Encryption technology.

## Prerequisites

- Node.js >= 18
- npm or yarn

## Quick Start

```bash
# Install dependencies
npm install

# Compile contracts
npm run compile

# Run tests
npm test

# Deploy to Sepolia
npm run deploy:sepolia
```

## Project Structure

```
├── contracts/          # Solidity smart contracts
├── test/              # TypeScript test files
├── scripts/           # Deployment scripts
├── hardhat.config.ts  # Hardhat configuration
└── package.json       # Dependencies
```

## Key Dependencies

- `@fhevm/solidity` - Core FHEVM Solidity library
- `@fhevm/hardhat-plugin` - Hardhat integration for FHEVM testing

## FHE Critical Patterns

### ✅ DO: Grant Both Permissions
```solidity
FHE.allowThis(encryptedValue);           // Contract permission
FHE.allow(encryptedValue, msg.sender);   // User permission
```

### ❌ DON'T: Forget allowThis
```solidity
FHE.allow(encryptedValue, msg.sender);   // Missing allowThis - will fail!
```

### ✅ DO: Match Encryption Signer
```typescript
const enc = await fhevm.createEncryptedInput(contractAddr, alice.address)
  .add32(123).encrypt();
await contract.connect(alice).operate(enc.handles[0], enc.inputProof);
```

## Resources

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Protocol Examples](https://docs.zama.org/protocol/examples)
- [Zama GitHub](https://github.com/zama-ai)

## License

MIT
