#!/usr/bin/env ts-node
/**
 * @fileoverview CLI tool to scaffold new FHEVM example repositories
 * @description Creates standalone example repos from the base template
 * 
 * Usage:
 *   npx ts-node scripts/create-fhevm-example.ts <example-name> [output-dir]
 * 
 * Examples:
 *   npx ts-node scripts/create-fhevm-example.ts fhe-counter ./output
 *   npx ts-node scripts/create-fhevm-example.ts salary-lens ../my-examples
 */

import * as fs from 'fs';
import * as path from 'path';

// Example configurations
const EXAMPLES_MAP: Record<string, {
  contract: string;
  category: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}> = {
  'fhe-counter': {
    contract: 'contracts/examples/basic/FHECounter.sol',
    category: 'basic',
    description: 'Simple encrypted counter demonstrating FHE basics',
    difficulty: 'Beginner',
  },
  'fhe-arithmetic': {
    contract: 'contracts/examples/basic/FHEArithmetic.sol',
    category: 'basic',
    description: 'FHE arithmetic operations (add, sub, mul, div)',
    difficulty: 'Beginner',
  },
  'fhe-comparison': {
    contract: 'contracts/examples/basic/FHEComparison.sol',
    category: 'basic',
    description: 'FHE comparison operations (eq, ne, lt, gt)',
    difficulty: 'Beginner',
  },
  'encrypt-single': {
    contract: 'contracts/examples/encryption/EncryptSingleValue.sol',
    category: 'encryption',
    description: 'Encrypt and store a single value',
    difficulty: 'Beginner',
  },
  'encrypt-multiple': {
    contract: 'contracts/examples/encryption/EncryptMultipleValues.sol',
    category: 'encryption',
    description: 'Encrypt and store multiple values in one transaction',
    difficulty: 'Intermediate',
  },
  'public-decrypt': {
    contract: 'contracts/examples/decryption/PublicDecrypt.sol',
    category: 'decryption',
    description: 'Public decryption with proof verification',
    difficulty: 'Intermediate',
  },
  'access-control': {
    contract: 'contracts/examples/access-control/AccessControlExample.sol',
    category: 'access-control',
    description: 'FHE permission management patterns',
    difficulty: 'Intermediate',
  },
  'anti-patterns': {
    contract: 'contracts/examples/anti-patterns/AntiPatterns.sol',
    category: 'anti-patterns',
    description: 'Common FHE mistakes and how to avoid them',
    difficulty: 'Beginner',
  },
  'salary-lens': {
    contract: 'contracts/SalaryLens.sol',
    category: 'advanced',
    description: 'Privacy-preserving salary aggregation with encrypted averaging',
    difficulty: 'Advanced',
  },
};

/**
 * Copy directory recursively
 */
