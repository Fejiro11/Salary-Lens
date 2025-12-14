#!/usr/bin/env ts-node
/**
 * @fileoverview Auto-generate documentation from Solidity contracts
 * @description Extracts NatSpec comments and generates GitBook-compatible markdown
 * 
 * Usage:
 *   npx ts-node scripts/generate-docs.ts [example-name]
 *   npx ts-node scripts/generate-docs.ts --all
 */

import * as fs from 'fs';
import * as path from 'path';

// Documentation configuration
const EXAMPLES_CONFIG: Record<string, {
  contract: string;
  chapter: string;
  order: number;
}> = {
  'fhe-counter': {
    contract: 'contracts/examples/basic/FHECounter.sol',
    chapter: 'basic',
    order: 1,
  },
  'fhe-arithmetic': {
    contract: 'contracts/examples/basic/FHEArithmetic.sol',
    chapter: 'basic',
    order: 2,
  },
  'fhe-comparison': {
    contract: 'contracts/examples/basic/FHEComparison.sol',
    chapter: 'basic',
    order: 3,
  },
  'encrypt-single': {
    contract: 'contracts/examples/encryption/EncryptSingleValue.sol',
    chapter: 'encryption',
    order: 1,
  },
  'encrypt-multiple': {
    contract: 'contracts/examples/encryption/EncryptMultipleValues.sol',
    chapter: 'encryption',
    order: 2,
  },
  'public-decrypt': {
    contract: 'contracts/examples/decryption/PublicDecrypt.sol',
    chapter: 'decryption',
    order: 1,
  },
  'access-control': {
    contract: 'contracts/examples/access-control/AccessControlExample.sol',
    chapter: 'access-control',
    order: 1,
  },
  'anti-patterns': {
    contract: 'contracts/examples/anti-patterns/AntiPatterns.sol',
    chapter: 'anti-patterns',
    order: 1,
  },
  'salary-lens': {
    contract: 'contracts/SalaryLens.sol',
    chapter: 'advanced',
    order: 1,
  },
};

interface NatSpecDoc {
  title: string;
  author: string;
  notice: string;
  dev: string[];
  custom: Record<string, string>;
  functions: FunctionDoc[];
}

interface FunctionDoc {
  name: string;
  notice: string;
  dev: string[];
  params: Record<string, string>;
  returns: string;
  custom: Record<string, string>;
}

/**
 * Extract NatSpec documentation from Solidity source
 */
function extractNatSpec(source: string): NatSpecDoc {
  const doc: NatSpecDoc = {
    title: '',
    author: '',
    notice: '',
    dev: [],
    custom: {},
    functions: [],
  };

  // Extract contract-level NatSpec
  const contractDocMatch = source.match(/\/\*\*[\s\S]*?\*\/\s*contract/);
  if (contractDocMatch) {
    const docBlock = contractDocMatch[0];
    
    const titleMatch = docBlock.match(/@title\s+(.+)/);
    if (titleMatch) doc.title = titleMatch[1].trim();
    
    const authorMatch = docBlock.match(/@author\s+(.+)/);
    if (authorMatch) doc.author = authorMatch[1].trim();
    
    const noticeMatch = docBlock.match(/@notice\s+(.+)/);
    if (noticeMatch) doc.notice = noticeMatch[1].trim();
    
    const devMatches = docBlock.matchAll(/@dev\s+(.+)/g);
    for (const match of devMatches) {
      doc.dev.push(match[1].trim());
    }
    
    const customMatches = docBlock.matchAll(/@custom:(\w+)\s+(.+)/g);
    for (const match of customMatches) {
      doc.custom[match[1]] = match[2].trim();
    }
  }

  // Extract function-level NatSpec
  const functionMatches = source.matchAll(/\/\*\*[\s\S]*?\*\/\s*function\s+(\w+)/g);
  for (const match of functionMatches) {
    const funcDoc: FunctionDoc = {
      name: match[1],
      notice: '',
      dev: [],
      params: {},
      returns: '',
      custom: {},
    };
    
    const docBlock = match[0];
    
    const noticeMatch = docBlock.match(/@notice\s+(.+)/);
    if (noticeMatch) funcDoc.notice = noticeMatch[1].trim();
    
    const devMatches = docBlock.matchAll(/@dev\s+(.+)/g);
    for (const dm of devMatches) {
      funcDoc.dev.push(dm[1].trim());
    }
    
    const paramMatches = docBlock.matchAll(/@param\s+(\w+)\s+(.+)/g);
    for (const pm of paramMatches) {
      funcDoc.params[pm[1]] = pm[2].trim();
    }
    
    const returnMatch = docBlock.match(/@return\s+(.+)/);
    if (returnMatch) funcDoc.returns = returnMatch[1].trim();
    
    const customMatches = docBlock.matchAll(/@custom:(\w+)\s+(.+)/g);
    for (const cm of customMatches) {
      funcDoc.custom[cm[1]] = cm[2].trim();
    }
    
    doc.functions.push(funcDoc);
  }

  return doc;
}

/**
 * Generate markdown documentation from NatSpec
 */
