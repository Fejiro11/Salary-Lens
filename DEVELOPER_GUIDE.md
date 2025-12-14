# FHEVM Examples Developer Guide

This guide explains how to use the FHEVM example toolkit, add new examples, and maintain the documentation.

## Table of Contents

1. [Project Structure](#project-structure)
2. [Quick Start](#quick-start)
3. [Creating New Examples](#creating-new-examples)
4. [Documentation Generation](#documentation-generation)
5. [Testing Examples](#testing-examples)
6. [Updating Dependencies](#updating-dependencies)
7. [Best Practices](#best-practices)

---

## Project Structure

```
windsurf-project/
├── base-template/              # Hardhat template for scaffolding
│   ├── contracts/              # Placeholder for contracts
│   ├── test/                   # Placeholder for tests
│   ├── scripts/                # Deployment scripts
│   ├── hardhat.config.ts       # Hardhat configuration
│   └── package.json            # Dependencies
│
├── contracts/
│   ├── SalaryLens.sol          # Main creative example
│   └── examples/               # Categorized example contracts
│       ├── basic/              # Counter, arithmetic, comparison
│       ├── encryption/         # Single/multiple value encryption
│       ├── decryption/         # Public decryption patterns
│       ├── access-control/     # Permission management
│       └── anti-patterns/      # Common mistakes
│
├── scripts/
│   ├── create-fhevm-example.ts # CLI to scaffold new examples
│   └── generate-docs.ts        # Auto-generate documentation
│
├── docs/
│   └── examples/               # Generated GitBook documentation
│
├── frontend/                   # React frontend for Salary Lens
│
└── DEVELOPER_GUIDE.md          # This file
```

---

## Quick Start

### Prerequisites

- Node.js >= 18
- npm or yarn
- Git

### Setup

```bash
# Clone the repository
git clone <repo-url>
cd windsurf-project

# Install dependencies
npm install

# Compile contracts
npm run compile

# Run tests
npm test
```

---

## Creating New Examples

### Option 1: Use the CLI Tool

The `create-fhevm-example` script scaffolds a complete example repository:

```bash
# List available examples
npx ts-node scripts/create-fhevm-example.ts

# Create a specific example
npx ts-node scripts/create-fhevm-example.ts fhe-counter ./output

# Create multiple examples
npx ts-node scripts/create-fhevm-example.ts salary-lens ./output
npx ts-node scripts/create-fhevm-example.ts public-decrypt ./output
```

### Option 2: Manual Creation

1. **Write the Contract**

   Create a new Solidity file in `contracts/examples/<category>/`:

   ```solidity
   // SPDX-License-Identifier: MIT
   pragma solidity ^0.8.24;

   import "@fhevm/solidity/lib/FHE.sol";
   import "@fhevm/solidity/config/ZamaConfig.sol";

   /**
    * @title YourExampleName
    * @author Your Name
    * @notice Brief description
    * @dev Detailed explanation
    * 
    * @custom:chapter category-name
    * @custom:category Category
    * @custom:difficulty Beginner|Intermediate|Advanced
    */
   contract YourExample is ZamaEthereumConfig {
       // ... implementation
   }
   ```

2. **Add to Configuration**

   Update `scripts/create-fhevm-example.ts`:

   ```typescript
   const EXAMPLES_MAP = {
     // ... existing examples
     'your-example': {
       contract: 'contracts/examples/category/YourExample.sol',
       category: 'category-name',
       description: 'Your example description',
       difficulty: 'Intermediate',
     },
   };
   ```

3. **Add to Documentation Config**

   Update `scripts/generate-docs.ts`:

   ```typescript
   const EXAMPLES_CONFIG = {
     // ... existing examples
     'your-example': {
       contract: 'contracts/examples/category/YourExample.sol',
       chapter: 'category-name',
       order: 1,
     },
   };
   ```

4. **Write Tests**

   Create `test/examples/YourExample.test.ts`:

   ```typescript
   import { expect } from "chai";
   import { ethers } from "hardhat";

   describe("YourExample", function () {
     it("Should deploy successfully", async function () {
       const Factory = await ethers.getContractFactory("YourExample");
       const contract = await Factory.deploy();
       expect(await contract.getAddress()).to.be.properAddress;
     });
   });
   ```

---

## Documentation Generation

### Generate All Documentation

```bash
npx ts-node scripts/generate-docs.ts --all
```

### Generate Single Example

```bash
npx ts-node scripts/generate-docs.ts fhe-counter
```

### Output

Documentation is generated in `docs/examples/` with:
- Individual markdown files per example
- `SUMMARY.md` for GitBook navigation
- `README.md` with overview

### GitBook Integration

The generated docs are compatible with GitBook. To deploy:

1. Copy `docs/examples/` to your GitBook repository
2. The `SUMMARY.md` provides the navigation structure
3. Each example has its own page with source code

---

## Testing Examples

### Run All Tests

```bash
npm test
```

### Run Specific Test

```bash
npx hardhat test test/examples/FHECounter.test.ts
```

### Test Coverage

```bash
npm run test:coverage
```

---

## Updating Dependencies

### Update FHEVM Solidity

```bash
npm update @fhevm/solidity
```

### Update All Dependencies

```bash
npm update
```

### Check for Outdated Packages

```bash
npm outdated
```

### After Updates

1. Run `npm run compile` to check for breaking changes
2. Run `npm test` to verify all tests pass
3. Update documentation if API changed

---

## Best Practices

### Contract Development

1. **Always use NatSpec comments**
   ```solidity
   /**
    * @notice User-facing description
    * @dev Technical details
    * @param paramName Parameter description
    * @return Description of return value
    */
   ```

2. **Always grant both permissions**
   ```solidity
   FHE.allowThis(encryptedValue);
   FHE.allow(encryptedValue, msg.sender);
   ```

3. **Use custom tags for categorization**
   ```solidity
   * @custom:chapter basic
   * @custom:category Counter
   * @custom:difficulty Beginner
   ```

### Testing

1. **Test success AND failure cases**
2. **Use descriptive test names**
3. **Include comments explaining what's being tested**

### Documentation

1. **Keep NatSpec in sync with code**
2. **Include code examples in @dev comments**
3. **Show both ✅ correct and ❌ incorrect patterns**

---

## Troubleshooting

### Compilation Errors

```bash
# Clean and recompile
npm run clean
npm run compile
```

### Test Failures

```bash
# Run with verbose output
npx hardhat test --verbose
```

### Documentation Issues

```bash
# Check contract path exists
ls contracts/examples/<category>/
```

---

## Resources

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Protocol Examples](https://docs.zama.org/protocol/examples)
- [Zama GitHub](https://github.com/zama-ai)
- [Hardhat Documentation](https://hardhat.org/docs)

---

## License

MIT
