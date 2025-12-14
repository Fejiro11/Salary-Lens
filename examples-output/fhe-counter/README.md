# FHECounter

Simple encrypted counter demonstrating FHE basics

## Category
**basic** | Difficulty: **Beginner**

## Quick Start

```bash
# Install dependencies
npm install

# Compile
npm run compile

# Run tests
npm test

# Deploy to Sepolia
npm run deploy:sepolia
```

## Contract Overview

This example demonstrates:
- FHE operations using `@fhevm/solidity`
- Permission management with `FHE.allowThis()` and `FHE.allow()`
- Public decryption pattern

## Key Patterns

### ✅ Permission Management
```solidity
// Always grant both permissions after state changes
FHE.allowThis(encryptedValue);           // Contract permission
FHE.allow(encryptedValue, msg.sender);   // User permission
```

### ✅ Public Decryption
```solidity
// Mark value as publicly decryptable
FHE.makePubliclyDecryptable(encryptedValue);

// Then use relayer-sdk off-chain to decrypt
```

## Resources

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Protocol Examples](https://docs.zama.org/protocol/examples)
- [Zama GitHub](https://github.com/zama-ai)

## License

MIT