function generateMarkdown(exampleName: string, doc: NatSpecDoc, source: string): string {
  let md = `# ${doc.title || exampleName}\n\n`;
  
  if (doc.author) {
    md += `**Author:** ${doc.author}\n\n`;
  }
  
  if (doc.notice) {
    md += `> ${doc.notice}\n\n`;
  }
  
  if (doc.custom.chapter) {
    md += `**Chapter:** ${doc.custom.chapter}  \n`;
  }
  if (doc.custom.category) {
    md += `**Category:** ${doc.custom.category}  \n`;
  }
  if (doc.custom.difficulty) {
    md += `**Difficulty:** ${doc.custom.difficulty}  \n`;
  }
  md += '\n';
  
  if (doc.dev.length > 0) {
    md += `## Overview\n\n`;
    doc.dev.forEach(d => {
      md += `${d}\n\n`;
    });
  }
  
  if (doc.functions.length > 0) {
    md += `## Functions\n\n`;
    
    doc.functions.forEach(func => {
      md += `### \`${func.name}()\`\n\n`;
      
      if (func.notice) {
        md += `${func.notice}\n\n`;
      }
      
      if (func.dev.length > 0) {
        func.dev.forEach(d => {
          md += `${d}\n\n`;
        });
      }
      
      if (Object.keys(func.params).length > 0) {
        md += `**Parameters:**\n`;
        Object.entries(func.params).forEach(([name, desc]) => {
          md += `- \`${name}\`: ${desc}\n`;
        });
        md += '\n';
      }
      
      if (func.returns) {
        md += `**Returns:** ${func.returns}\n\n`;
      }
    });
  }
  
  // Add source code
  md += `## Source Code\n\n`;
  md += '```solidity\n';
  md += source;
  md += '\n```\n';
  
  return md;
}

/**
 * Generate GitBook SUMMARY.md
 */
function generateSummary(docs: Map<string, { chapter: string; order: number; title: string }>): string {
  let summary = `# Summary\n\n`;
  summary += `* [Introduction](README.md)\n\n`;
  
  // Group by chapter
  const chapters = new Map<string, Array<{ name: string; title: string; order: number }>>();
  
  docs.forEach((config, name) => {
    if (!chapters.has(config.chapter)) {
      chapters.set(config.chapter, []);
    }
    chapters.get(config.chapter)!.push({ name, title: config.title, order: config.order });
  });
  
  // Sort chapters
  const chapterOrder = ['basic', 'encryption', 'decryption', 'access-control', 'anti-patterns', 'advanced'];
  
  chapterOrder.forEach(chapter => {
    if (chapters.has(chapter)) {
      const items = chapters.get(chapter)!;
      items.sort((a, b) => a.order - b.order);
      
      const chapterTitle = chapter.charAt(0).toUpperCase() + chapter.slice(1).replace('-', ' ');
      summary += `## ${chapterTitle}\n\n`;
      
      items.forEach(item => {
        summary += `* [${item.title}](${chapter}/${item.name}.md)\n`;
      });
      summary += '\n';
    }
  });
  
  return summary;
}

/**
 * Main function to generate documentation
 */
async function generateDocs(exampleName?: string): Promise<void> {
  const rootDir = path.resolve(__dirname, '..');
  const docsDir = path.join(rootDir, 'docs', 'examples');
  
  // Create docs directory
  fs.mkdirSync(docsDir, { recursive: true });
  
  const examplesToProcess = exampleName && exampleName !== '--all'
    ? { [exampleName]: EXAMPLES_CONFIG[exampleName] }
    : EXAMPLES_CONFIG;
  
  const generatedDocs = new Map<string, { chapter: string; order: number; title: string }>();
  
  for (const [name, config] of Object.entries(examplesToProcess)) {
    if (!config) {
      console.error(`❌ Unknown example: ${name}`);
      continue;
    }
    
    const contractPath = path.join(rootDir, config.contract);
    if (!fs.existsSync(contractPath)) {
      console.error(`❌ Contract not found: ${contractPath}`);
      continue;
    }
    
    console.log(`📝 Generating docs for: ${name}`);
    
    const source = fs.readFileSync(contractPath, 'utf-8');
    const natspec = extractNatSpec(source);
    const markdown = generateMarkdown(name, natspec, source);
    
    // Create chapter directory
    const chapterDir = path.join(docsDir, config.chapter);
    fs.mkdirSync(chapterDir, { recursive: true });
    
    // Write markdown file
    const mdPath = path.join(chapterDir, `${name}.md`);
    fs.writeFileSync(mdPath, markdown);
    
    generatedDocs.set(name, {
      chapter: config.chapter,
      order: config.order,
      title: natspec.title || name,
    });
  }
  
  // Generate SUMMARY.md for GitBook
  if (!exampleName || exampleName === '--all') {
    console.log('📚 Generating SUMMARY.md...');
    const summary = generateSummary(generatedDocs);
    fs.writeFileSync(path.join(docsDir, 'SUMMARY.md'), summary);
    
    // Generate README
    const readme = `# FHEVM Examples Documentation

This documentation covers various examples of using Zama's FHEVM for building privacy-preserving smart contracts.

## Categories

- **Basic**: Counter, arithmetic, comparisons
- **Encryption**: Single and multiple value encryption
- **Decryption**: Public decryption patterns
- **Access Control**: Permission management
- **Anti-Patterns**: Common mistakes to avoid
- **Advanced**: Complex examples like salary aggregation

## Quick Links

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Protocol Examples](https://docs.zama.org/protocol/examples)
- [GitHub Repository](https://github.com/zama-ai)
`;
    fs.writeFileSync(path.join(docsDir, 'README.md'), readme);
  }
  
  console.log(`\n✅ Documentation generated at: ${docsDir}`);
}

// CLI entry point
const args = process.argv.slice(2);
const exampleName = args[0] || '--all';

generateDocs(exampleName);
