# 🔐 FHEVM Examples Toolkit

> Complete toolkit for building FHEVM examples using Zama's FHE Technology

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-blue.svg)](https://soliditylang.org/)
[![fhevm/solidity](https://img.shields.io/badge/@fhevm/solidity-0.9.1-green.svg)](https://github.com/zama-ai)
[![Hardhat](https://img.shields.io/badge/Hardhat-2.19-orange.svg)](https://hardhat.org/)

## 📋 Overview

This repository is a complete **FHEVM Examples Toolkit** built for the **Zama Bounty Program (Season 11)**. It provides:

- 📦 **Base Template** - Hardhat template for scaffolding new examples
- 🛠️ **CLI Tools** - Scripts to create and document examples
- 📚 **Multiple Examples** - Basic, encryption, decryption, access control, anti-patterns
- 📖 **Auto-Documentation** - GitBook-compatible docs generation
- 🎯 **Creative Example** - Salary Lens (privacy-preserving salary aggregation)

### The Problem

Teams often want to know their average salary for benchmarking, but individuals are reluctant to share their exact compensation due to privacy concerns.

### The Solution

With FHE, team members can:
1. Submit their salaries in **encrypted form**
2. The contract maintains an **encrypted running total**
3. Anyone can request the **average** (not individual values)
4. The Gateway decrypts **only the average**

**Individual salaries are NEVER revealed** - not even to the contract!

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│   Frontend      │────▶│  SalaryLens.sol  │────▶│   Gateway   │
│  (React+Vite)   │     │    (FHE Logic)   │     │ (Decryption)│
└─────────────────┘     └──────────────────┘     └─────────────┘
        │                        │                      │
        │  1. Encrypt salary     │  2. Encrypted ops    │
        │  (fhevmjs)            │  (TFHE.add, div)     │
        │                        │                      │
        ▼                        ▼                      ▼
   User submits            Total updated          Average revealed
   encrypted value         (stays encrypted)      (only aggregate)
```

## 📁 Project Structure

```
fhevm-examples-toolkit/
├── base-template/              # 📦 Hardhat template for scaffolding
│   ├── contracts/
│   ├── test/
│   ├── scripts/deploy.ts
│   ├── hardhat.config.ts
│   └── package.json
│
├── contracts/
│   ├── SalaryLens.sol          # 🎯 Creative example (deployed)
│   └── examples/               # 📚 Categorized examples
│       ├── basic/              # Counter, arithmetic, comparison
│       ├── encryption/         # Single/multiple value encryption
│       ├── decryption/         # Public decryption patterns
│       ├── access-control/     # Permission management
│       └── anti-patterns/      # Common mistakes to avoid
│
├── scripts/
│   ├── deploy.ts               # Deployment script
│   ├── create-fhevm-example.ts # 🛠️ CLI to scaffold examples
│   └── generate-docs.ts        # 📖 Auto-documentation generator
│
├── docs/examples/              # 📖 Generated GitBook docs
├── frontend/                   # 🎨 React frontend for Salary Lens
├── test/                       # 🧪 Test files
├── DEVELOPER_GUIDE.md          # 📘 Developer documentation
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js v18+
- npm or yarn
- MetaMask browser extension

### 1. Clone and Install

```bash
# Clone the repository
git clone <repo-url>
cd salary-lens

# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your private key
# PRIVATE_KEY=your_private_key_here
```

### 3. Compile Contracts

```bash
npm run compile
```

### 4. Run Tests

```bash
npm run test
```

### 5. Deploy to Zama Devnet

```bash
npm run deploy:devnet
```

### 6. Start Frontend

```bash
cd frontend
npm run dev
```

Open http://localhost:5173 in your browser.

## 📝 Smart Contract API

### `SalaryLens.sol`

#### State Variables

| Variable | Type | Description |
|----------|------|-------------|
| `encryptedTotal` | `euint32` | Encrypted sum of all salaries (private) |
| `count` | `uint32` | Number of submitted salaries (public) |
| `hasSubmitted` | `mapping` | Tracks which addresses have submitted |

#### Functions

##### `addSalary(einput encryptedSalary, bytes inputProof)`

Submit an encrypted salary to the aggregate.

- **Parameters:**
  - `encryptedSalary`: Encrypted salary value (from fhevmjs)
  - `inputProof`: Zero-knowledge proof for the encrypted input
- **Emits:** `SalarySubmitted(address submitter, uint32 newCount)`
- **Reverts:** `AlreadySubmitted()` if user has already submitted

##### `requestAverageDecryption() returns (uint256 requestId)`

Request the Gateway to decrypt the average salary.

- **Returns:** Gateway request ID for tracking
- **Emits:** `AverageRequested(address requester, uint256 requestId)`
- **Reverts:** `NoSalariesSubmitted()` if count is 0

##### `getCount() returns (uint32)`

Get the current number of submitted salaries.

##### `hasUserSubmitted(address user) returns (bool)`

Check if a specific address has submitted a salary.

##### `getLastAverage(address user) returns (uint32)`

Get the last decrypted average for a specific address.

## 🧪 Testing

The test suite covers:

- ✅ Contract deployment and initialization
- ✅ Encrypted salary submission
- ✅ Duplicate submission prevention
- ✅ Average calculation with division by zero protection
- ✅ Multiple user scenarios
- ✅ Edge cases (zero values, max uint32)

Run tests with:

```bash
npm run test

# With gas reporting
REPORT_GAS=true npm run test

# With coverage
npm run test:coverage
```

## 🎨 Frontend Features

- **Wallet Connection**: MetaMask integration with Zama Devnet auto-switch
- **Encrypted Submission**: Client-side encryption using fhevmjs
- **Live Stats**: Real-time display of submission count
- **Gateway Integration**: Seamless decryption request flow
- **Modern UI**: TailwindCSS with glassmorphism design

## 🔐 Security Considerations

### What's Protected

- ✅ Individual salary values (always encrypted on-chain)
- ✅ Running total (encrypted, never revealed)
- ✅ Submission privacy (only aggregate is decryptable)

### What's Public

- Count of submissions
- Whether an address has submitted
- The decrypted average (when requested)

### Best Practices Followed

1. **`TFHE.allowThis()`** called after every encrypted state update
2. **No view functions** return encrypted values (anti-pattern avoidance)
3. **Gateway pattern** used for all decryption (no in-contract decryption)
4. **Custom errors** for gas-efficient reverts

## 🛠️ CLI Tools

### Create New Example

```bash
# List available examples
npx ts-node scripts/create-fhevm-example.ts

# Scaffold a specific example
npx ts-node scripts/create-fhevm-example.ts fhe-counter ./output
npx ts-node scripts/create-fhevm-example.ts salary-lens ./output
```

### Generate Documentation

```bash
# Generate all docs
npx ts-node scripts/generate-docs.ts --all

# Generate single example docs
npx ts-node scripts/generate-docs.ts fhe-counter
```

## 📚 Available Examples

| Example | Category | Difficulty | Description |
|---------|----------|------------|-------------|
| `fhe-counter` | Basic | Beginner | Simple encrypted counter |
| `fhe-arithmetic` | Basic | Beginner | Add, sub, mul, div operations |
| `fhe-comparison` | Basic | Beginner | eq, ne, lt, gt comparisons |
| `encrypt-single` | Encryption | Beginner | Encrypt single value |
| `encrypt-multiple` | Encryption | Intermediate | Batch encryption |
| `public-decrypt` | Decryption | Intermediate | Public decryption with proofs |
| `access-control` | Access Control | Intermediate | Permission management |
| `anti-patterns` | Anti-Patterns | Beginner | Common mistakes |
| `salary-lens` | Advanced | Advanced | Privacy-preserving aggregation |

## 🔧 Technical Stack

| Component | Technology |
|-----------|------------|
| Smart Contracts | Solidity 0.8.24 |
| FHE Library | @fhevm/solidity 0.9.1 |
| Development | Hardhat |
| Testing | Mocha + Chai |
| Frontend | React 18 + Vite |
| Styling | TailwindCSS |
| Relayer SDK | @zama-fhe/relayer-sdk |
| Network | Sepolia Testnet |

## 📚 Resources

- [Zama Documentation](https://docs.zama.ai/fhevm)
- [fhevmjs Library](https://github.com/zama-ai/fhevmjs)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Zama Bounty Program](https://www.zama.ai/bounty-program)

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 📖 Documentation

See [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) for:
- How to create new examples
- Documentation generation
- Testing patterns
- Dependency updates

---

Built with ❤️ for the Zama Bounty Program Season 11
