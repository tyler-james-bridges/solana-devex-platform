/**
 * Legacy web3.js Compatibility Layer
 * Contained boundaries for web3.js integration
 */

const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');

/**
 * Main compatibility command handler
 */
async function main(options) {
  console.log(chalk.yellow('🔄 web3.js Compatibility Layer'));
  console.log(chalk.gray('Use this sparingly - prefer @solana/kit for new code'));
  
  if (options.migrate) {
    await runMigrationHelper();
  } else {
    await showCompatibilityOptions();
  }
}

/**
 * Show compatibility options
 */
async function showCompatibilityOptions() {
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        {
          name: '🔄 Migrate from web3.js to @solana/kit (Recommended)',
          value: 'migrate',
          short: 'Migrate'
        },
        {
          name: '🛠️ Create compatibility adapter',
          value: 'adapter',
          short: 'Create Adapter'
        },
        {
          name: '📊 Analyze web3.js usage',
          value: 'analyze',
          short: 'Analyze'
        },
        {
          name: '📚 Learn about official stack',
          value: 'learn',
          short: 'Learn'
        }
      ]
    }
  ]);

  switch (answers.action) {
    case 'migrate':
      await runMigrationHelper();
      break;
    case 'adapter':
      await createCompatibilityAdapter();
      break;
    case 'analyze':
      await analyzeLegacyUsage();
      break;
    case 'learn':
      await showOfficialStackInfo();
      break;
  }
}

/**
 * Migration helper from web3.js to @solana/kit
 */
async function runMigrationHelper() {
  console.log(chalk.cyan('🔄 web3.js to @solana/kit Migration Helper'));
  
  try {
    // Analyze current web3.js usage
    console.log(chalk.gray('🔍 Analyzing current web3.js usage...'));
    const analysis = await analyzeWeb3jsUsage();
    
    if (analysis.totalUsage === 0) {
      console.log(chalk.green('✅ No web3.js usage detected - you\'re already using modern patterns!'));
      return;
    }
    
    // Show migration plan
    showMigrationPlan(analysis);
    
    // Ask if user wants to proceed
    const proceed = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'proceed',
        message: 'Would you like to generate migration files?',
        default: true
      }
    ]);
    
    if (proceed.proceed) {
      await generateMigrationFiles(analysis);
    }
    
  } catch (error) {
    console.error(chalk.red(`❌ Migration analysis failed: ${error.message}`));
  }
}

/**
 * Analyze web3.js usage in project
 */
async function analyzeWeb3jsUsage() {
  const analysis = {
    files: [],
    totalUsage: 0,
    patterns: {
      connection: 0,
      publicKey: 0,
      transaction: 0,
      keypair: 0,
      instruction: 0,
      systemProgram: 0,
      other: 0
    },
    migrationComplexity: 'low'
  };
  
  try {
    // Find source files
    const sourceFiles = await findSourceFiles();
    
    for (const file of sourceFiles) {
      const content = await fs.readFile(file, 'utf-8');
      const fileAnalysis = analyzeFileForWeb3js(file, content);
      
      if (fileAnalysis.hasWeb3js) {
        analysis.files.push(fileAnalysis);
        analysis.totalUsage += fileAnalysis.usageCount;
        
        // Update pattern counts
        Object.keys(fileAnalysis.patterns).forEach(pattern => {
          analysis.patterns[pattern] += fileAnalysis.patterns[pattern];
        });
      }
    }
    
    // Determine migration complexity
    analysis.migrationComplexity = calculateMigrationComplexity(analysis);
    
  } catch (error) {
    console.warn(chalk.yellow(`⚠️ Could not analyze web3.js usage: ${error.message}`));
  }
  
  return analysis;
}

/**
 * Analyze individual file for web3.js usage
 */