function copyDirSync(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Generate test file for the example
 */
function generateTestFile(exampleName: string, contractName: string): string {
  return `import { expect } from "chai";
import { ethers } from "hardhat";

/**
 * @fileoverview Tests for ${contractName}
 * @description Demonstrates testing patterns for FHEVM contracts
 * 
 * @custom:example ${exampleName}
 */
describe("${contractName}", function () {
  /**
   * ✅ Test: Contract deployment
   * @dev Verify the contract deploys successfully
   */
  it("Should deploy successfully", async function () {
    const Factory = await ethers.getContractFactory("${contractName}");
    const contract = await Factory.deploy();
    await contract.waitForDeployment();
    
    expect(await contract.getAddress()).to.be.properAddress;
  });

  /**
   * ✅ Test: Basic functionality
   * @dev Add more specific tests based on the contract's functionality
   */
  it("Should have correct initial state", async function () {
    const Factory = await ethers.getContractFactory("${contractName}");
    const contract = await Factory.deploy();
    await contract.waitForDeployment();
    
    // Add specific assertions based on contract
    expect(contract).to.not.be.undefined;
  });

  // TODO: Add more tests specific to this example
  // - Test encrypted operations
  // - Test permission management
  // - Test decryption flow
});
`;
}

/**
 * Generate README for the example
 */
function generateReadme(exampleName: string, config: typeof EXAMPLES_MAP[string], contractName: string): string {
  return `# ${contractName}

${config.description}

## Category
**${config.category}** | Difficulty: **${config.difficulty}**

## Quick Start

\`\`\`bash
# Install dependencies
npm install

# Compile
npm run compile

# Run tests
npm test

# Deploy to Sepolia
npm run deploy:sepolia
\`\`\`

## Contract Overview

This example demonstrates:
- FHE operations using \`@fhevm/solidity\`
- Permission management with \`FHE.allowThis()\` and \`FHE.allow()\`
- Public decryption pattern

## Key Patterns

### ✅ Permission Management
\`\`\`solidity
// Always grant both permissions after state changes
FHE.allowThis(encryptedValue);           // Contract permission
FHE.allow(encryptedValue, msg.sender);   // User permission
\`\`\`

### ✅ Public Decryption
\`\`\`solidity
// Mark value as publicly decryptable
FHE.makePubliclyDecryptable(encryptedValue);

// Then use relayer-sdk off-chain to decrypt
\`\`\`

## Resources

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Protocol Examples](https://docs.zama.org/protocol/examples)
- [Zama GitHub](https://github.com/zama-ai)

## License

MIT
`;
}

/**
 * Main function to create the example
 */
async function createExample(exampleName: string, outputDir: string): Promise<void> {
  console.log(`\n🚀 Creating FHEVM example: ${exampleName}\n`);

  // Validate example exists
  const config = EXAMPLES_MAP[exampleName];
  if (!config) {
    console.error(`❌ Unknown example: ${exampleName}`);
    console.log('\nAvailable examples:');
    Object.entries(EXAMPLES_MAP).forEach(([name, cfg]) => {
      console.log(`  - ${name}: ${cfg.description}`);
    });
    process.exit(1);
  }

  const rootDir = path.resolve(__dirname, '..');
  const baseTemplateDir = path.join(rootDir, 'base-template');
  const outputPath = path.resolve(outputDir, exampleName);

  // Check base template exists
  if (!fs.existsSync(baseTemplateDir)) {
    console.error('❌ Base template not found at:', baseTemplateDir);
    process.exit(1);
  }

  // Check contract exists
  const contractPath = path.join(rootDir, config.contract);
  if (!fs.existsSync(contractPath)) {
    console.error('❌ Contract not found at:', contractPath);
    process.exit(1);
  }

  // Create output directory
  console.log(`📁 Creating directory: ${outputPath}`);
  fs.mkdirSync(outputPath, { recursive: true });

  // Copy base template
  console.log('📋 Copying base template...');
  copyDirSync(baseTemplateDir, outputPath);

  // Extract contract name from file
  const contractContent = fs.readFileSync(contractPath, 'utf-8');
  const contractNameMatch = contractContent.match(/contract\s+(\w+)/);
  const contractName = contractNameMatch ? contractNameMatch[1] : 'Example';

  // Copy contract
  console.log(`📄 Copying contract: ${contractName}`);
  const destContractDir = path.join(outputPath, 'contracts');
  fs.mkdirSync(destContractDir, { recursive: true });
  fs.copyFileSync(contractPath, path.join(destContractDir, `${contractName}.sol`));

  // Remove placeholder
  const gitkeepPath = path.join(destContractDir, '.gitkeep');
  if (fs.existsSync(gitkeepPath)) {
    fs.unlinkSync(gitkeepPath);
  }

  // Generate test file
  console.log('🧪 Generating test file...');
  const testDir = path.join(outputPath, 'test');
  fs.mkdirSync(testDir, { recursive: true });
  fs.writeFileSync(
    path.join(testDir, `${contractName}.test.ts`),
    generateTestFile(exampleName, contractName)
  );

  // Remove test placeholder
  const testGitkeepPath = path.join(testDir, '.gitkeep');
  if (fs.existsSync(testGitkeepPath)) {
    fs.unlinkSync(testGitkeepPath);
  }

  // Generate README
  console.log('📝 Generating README...');
  fs.writeFileSync(
    path.join(outputPath, 'README.md'),
    generateReadme(exampleName, config, contractName)
  );

  // Update package.json name
  const packageJsonPath = path.join(outputPath, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  packageJson.name = `fhevm-example-${exampleName}`;
  packageJson.description = config.description;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

  // Update deploy script
  const deployScriptPath = path.join(outputPath, 'scripts', 'deploy.ts');
  let deployScript = fs.readFileSync(deployScriptPath, 'utf-8');
  deployScript = deployScript.replace(/FHECounter/g, contractName);
  fs.writeFileSync(deployScriptPath, deployScript);

  console.log(`\n✅ Example created successfully at: ${outputPath}`);
  console.log('\nNext steps:');
  console.log(`  cd ${outputPath}`);
  console.log('  npm install');
  console.log('  npm run compile');
  console.log('  npm test');
}

// CLI entry point
const args = process.argv.slice(2);
if (args.length < 1) {
  console.log('Usage: npx ts-node scripts/create-fhevm-example.ts <example-name> [output-dir]');
  console.log('\nAvailable examples:');
  Object.entries(EXAMPLES_MAP).forEach(([name, cfg]) => {
    console.log(`  - ${name}: ${cfg.description}`);
  });
  process.exit(1);
}

const exampleName = args[0];
const outputDir = args[1] || './examples-output';

createExample(exampleName, outputDir);
