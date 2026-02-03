import { LanguageConfig } from './index';

export const TYPESCRIPT_CONFIG: LanguageConfig = {
  id: 'typescript',
  name: 'typescript',
  displayName: 'TypeScript (Solana)',
  fileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  priority: 'critical',
  category: 'solana-native',
  description: 'TypeScript/JavaScript for Solana client development and testing',
  
  syntax: {
    keywords: [
      'abstract', 'any', 'as', 'asserts', 'async', 'await', 'boolean', 'break', 'case', 'catch',
      'class', 'const', 'constructor', 'continue', 'declare', 'default', 'delete', 'do', 'else',
      'enum', 'export', 'extends', 'false', 'finally', 'for', 'from', 'function', 'get',
      'if', 'implements', 'import', 'in', 'instanceof', 'interface', 'is', 'let', 'module',
      'namespace', 'new', 'null', 'number', 'object', 'of', 'package', 'private', 'protected',
      'public', 'readonly', 'return', 'set', 'static', 'string', 'super', 'switch', 'symbol',
      'this', 'throw', 'true', 'try', 'type', 'typeof', 'undefined', 'var', 'void', 'while',
      'with', 'yield'
    ],
    types: [
      'string', 'number', 'boolean', 'object', 'undefined', 'null', 'void', 'any', 'unknown',
      'never', 'Array', 'Promise', 'PublicKey', 'Keypair', 'Connection', 'Transaction',
      'SystemProgram', 'LAMPORTS_PER_SOL', 'AccountInfo', 'Commitment', 'SendOptions'
    ],
    operators: [
      '+', '-', '*', '/', '%', '**', '++', '--', '=', '+=', '-=', '*=', '/=', '%=', '**=',
      '==', '===', '!=', '!==', '<', '>', '<=', '>=', '&&', '||', '!', '&', '|', '^', '~',
      '<<', '>>', '>>>', '?', ':', '??', '?.', '...', '=>'
    ],
    builtins: [
      'console', 'JSON', 'Math', 'Date', 'RegExp', 'Promise', 'setTimeout', 'setInterval',
      'clearTimeout', 'clearInterval', 'parseInt', 'parseFloat', 'isNaN', 'isFinite',
      'encodeURIComponent', 'decodeURIComponent'
    ]
  },

  snippets: [
    {
      label: 'Solana Connection Setup',
      description: 'Initialize connection to Solana cluster',
      prefix: 'solana-connection',
      category: 'client',
      body: [
        'import { Connection, clusterApiUrl, Commitment } from \'@solana/web3.js\';',
        '',
        'const commitment: Commitment = \'${1|confirmed,finalized,processed|}\';',
        'const endpoint = ${2|clusterApiUrl(\'devnet\')|clusterApiUrl(\'testnet\')|clusterApiUrl(\'mainnet-beta\')|\'http://127.0.0.1:8899\'|};',
        'const connection = new Connection(endpoint, commitment);'
      ]
    },
    {
      label: 'Anchor Provider Setup',
      description: 'Setup Anchor provider and program',
      prefix: 'anchor-provider',
      category: 'client',
      body: [
        'import { AnchorProvider, Program, Wallet } from \'@project-serum/anchor\';',
        'import { Connection, Keypair, PublicKey } from \'@solana/web3.js\';',
        'import { ${1:ProgramName} } from \'./types/${1:program_name}\';',
        '',
        'const connection = new Connection(\'${2:http://127.0.0.1:8899}\');',
        'const wallet = new Wallet(${3:keypair});',
        'const provider = new AnchorProvider(connection, wallet, {});',
        '',
        'const programId = new PublicKey(\'${4:PROGRAM_ID}\');',
        'const program = new Program<${1:ProgramName}>(${5:idl}, programId, provider);'
      ]
    },
    {
      label: 'Jupiter Swap Integration',
      description: 'Jupiter SDK swap implementation',
      prefix: 'jupiter-swap',
      category: 'utility',
      body: [
        'import { Jupiter, RouteInfo, TOKEN_LIST_URL } from \'@jup-ag/core\';',
        'import { Connection, PublicKey, Keypair } from \'@solana/web3.js\';',
        '',
        'const connection = new Connection(\'${1:RPC_ENDPOINT}\');',
        'const jupiter = await Jupiter.load({',
        '  connection,',
        '  cluster: \'${2|mainnet-beta,devnet,testnet|}\',',
        '  user: ${3:wallet.publicKey},',
        '});',
        '',
        'const routes: RouteInfo[] = await jupiter.computeRoutes({',
        '  inputMint: new PublicKey(\'${4:INPUT_MINT}\'),',
        '  outputMint: new PublicKey(\'${5:OUTPUT_MINT}\'),',
        '  amount: ${6:amount},',
        '  slippageBps: ${7:100}, // 1%',
        '});',
        '',
        'const { execute } = await jupiter.exchange({',
        '  routeInfo: routes[0],',
        '});',
        'const swapResult = await execute();'
      ]
    },
    {
      label: 'Token Account Operations',
      description: 'SPL Token account creation and management',
      prefix: 'token-account',
      category: 'utility',
      body: [
        'import {',
        '  createAssociatedTokenAccountInstruction,',
        '  getAssociatedTokenAddress,',
        '  TOKEN_PROGRAM_ID,',
        '  ASSOCIATED_TOKEN_PROGRAM_ID',
        '} from \'@solana/spl-token\';',
        'import { Connection, PublicKey, Transaction } from \'@solana/web3.js\';',
        '',
        'const mint = new PublicKey(\'${1:MINT_ADDRESS}\');',
        'const owner = new PublicKey(\'${2:OWNER_ADDRESS}\');',
        '',
        'const associatedTokenAddress = await getAssociatedTokenAddress(',
        '  mint,',
        '  owner',
        ');',
        '',
        'const instruction = createAssociatedTokenAccountInstruction(',
        '  ${3:payer.publicKey},',
        '  associatedTokenAddress,',
        '  owner,',
        '  mint',
        ');',
        '',
        'const transaction = new Transaction().add(instruction);'
      ]
    },
    {
      label: 'Anchor Transaction',
      description: 'Build and send Anchor transaction',
      prefix: 'anchor-tx',
      category: 'client',
      body: [
        'const tx = await program.methods',
        '  .${1:methodName}(${2:args})',
        '  .accounts({',
        '    ${3:account1: account1PublicKey},',
        '    ${4:account2: account2PublicKey},',
        '    ${5:user: provider.wallet.publicKey},',
        '    ${6:systemProgram: SystemProgram.programId},',
        '  })',
        '  .signers([${7:additionalSigners}])',
        '  .rpc();',
        '',
        'console.log("Transaction signature:", tx);'
      ]
    },
    {
      label: 'Account Data Fetching',
      description: 'Fetch and parse account data',
      prefix: 'fetch-account',
      category: 'client',
      body: [
        'const accountData = await program.account.${1:accountType}.fetch(',
        '  ${2:accountPublicKey}',
        ');',
        '',
        'console.log("Account data:", accountData);'
      ]
    },
    {
      label: 'Event Listener',
      description: 'Listen to program events',
      prefix: 'event-listener',
      category: 'utility',
      body: [
        'const listener = program.addEventListener(',
        '  \'${1:eventName}\',',
        '  (event, slot) => {',
        '    console.log(\'Event received:\', event);',
        '    console.log(\'Slot:\', slot);',
        '    ${2:// Handle event}',
        '  }',
        ');',
        '',
        '// Remove listener when done',
        '// await program.removeEventListener(listener);'
      ]
    },
    {
      label: 'Anchor Test Setup',
      description: 'Basic Anchor test structure',
      prefix: 'anchor-test',
      category: 'test',
      body: [
        'import * as anchor from \'@project-serum/anchor\';',
        'import { Program } from \'@project-serum/anchor\';',
        'import { ${1:ProgramName} } from \'../target/types/${2:program_name}\';',
        'import { expect } from \'chai\';',
        '',
        'describe(\'${3:test_description}\', () => {',
        '  const provider = anchor.AnchorProvider.env();',
        '  anchor.setProvider(provider);',
        '',
        '  const program = anchor.workspace.${1:ProgramName} as Program<${1:ProgramName}>;',
        '',
        '  it(\'${4:test_case}\', async () => {',
        '    ${5:// Test implementation}',
        '  });',
        '});'
      ]
    }
  ],

  tools: [
    {
      name: 'TypeScript Compiler',
      command: 'tsc',
      description: 'TypeScript compiler',
      category: 'compiler'
    },
    {
      name: 'Jest',
      command: 'npm run test',
      description: 'Run Jest tests',
      category: 'tester'
    },
    {
      name: 'ESLint',
      command: 'eslint',
      description: 'JavaScript/TypeScript linter',
      category: 'analyzer'
    },
    {
      name: 'Prettier',
      command: 'prettier',
      description: 'Code formatter',
      category: 'formatter'
    },
    {
      name: 'Anchor Test',
      command: 'anchor test --skip-build',
      description: 'Run Anchor TypeScript tests',
      category: 'tester'
    }
  ],

  testing: {
    framework: 'jest',
    testCommand: 'npm run test',
    testPattern: '**/*.test.{ts,js}',
    setupRequired: false
  }
};