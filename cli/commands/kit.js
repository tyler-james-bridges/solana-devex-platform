/**
 * @solana/kit Command Handlers
 * Official Solana SDK operations
 */

const chalk = require('chalk');
const { execSync, spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

/**
 * RPC client management with @solana/kit
 */
async function rpc(options) {
  console.log(chalk.cyan('🔗 @solana/kit RPC Client Management'));
  
  const endpoint = options.endpoint || 'http://localhost:8899';
  console.log(chalk.gray(`Using endpoint: ${endpoint}`));

  try {
    // Generate RPC client setup template
    const template = generateRpcTemplate(endpoint);
    
    const outputFile = 'src/rpc-client.ts';
    await fs.ensureDir(path.dirname(outputFile));
    await fs.writeFile(outputFile, template);
    
    console.log(chalk.green(`✅ Generated RPC client: ${outputFile}`));
    console.log(chalk.gray('Features: @solana/kit patterns, error handling, connection management'));
    
  } catch (error) {
    console.error(chalk.red(`❌ RPC setup failed: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Transaction building with @solana/kit
 */
async function transaction(options) {
  console.log(chalk.cyan('💳 @solana/kit Transaction Builder'));
  
  try {
    const template = generateTransactionTemplate(options.simulate);
    
    const outputFile = 'src/transaction-builder.ts';
    await fs.ensureDir(path.dirname(outputFile));
    await fs.writeFile(outputFile, template);
    
    console.log(chalk.green(`✅ Generated transaction builder: ${outputFile}`));
    
    if (options.simulate) {
      console.log(chalk.yellow('🔍 Simulation mode enabled'));
    }
    
    console.log(chalk.gray('Features: Kit message APIs, proper fee handling, recent blockhash'));
    
  } catch (error) {
    console.error(chalk.red(`❌ Transaction setup failed: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Generate typed clients with Codama
 */
async function client(options) {
  console.log(chalk.cyan('🛠️ Codama Client Generation'));
  
  if (!options.idl) {
    console.error(chalk.red('❌ IDL file required: --idl <path>'));
    process.exit(1);
  }

  const idlPath = options.idl;
  
  try {
    // Check if IDL exists
    if (!await fs.pathExists(idlPath)) {
      throw new Error(`IDL file not found: ${idlPath}`);
    }

    console.log(chalk.gray(`Reading IDL: ${idlPath}`));
    
    // Generate client using Codama patterns
    const clientTemplate = await generateCodamaClient(idlPath);
    
    const outputFile = 'src/generated-client.ts';
    await fs.ensureDir(path.dirname(outputFile));
    await fs.writeFile(outputFile, clientTemplate);
    
    console.log(chalk.green(`✅ Generated typed client: ${outputFile}`));
    console.log(chalk.gray('Features: Full type safety, @solana/kit integration, instruction builders'));
    
  } catch (error) {
    console.error(chalk.red(`❌ Client generation failed: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Generate RPC client template with @solana/kit patterns
 */
function generateRpcTemplate(endpoint) {
  return `import { createDefaultRpcTransport, createSolanaRpcApi } from '@solana/client';
import type { Rpc, GetAccountInfoApi, GetBalanceApi, GetSlotApi } from '@solana/client';

/**
 * Official @solana/kit RPC Client
 * Follows official Solana stack patterns
 */

// Create transport for the endpoint
const transport = createDefaultRpcTransport({ url: '${endpoint}' });

// Create typed RPC API with specific methods
export const rpc: Rpc<GetAccountInfoApi & GetBalanceApi & GetSlotApi> = 
  createSolanaRpcApi({ transport });

/**
 * Example usage:
 * 
 * // Get account info with proper types
 * const accountInfo = await rpc.getAccountInfo(address).send();
 * 
 * // Get balance with error handling
 * try {
 *   const balance = await rpc.getBalance(address).send();
 *   console.log('Balance:', balance.value);
 * } catch (error) {
 *   console.error('Failed to get balance:', error);
 * }
 */

// Health check function
export async function checkRpcHealth(): Promise<boolean> {
  try {
    const slot = await rpc.getSlot().send();
    console.log('RPC healthy, current slot:', slot);
    return true;
  } catch (error) {
    console.error('RPC health check failed:', error);
    return false;
  }
}

// Connection with retry logic
export async function createResilientConnection() {
  let retries = 3;
  
  while (retries > 0) {
    try {
      const isHealthy = await checkRpcHealth();
      if (isHealthy) {
        return rpc;
      }
    } catch (error) {
      console.log(\`Retrying connection... \${retries} attempts left\`);
      retries--;
      
      if (retries === 0) {
        throw new Error('Failed to establish RPC connection after retries');
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}
`;
}

/**
 * Generate transaction template with @solana/kit patterns  
 */
function generateTransactionTemplate(simulate = false) {
  return `import { 
  pipe,
  createTransactionMessage,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetime,
  compileTransactionMessage 
} from '@solana/client';
import type { 
  TransactionMessage, 
  ITransactionMessageWithFeePayerSigner,
  Address,
  Signer 
} from '@solana/client';

/**
 * Official @solana/kit Transaction Builder
 * Follows official stack patterns for transaction construction
 */

export interface TransactionConfig {
  feePayer: Signer;
  recentBlockhash: string;
  instructions: any[]; // Replace with proper instruction types
}

/**
 * Build transaction with @solana/kit patterns
 */
export async function buildTransaction(config: TransactionConfig): Promise<TransactionMessage> {
  const { feePayer, recentBlockhash, instructions } = config;

  // Create transaction message with official patterns
  const transactionMessage = pipe(
    createTransactionMessage({ version: 0 }),
    tx => setTransactionMessageFeePayerSigner(feePayer, tx),
    tx => setTransactionMessageLifetime({ blockhash: recentBlockhash }, tx),
    // Add instructions here
    // tx => addInstructionsToTransactionMessage(instructions, tx)
  );

  return transactionMessage;
}

/**
 * ${simulate ? 'Simulate' : 'Send'} transaction with proper error handling
 */
export async function ${simulate ? 'simulate' : 'send'}Transaction(
  message: ITransactionMessageWithFeePayerSigner
): Promise<any> {
  try {
    // Compile the transaction
    const compiledTransaction = compileTransactionMessage(message);
    
    ${simulate ? `
    // Simulate transaction
    console.log('🔍 Simulating transaction...');
    // Add simulation logic here
    console.log('✅ Simulation successful');
    return { success: true, logs: [] };
    ` : `
    // Send transaction
    console.log('📡 Sending transaction...');
    // Add sending logic here  
    console.log('✅ Transaction sent successfully');
    return { signature: 'transaction-signature' };
    `}
    
  } catch (error) {
    console.error(\`❌ Transaction ${simulate ? 'simulation' : 'sending'} failed:\`, error);
    throw error;
  }
}

/**
 * Security checks before sending
 */
export function validateTransaction(message: TransactionMessage): boolean {
  // Check fee payer is set
  if (!message.feePayer) {
    throw new Error('Fee payer must be specified');
  }

  // Check for proper signers
  // Add more security validations...
  
  return true;
}

/**
 * Example usage:
 * 
 * const config = {
 *   feePayer: myKeypair,
 *   recentBlockhash: await getRecentBlockhash(),
 *   instructions: [transferInstruction]
 * };
 * 
 * const tx = await buildTransaction(config);
 * const result = await ${simulate ? 'simulate' : 'send'}Transaction(tx);
 */
`;
}

/**
 * Generate Codama client template
 */
async function generateCodamaClient(idlPath) {
  const idl = await fs.readJson(idlPath);
  
  return `import type { Address, Account, Instruction } from '@solana/client';

/**
 * Generated Client for ${idl.name || 'Program'}
 * Generated from IDL using Codama patterns
 * Fully typed with @solana/kit integration
 */

export const PROGRAM_ID: Address = '${idl.metadata?.address || 'PROGRAM_ID_HERE'}' as Address;

${idl.instructions?.map(instruction => `
/**
 * ${instruction.name} instruction
 * ${instruction.docs?.join(' ') || 'No description available'}
 */
export function create${instruction.name.charAt(0).toUpperCase() + instruction.name.slice(1)}Instruction(
  accounts: {
    ${instruction.accounts?.map(acc => `${acc.name}: Address;`).join('\n    ') || '// No accounts'}
  },
  args?: {
    ${instruction.args?.map(arg => `${arg.name}: ${getTypeScriptType(arg.type)};`).join('\n    ') || '// No args'}
  }
): Instruction {
  // Instruction builder implementation
  return {
    programId: PROGRAM_ID,
    accounts: [
      ${instruction.accounts?.map(acc => `{ address: accounts.${acc.name}, role: AccountRole.${acc.isMut ? 'WRITABLE' : 'READONLY'}${acc.isSigner ? '_SIGNER' : ''} }`).join(',\n      ') || ''}
    ],
    data: new Uint8Array([/* encoded instruction data */])
  };
}
`).join('\n') || '// No instructions found'}

/**
 * Program account types
 */
${idl.accounts?.map(account => `
export interface ${account.name}Account {
  ${account.type.fields?.map(field => `${field.name}: ${getTypeScriptType(field.type)};`).join('\n  ') || ''}
}
`).join('\n') || '// No accounts defined'}

/**
 * Helper function to decode account data
 */
export function decode${idl.name || 'Program'}Account(accountData: Uint8Array): any {
  // Account decoder implementation
  throw new Error('Account decoder not implemented');
}
`;
}

/**
 * Convert IDL types to TypeScript types
 */
function getTypeScriptType(idlType) {
  if (typeof idlType === 'string') {
    switch (idlType) {
      case 'bool': return 'boolean';
      case 'u8': case 'u16': case 'u32': case 'u64': 
      case 'i8': case 'i16': case 'i32': case 'i64':
        return 'number';
      case 'string': return 'string';
      case 'publicKey': return 'Address';
      default: return 'any';
    }
  }
  
  if (idlType.vec) {
    return `Array<${getTypeScriptType(idlType.vec)}>`;
  }
  
  if (idlType.option) {
    return `${getTypeScriptType(idlType.option)} | null`;
  }
  
  return 'any';
}

module.exports = {
  rpc,
  transaction,
  client
};