function analyzeFileForWeb3js(filePath, content) {
  const analysis = {
    file: filePath,
    hasWeb3js: false,
    usageCount: 0,
    patterns: {
      connection: 0,
      publicKey: 0,
      transaction: 0,
      keypair: 0,
      instruction: 0,
      systemProgram: 0,
      other: 0
    },
    imports: [],
    migrationNotes: []
  };
  
  // Check for web3.js imports
  const importMatches = content.match(/from ['"]@solana\\/web3\\.js['"];?/g);
  if (importMatches) {
    analysis.hasWeb3js = true;
    analysis.imports = importMatches;
  }
  
  // Check for specific patterns
  const patterns = {
    connection: /new Connection\\(|Connection\\(/g,
    publicKey: /new PublicKey\\(|PublicKey\\(/g,
    transaction: /new Transaction\\(|Transaction\\(/g,
    keypair: /new Keypair\\(|Keypair\\./g,
    instruction: /TransactionInstruction/g,
    systemProgram: /SystemProgram\\./g
  };
  
  Object.entries(patterns).forEach(([patternName, regex]) => {
    const matches = content.match(regex);
    if (matches) {
      analysis.patterns[patternName] = matches.length;
      analysis.usageCount += matches.length;
      analysis.hasWeb3js = true;
    }
  });
  
  // Add migration notes based on usage
  if (analysis.patterns.connection > 0) {
    analysis.migrationNotes.push('Replace Connection with @solana/client RPC patterns');
  }
  if (analysis.patterns.publicKey > 0) {
    analysis.migrationNotes.push('Replace PublicKey with @solana/kit Address type');
  }
  if (analysis.patterns.transaction > 0) {
    analysis.migrationNotes.push('Replace Transaction with @solana/kit message patterns');
  }
  
  return analysis;
}

/**
 * Show migration plan to user
 */
function showMigrationPlan(analysis) {
  console.log(chalk.cyan('\\n📋 Migration Plan'));
  console.log(chalk.gray(`Files to migrate: ${analysis.files.length}`));
  console.log(chalk.gray(`Total web3.js usage: ${analysis.totalUsage}`));
  console.log(chalk.gray(`Complexity: ${analysis.migrationComplexity}`));
  
  console.log(chalk.cyan('\\n🔍 Usage Breakdown:'));
  Object.entries(analysis.patterns).forEach(([pattern, count]) => {
    if (count > 0) {
      console.log(chalk.gray(`  ${pattern}: ${count} occurrences`));
    }
  });
  
  console.log(chalk.cyan('\\n📝 Migration Strategy:'));
  console.log(chalk.gray('  1. Install official stack dependencies'));
  console.log(chalk.gray('  2. Create @solana/web3-compat adapters for boundaries'));
  console.log(chalk.gray('  3. Migrate core logic to @solana/kit patterns'));
  console.log(chalk.gray('  4. Remove web3.js dependencies when complete'));
  
  if (analysis.migrationComplexity === 'high') {
    console.log(chalk.yellow('\\n⚠️ High complexity migration detected'));
    console.log(chalk.gray('Consider gradual migration using compatibility adapters'));
  }
}

/**
 * Generate migration files
 */
async function generateMigrationFiles(analysis) {
  console.log(chalk.yellow('📝 Generating migration files...'));
  
  // Create migration directory
  const migrationDir = 'migration-to-official-stack';
  await fs.ensureDir(migrationDir);
  
  // Generate migration plan document
  await generateMigrationPlan(migrationDir, analysis);
  
  // Generate compatibility adapters
  await generateCompatibilityAdapters(migrationDir);
  
  // Generate example migrations for each file
  for (const fileAnalysis of analysis.files) {
    await generateFileMigrationExample(migrationDir, fileAnalysis);
  }
  
  console.log(chalk.green(`✅ Migration files generated in: ${migrationDir}/`));
  console.log(chalk.cyan('\\n🎯 Next Steps:'));
  console.log(chalk.gray(`  1. Review: ${migrationDir}/MIGRATION_PLAN.md`));
  console.log(chalk.gray(`  2. Install: npm install @solana/client @solana/kit @solana/web3-compat`));
  console.log(chalk.gray('  3. Start with compatibility adapters'));
  console.log(chalk.gray('  4. Gradually migrate to @solana/kit patterns'));
}

/**
 * Generate migration plan document
 */
async function generateMigrationPlan(migrationDir, analysis) {
  const planContent = `# Migration from web3.js to Official Solana Stack

## Overview
This migration plan helps you move from the legacy web3.js stack to the official Solana stack (@solana/kit + framework-kit).

## Current State Analysis
- **Files to migrate**: ${analysis.files.length}
- **Total web3.js usage**: ${analysis.totalUsage}
- **Migration complexity**: ${analysis.migrationComplexity}

## Migration Strategy

### Phase 1: Compatibility Setup
1. Install official stack dependencies:
   \`\`\`bash
   npm install @solana/client @solana/kit @solana/react-hooks @solana/web3-compat
   \`\`\`

2. Create compatibility adapters (see \`adapters/\` directory)

3. Test that existing functionality still works

### Phase 2: Gradual Migration
${analysis.files.map(file => `
#### ${file.file}
${file.migrationNotes.map(note => `- ${note}`).join('\\n')}
`).join('\\n')}

### Phase 3: Official Stack Adoption
1. Replace web3.js patterns with @solana/kit equivalents
2. Update React components to use @solana/react-hooks
3. Migrate testing to LiteSVM/Mollusk
4. Remove web3.js dependencies

## Pattern Migrations

### Connection → RPC Client
\`\`\`javascript
// Before (web3.js)
const connection = new Connection(endpoint);

// After (@solana/kit)
import { createDefaultRpcTransport, createSolanaRpcApi } from '@solana/client';
const transport = createDefaultRpcTransport({ url: endpoint });
const rpc = createSolanaRpcApi({ transport });
\`\`\`

### PublicKey → Address
\`\`\`javascript
// Before (web3.js)
const pubkey = new PublicKey('11111111111111111111111111111111');

// After (@solana/kit)
import type { Address } from '@solana/client';
const address: Address = '11111111111111111111111111111111' as Address;
\`\`\`

### Transaction → Message
\`\`\`javascript
// Before (web3.js)
const transaction = new Transaction();
transaction.add(instruction);

// After (@solana/kit)
import { pipe, createTransactionMessage, addInstructionsToTransactionMessage } from '@solana/client';
const message = pipe(
  createTransactionMessage({ version: 0 }),
  tx => addInstructionsToTransactionMessage([instruction], tx)
);
\`\`\`

## Benefits of Migration
✅ **Type Safety** - Full TypeScript support  
✅ **Modern APIs** - Latest Solana patterns  
✅ **Better Performance** - Optimized implementations  
✅ **Future Proof** - Official Solana direction  
✅ **Better Testing** - LiteSVM/Mollusk support  

## Support
- Official Docs: https://docs.solana.com
- Framework Kit: https://solana.com/framework-kit
- Community: https://discord.gg/solana
`;

  await fs.writeFile(path.join(migrationDir, 'MIGRATION_PLAN.md'), planContent);
}

/**
 * Create compatibility adapter
 */
async function createCompatibilityAdapter() {
  console.log(chalk.yellow('🛠️ Creating web3.js Compatibility Adapter'));
  
  const adapterDir = 'lib/compatibility';
  await fs.ensureDir(adapterDir);
  
  // Generate adapter file
  const adapterContent = generateCompatibilityAdapter();
  await fs.writeFile(path.join(adapterDir, 'web3js-adapter.ts'), adapterContent);
  
  console.log(chalk.green(`✅ Compatibility adapter created: ${adapterDir}/web3js-adapter.ts`));
  console.log(chalk.cyan('\\n💡 Usage:'));
  console.log(chalk.gray('  import { Web3jsAdapter } from \'./lib/compatibility/web3js-adapter\''));
  console.log(chalk.gray('  const adapter = new Web3jsAdapter(kitRpcClient)'));
  console.log(chalk.gray('  const web3jsConnection = adapter.getWeb3jsConnection()'));
}

/**
 * Generate compatibility adapter code
 */
function generateCompatibilityAdapter() {
  return `import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { fromWeb3JsPublicKey, toWeb3JsPublicKey, fromWeb3JsTransaction, toWeb3JsTransaction } from '@solana/web3-compat';
import type { Rpc, Address } from '@solana/client';

/**
 * Compatibility adapter for web3.js integration
 * Use this ONLY at boundaries where you must interact with web3.js code
 * Prefer @solana/kit patterns for all new code
 */
export class Web3jsAdapter {
  private rpc: Rpc<any>;
  
  constructor(rpc: Rpc<any>) {
    this.rpc = rpc;
  }

  /**
   * Get web3.js Connection for libraries that require it
   * WARNING: This creates a boundary - contain web3.js usage to this boundary
   */
  getWeb3jsConnection(): Connection {
    // This is a simplified example - you'll need to implement proper conversion
    // based on your specific RPC client setup
    console.warn('⚠️ Using web3.js compatibility layer - consider migrating to @solana/kit');
    
    // Return a web3.js Connection that delegates to your @solana/kit RPC
    return new Connection('http://localhost:8899'); // Placeholder
  }

  /**
   * Convert @solana/kit Address to web3.js PublicKey
   */
  addressToPublicKey(address: Address): PublicKey {
    return toWeb3JsPublicKey(address);
  }

  /**
   * Convert web3.js PublicKey to @solana/kit Address  
   */
  publicKeyToAddress(publicKey: PublicKey): Address {
    return fromWeb3JsPublicKey(publicKey);
  }

  /**
   * Convert web3.js Transaction to @solana/kit format
   */
  transactionFromWeb3js(transaction: Transaction) {
    return fromWeb3JsTransaction(transaction);
  }

  /**
   * Convert @solana/kit transaction to web3.js format
   */
  transactionToWeb3js(kitTransaction: any): Transaction {
    return toWeb3JsTransaction(kitTransaction);
  }
}

/**
 * Helper function for gradual migration
 * Use this to wrap web3.js code while migrating
 */
export function withWeb3jsCompatibility<T>(
  adapter: Web3jsAdapter,
  web3jsCode: (connection: Connection) => Promise<T>
): Promise<T> {
  console.warn('⚠️ Executing web3.js compatibility code - plan migration to @solana/kit');
  
  const connection = adapter.getWeb3jsConnection();
  return web3jsCode(connection);
}

/**
 * Migration helper - logs web3.js usage for tracking
 */
export function trackWeb3jsUsage(location: string, pattern: string) {
  console.log(\`📊 web3.js usage tracked: \${pattern} at \${location}\`);
  // You could send this to analytics/logging service
}
`;
}

/**
 * Analyze legacy usage in project
 */
async function analyzeLegacyUsage() {
  console.log(chalk.yellow('🔍 Analyzing Legacy Usage...'));
  
  const analysis = await analyzeWeb3jsUsage();
  
  if (analysis.totalUsage === 0) {
    console.log(chalk.green('✅ No web3.js usage detected!'));
    console.log(chalk.cyan('🎉 Your project is already using modern Solana patterns'));
    return;
  }
  
  // Show detailed analysis
  console.log(chalk.cyan('\\n📊 Legacy Usage Analysis:'));
  console.log(chalk.gray(`Total files: ${analysis.files.length}`));
  console.log(chalk.gray(`Total usage: ${analysis.totalUsage}`));
  
  console.log(chalk.cyan('\\n🔍 Pattern Breakdown:'));
  Object.entries(analysis.patterns).forEach(([pattern, count]) => {
    if (count > 0) {
      const severity = count > 10 ? chalk.red : count > 5 ? chalk.yellow : chalk.gray;
      console.log(severity(`  ${pattern}: ${count}`));
    }
  });
  
  console.log(chalk.cyan('\\n📝 Files with Legacy Code:'));
  analysis.files.forEach(file => {
    console.log(chalk.gray(`  📄 ${file.file} (${file.usageCount} occurrences)`));
  });
  
  console.log(chalk.cyan('\\n💡 Recommendations:'));
  if (analysis.migrationComplexity === 'high') {
    console.log(chalk.yellow('  • High complexity - consider gradual migration'));
    console.log(chalk.gray('  • Use compatibility adapters at boundaries'));
    console.log(chalk.gray('  • Migrate one component at a time'));
  } else {
    console.log(chalk.green('  • Migration should be straightforward'));
    console.log(chalk.gray('  • Consider full migration to @solana/kit'));
  }
  
  console.log(chalk.gray('  • Run: solana-devex compat --migrate for migration help'));
}

/**
 * Show information about the official stack
 */
async function showOfficialStackInfo() {
  console.log(chalk.cyan('📚 Official Solana Stack Information'));
  
  console.log(chalk.cyan('\\n🎯 Why Migrate?'));
  console.log(chalk.green('  ✅ Type Safety') + chalk.gray(' - Full TypeScript support'));
  console.log(chalk.green('  ✅ Modern APIs') + chalk.gray(' - Latest Solana patterns'));
  console.log(chalk.green('  ✅ Performance') + chalk.gray(' - Optimized implementations'));
  console.log(chalk.green('  ✅ Future Proof') + chalk.gray(' - Official Solana direction'));
  console.log(chalk.green('  ✅ Better Testing') + chalk.gray(' - LiteSVM/Mollusk support'));
  
  console.log(chalk.cyan('\\n🛠️ Official Stack Components:'));
  console.log(chalk.gray('  📦 @solana/client') + ' - Modern RPC client');
  console.log(chalk.gray('  📦 @solana/kit') + ' - Comprehensive SDK');
  console.log(chalk.gray('  📦 @solana/react-hooks') + ' - React integration');
  console.log(chalk.gray('  📦 @solana/web3-compat') + ' - Migration helpers');
  
  console.log(chalk.cyan('\\n🚀 Getting Started:'));
  console.log(chalk.gray('  1. solana-devex init my-project --template react-kit'));
  console.log(chalk.gray('  2. solana-devex compat --migrate (for existing projects)'));
  console.log(chalk.gray('  3. solana-devex test unit (fast testing with LiteSVM)'));
  
  console.log(chalk.cyan('\\n📚 Resources:'));
  console.log(chalk.gray('  • Official Docs: https://docs.solana.com'));
  console.log(chalk.gray('  • Framework Kit: https://solana.com/framework-kit'));
  console.log(chalk.gray('  • @solana/kit Guide: https://solana.com/kit'));
}

/**
 * Utility functions
 */
async function findSourceFiles() {
  const patterns = ['src/**/*.{js,ts,jsx,tsx}', 'lib/**/*.{js,ts}', 'app/**/*.{js,ts,jsx,tsx}'];
  const files = [];
  
  for (const pattern of patterns) {
    try {
      const glob = require('glob');
      const matched = await new Promise((resolve, reject) => {
        glob(pattern, (err, matches) => {
          if (err) reject(err);
          else resolve(matches);
        });
      });
      files.push(...matched);
    } catch (error) {
      // Pattern not found, continue
    }
  }
  
  return [...new Set(files)]; // Remove duplicates
}

function calculateMigrationComplexity(analysis) {
  const totalUsage = analysis.totalUsage;
  const fileCount = analysis.files.length;
  
  if (totalUsage > 50 || fileCount > 10) return 'high';
  if (totalUsage > 20 || fileCount > 5) return 'medium';
  return 'low';
}

async function generateCompatibilityAdapters(migrationDir) {
  const adaptersDir = path.join(migrationDir, 'adapters');
  await fs.ensureDir(adaptersDir);
  
  const adapterContent = generateCompatibilityAdapter();
  await fs.writeFile(path.join(adaptersDir, 'web3js-adapter.ts'), adapterContent);
  
  // Generate usage examples
  const exampleContent = `// Example: Using compatibility adapter for gradual migration

import { Web3jsAdapter } from './web3js-adapter';
import { createSolanaRpcApi, createDefaultRpcTransport } from '@solana/client';

// Your new @solana/kit RPC client
const transport = createDefaultRpcTransport({ url: 'http://localhost:8899' });
const rpc = createSolanaRpcApi({ transport });

// Create compatibility adapter
const adapter = new Web3jsAdapter(rpc);

// Use with legacy code that expects web3.js Connection
const legacyConnection = adapter.getWeb3jsConnection();

// Example: Legacy library that needs web3.js Connection
function legacyFunction(connection) {
  // This function expects web3.js Connection
  return connection.getBalance(publicKey);
}

// Use adapter to bridge the gap
const balance = await legacyFunction(legacyConnection);
`;

  await fs.writeFile(path.join(adaptersDir, 'usage-example.ts'), exampleContent);
}

async function generateFileMigrationExample(migrationDir, fileAnalysis) {
  const examplesDir = path.join(migrationDir, 'examples');
  await fs.ensureDir(examplesDir);
  
  const fileName = path.basename(fileAnalysis.file, path.extname(fileAnalysis.file));
  const exampleContent = `// Migration example for: ${fileAnalysis.file}
//
// Migration Notes:
${fileAnalysis.migrationNotes.map(note => `// - ${note}`).join('\\n')}
//
// Patterns found:
${Object.entries(fileAnalysis.patterns).map(([pattern, count]) => 
  count > 0 ? `// - ${pattern}: ${count} occurrences` : ''
).filter(Boolean).join('\\n')}

// TODO: Add specific migration examples based on the patterns found in this file
`;

  await fs.writeFile(path.join(examplesDir, `${fileName}-migration.md`), exampleContent);
}

module.exports = {
  main
};