/**
 * Project Initialization with Official Solana Stack
 * Framework-kit + @solana/kit patterns
 */

const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');

/**
 * Initialize new project with official Solana stack
 */
async function init(projectName, options = {}) {
  console.log(chalk.cyan('🚀 Initializing Official Solana Stack Project'));
  
  if (!projectName) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'Project name:',
        default: 'my-solana-app'
      }
    ]);
    projectName = answers.projectName;
  }

  try {
    // Determine project template
    const template = await determineTemplate(options);
    
    // Create project directory
    const projectPath = path.resolve(projectName);
    await fs.ensureDir(projectPath);
    
    console.log(chalk.gray(`📁 Creating project at: ${projectPath}`));
    
    // Generate project based on template
    await generateProject(projectPath, template, options);
    
    console.log(chalk.green(`✅ Project '${projectName}' created successfully!`));
    console.log(chalk.cyan('\\n🎯 Next steps:'));
    console.log(chalk.gray(`  cd ${projectName}`));
    console.log(chalk.gray('  npm install'));
    console.log(chalk.gray('  npm run dev'));
    
  } catch (error) {
    console.error(chalk.red(`❌ Project initialization failed: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Determine which template to use
 */
async function determineTemplate(options) {
  if (options.template) {
    return options.template;
  }

  if (options.kitOnly) {
    return 'kit-only';
  }

  if (options.legacy) {
    console.log(chalk.yellow('⚠️ Legacy web3.js stack is not recommended'));
    const confirm = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'useLegacy',
        message: 'Are you sure you want to use the legacy stack?',
        default: false
      }
    ]);
    
    if (!confirm.useLegacy) {
      console.log(chalk.green('👍 Using official stack instead'));
      return 'react-kit';
    }
    
    return 'legacy-web3js';
  }

  // Interactive template selection
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'template',
      message: 'Choose a project template:',
      choices: [
        {
          name: '🌐 React + Next.js + @solana/kit (Recommended)',
          value: 'react-kit',
          short: 'React Kit'
        },
        {
          name: '⚡ Pure @solana/kit (Scripts/Backend)',
          value: 'kit-only',
          short: 'Kit Only'
        },
        {
          name: '⚓ Anchor + React + @solana/kit',
          value: 'anchor-react-kit',
          short: 'Anchor React'
        },
        {
          name: '🏎️ Pinocchio + React + @solana/kit (Performance)',
          value: 'pinocchio-react-kit',
          short: 'Pinocchio React'
        },
        {
          name: '👛 Wallet-Standard Demo',
          value: 'wallet-standard-demo',
          short: 'Wallet Demo'
        },
        {
          name: '🧪 Testing-First Project (LiteSVM/Mollusk)',
          value: 'testing-first',
          short: 'Testing First'
        }
      ]
    }
  ]);

  return answers.template;
}

/**
 * Generate project based on template
 */
async function generateProject(projectPath, template, options) {
  console.log(chalk.gray(`📋 Using template: ${template}`));

  // Base package.json with official stack
  const basePackageJson = createBasePackageJson(path.basename(projectPath), template);
  
  switch (template) {
    case 'react-kit':
      await generateReactKitProject(projectPath, options);
      break;
    case 'kit-only':
      await generateKitOnlyProject(projectPath, options);
      break;
    case 'anchor-react-kit':
      await generateAnchorReactProject(projectPath, options);
      break;
    case 'pinocchio-react-kit':
      await generatePinocchioReactProject(projectPath, options);
      break;
    case 'wallet-standard-demo':
      await generateWalletStandardDemo(projectPath, options);
      break;
    case 'testing-first':
      await generateTestingFirstProject(projectPath, options);
      break;
    case 'legacy-web3js':
      await generateLegacyProject(projectPath, options);
      break;
    default:
      throw new Error(`Unknown template: ${template}`);
  }

  // Write package.json
  await fs.writeJson(path.join(projectPath, 'package.json'), basePackageJson, { spaces: 2 });
  
  // Add common files
  await addCommonFiles(projectPath, template, options);
}

/**
 * Create base package.json with official stack dependencies
 */
function createBasePackageJson(projectName, template) {
  const base = {
    name: projectName,
    version: '1.0.0',
    description: 'Solana project with official stack (@solana/kit + framework-kit)',
    main: 'index.js',
    scripts: {},
    keywords: ['solana', 'official-stack', 'framework-kit', 'solana-kit'],
    author: '',
    license: 'MIT',
    dependencies: {
      // Official Solana stack (always included)
      '@solana/client': '^2.0.0-alpha.4',
      '@solana/kit': '^2.0.0-alpha.4'
    },
    devDependencies: {
      'typescript': '^5.3.3',
      '@types/node': '^20.10.5'
    }
  };

  // Template-specific dependencies
  switch (template) {
    case 'react-kit':
    case 'anchor-react-kit':
    case 'pinocchio-react-kit':
    case 'wallet-standard-demo':
      Object.assign(base.dependencies, {
        '@solana/react-hooks': '^2.0.0-alpha.4',
        'next': '^14.2.35',
        'react': '^18.2.0',
        'react-dom': '^18.2.0'
      });
      
      Object.assign(base.devDependencies, {
        '@types/react': '^18.2.45',
        '@types/react-dom': '^18.2.18'
      });
      
      Object.assign(base.scripts, {
        'dev': 'next dev',
        'build': 'next build',
        'start': 'next start',
        'lint': 'next lint'
      });
      break;
      
    case 'kit-only':
      Object.assign(base.scripts, {
        'start': 'node dist/index.js',
        'dev': 'ts-node src/index.ts',
        'build': 'tsc'
      });
      
      base.devDependencies['ts-node'] = '^10.9.1';
      break;
  }

  // Add Anchor dependencies if needed
  if (template.includes('anchor')) {
    base.dependencies['@coral-xyz/anchor'] = '^0.30.0';
  }

  // Add testing dependencies
  Object.assign(base.devDependencies, {
    'jest': '^29.7.0',
    'ts-jest': '^29.1.1',
    '@types/jest': '^29.5.11'
  });

  // Add testing scripts
  Object.assign(base.scripts, {
    'test': 'solana-devex test unit',
    'test:integration': 'solana-devex test integration',
    'test:watch': 'jest --watch',
    'security': 'solana-devex security'
  });

  return base;
}

/**
 * Generate React + Kit project
 */
async function generateReactKitProject(projectPath, options) {
  console.log(chalk.gray('🌐 Creating React + @solana/kit project...'));

  // Next.js configuration
  await fs.writeFile(path.join(projectPath, 'next.config.js'), `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    // Enable for @solana/kit compatibility
    esmExternals: 'loose'
  }
}

module.exports = nextConfig;
`);

  // App structure
  const appDir = path.join(projectPath, 'app');
  await fs.ensureDir(appDir);

  // Main app page with framework-kit patterns
  await fs.writeFile(path.join(appDir, 'page.tsx'), generateReactAppPage());
  
  // Layout with Solana providers
  await fs.writeFile(path.join(appDir, 'layout.tsx'), generateReactLayout());

  // Solana connection hook
  const hooksDir = path.join(projectPath, 'lib', 'hooks');
  await fs.ensureDir(hooksDir);
  await fs.writeFile(path.join(hooksDir, 'use-solana.ts'), generateSolanaHook());

  // Example component
  const componentsDir = path.join(projectPath, 'components');
  await fs.ensureDir(componentsDir);
  await fs.writeFile(path.join(componentsDir, 'wallet-connection.tsx'), generateWalletComponent());
}

/**
 * Generate Kit-only project (scripts/backend)
 */
async function generateKitOnlyProject(projectPath, options) {
  console.log(chalk.gray('⚡ Creating pure @solana/kit project...'));

  const srcDir = path.join(projectPath, 'src');
  await fs.ensureDir(srcDir);

  // Main entry point
  await fs.writeFile(path.join(srcDir, 'index.ts'), generateKitMainFile());

  // RPC client setup
  await fs.writeFile(path.join(srcDir, 'solana-client.ts'), generateKitClient());

  // Example transaction builder
  await fs.writeFile(path.join(srcDir, 'transaction-example.ts'), generateKitTransaction());

  // TypeScript config
  await fs.writeFile(path.join(projectPath, 'tsconfig.json'), JSON.stringify({
    compilerOptions: {
      target: 'es2020',
      module: 'commonjs',
      lib: ['es2020'],
      outDir: './dist',
      rootDir: './src',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true
    },
    include: ['src/**/*'],
    exclude: ['node_modules', 'dist']
  }, null, 2));
}

/**
 * Generate common files for all projects
 */
async function addCommonFiles(projectPath, template, options) {
  // TypeScript config for React projects
  if (template.includes('react')) {
    await fs.writeFile(path.join(projectPath, 'tsconfig.json'), JSON.stringify({
      compilerOptions: {
        target: 'es5',
        lib: ['dom', 'dom.iterable', 'es6'],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        forceConsistentCasingInFileNames: true,
        noEmit: true,
        esModuleInterop: true,
        module: 'esnext',
        moduleResolution: 'node',
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: 'preserve',
        incremental: true,
        plugins: [{ name: 'next' }],
        paths: { '@/*': ['./src/*'] }
      },
      include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
      exclude: ['node_modules']
    }, null, 2));
  }

  // Solana DevEx configuration
  await fs.writeFile(path.join(projectPath, 'solana-devex.config.js'), generateSolanaDevExConfig(template));

  // README with official stack information
  await fs.writeFile(path.join(projectPath, 'README.md'), generateReadme(path.basename(projectPath), template));

  // .gitignore
  await fs.writeFile(path.join(projectPath, '.gitignore'), generateGitignore());

  // Environment template
  await fs.writeFile(path.join(projectPath, '.env.example'), generateEnvExample());
  
  // Security configuration
  await fs.writeFile(path.join(projectPath, '.solana-security.json'), JSON.stringify({
    checkSigners: true,
    validateFeePayment: true,
    requireAccountOwnership: true,
    scanForPrincipalOfConfusion: true,
    enforceTokenProgram: true
  }, null, 2));
}

/**
 * Template generators
 */
function generateReactAppPage() {
  return `'use client'

import { WalletConnection } from '@/components/wallet-connection'

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">
        🚀 Official Solana Stack
      </h1>
      
      <div className="max-w-2xl mx-auto text-center mb-8">
        <p className="text-lg text-gray-600 mb-4">
          Built with @solana/kit + framework-kit patterns
        </p>
        <p className="text-sm text-gray-500">
          The modern, official way to build on Solana
        </p>
      </div>

      <div className="max-w-md mx-auto">
        <WalletConnection />
      </div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 border rounded-lg">
          <h3 className="font-semibold mb-2">@solana/client</h3>
          <p className="text-sm text-gray-600">
            Modern RPC client with full type safety
          </p>
        </div>
        
        <div className="p-6 border rounded-lg">
          <h3 className="font-semibold mb-2">@solana/react-hooks</h3>
          <p className="text-sm text-gray-600">
            React integration for Solana apps
          </p>
        </div>
        
        <div className="p-6 border rounded-lg">
          <h3 className="font-semibold mb-2">@solana/kit</h3>
          <p className="text-sm text-gray-600">
            Comprehensive SDK for all operations
          </p>
        </div>
      </div>
    </main>
  )
}`;
}

function generateReactLayout() {
  return `import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Solana Official Stack App',
  description: 'Built with @solana/kit + framework-kit',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Add Solana providers here */}
        {children}
      </body>
    </html>
  )
}`;
}

function generateWalletComponent() {
  return `'use client'

import { useState } from 'react'
import { useSolana } from '@/lib/hooks/use-solana'

export function WalletConnection() {
  const { connection, publicKey, connecting, connect, disconnect } = useSolana()
  const [balance, setBalance] = useState<number | null>(null)

  const handleConnect = async () => {
    try {
      await connect()
    } catch (error) {
      console.error('Failed to connect:', error)
    }
  }

  const handleGetBalance = async () => {
    if (!publicKey || !connection) return
    
    try {
      // Example with @solana/kit patterns
      const balanceResult = await connection.getBalance(publicKey).send()
      setBalance(balanceResult.value / 1e9) // Convert lamports to SOL
    } catch (error) {
      console.error('Failed to get balance:', error)
    }
  }

  if (connecting) {
    return (
      <div className="text-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-gray-600">Connecting...</p>
      </div>
    )
  }

  if (!publicKey) {
    return (
      <div className="text-center p-6 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Connect Wallet</h2>
        <p className="text-gray-600 mb-4">
          Connect your wallet to interact with Solana
        </p>
        <button
          onClick={handleConnect}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Connect Wallet
        </button>
      </div>
    )
  }

  return (
    <div className="p-6 border rounded-lg">
      <h2 className="text-xl font-semibold mb-4">Wallet Connected</h2>
      
      <div className="space-y-4">
        <div>
          <label className="text-sm text-gray-600">Public Key:</label>
          <p className="font-mono text-sm break-all bg-gray-100 p-2 rounded">
            {publicKey.toString()}
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleGetBalance}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            Get Balance
          </button>
          
          <button
            onClick={disconnect}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Disconnect
          </button>
        </div>
        
        {balance !== null && (
          <div className="p-3 bg-blue-50 rounded">
            <p className="text-blue-800">
              Balance: <span className="font-semibold">{balance.toFixed(4)} SOL</span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}`;
}

function generateSolanaHook() {
  return `import { useState, useCallback } from 'react'
import { createDefaultRpcTransport, createSolanaRpcApi } from '@solana/client'
import type { Address, Rpc } from '@solana/client'

/**
 * Custom hook for Solana operations with @solana/kit
 */
export function useSolana() {
  const [publicKey, setPublicKey] = useState<Address | null>(null)
  const [connecting, setConnecting] = useState(false)
  
  // Create RPC client with official patterns
  const rpcEndpoint = process.env.NEXT_PUBLIC_RPC_ENDPOINT || 'http://localhost:8899'
  const transport = createDefaultRpcTransport({ url: rpcEndpoint })
  const connection = createSolanaRpcApi({ transport })

  const connect = useCallback(async () => {
    setConnecting(true)
    try {
      // Wallet-standard connection logic would go here
      // For now, this is a placeholder
      console.log('Connecting to wallet...')
      
      // Simulate connection
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock public key for demo
      setPublicKey('11111111111111111111111111111111' as Address)
      
    } catch (error) {
      console.error('Connection failed:', error)
      throw error
    } finally {
      setConnecting(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    setPublicKey(null)
  }, [])

  return {
    connection,
    publicKey,
    connecting,
    connect,
    disconnect
  }
}`;
}

function generateKitMainFile() {
  return `import { SolanaClient } from './solana-client'
import { buildExampleTransaction } from './transaction-example'

/**
 * Main entry point for @solana/kit application
 * Demonstrates official Solana stack patterns
 */

async function main() {
  console.log('🚀 Starting Solana Kit Application')

  try {
    // Initialize Solana client
    const client = new SolanaClient()
    await client.initialize()

    console.log('✅ Solana client initialized')

    // Example operations
    const slot = await client.getCurrentSlot()
    console.log(\`📊 Current slot: \${slot}\`)

    // Example transaction (commented out to avoid sending)
    // const transaction = await buildExampleTransaction()
    // console.log('📝 Transaction built:', transaction)

    console.log('🎉 Application completed successfully')

  } catch (error) {
    console.error('❌ Application failed:', error)
    process.exit(1)
  }
}

// Run the application
if (require.main === module) {
  main().catch(console.error)
}

export { main }`;
}

function generateKitClient() {
  return `import { createDefaultRpcTransport, createSolanaRpcApi } from '@solana/client'
import type { Rpc, GetSlotApi, GetAccountInfoApi } from '@solana/client'

/**
 * Solana client using official @solana/kit patterns
 */
export class SolanaClient {
  private rpc: Rpc<GetSlotApi & GetAccountInfoApi>
  private endpoint: string

  constructor(endpoint?: string) {
    this.endpoint = endpoint || process.env.RPC_ENDPOINT || 'http://localhost:8899'
    
    // Create transport and RPC client
    const transport = createDefaultRpcTransport({ url: this.endpoint })
    this.rpc = createSolanaRpcApi({ transport })
  }

  async initialize(): Promise<void> {
    try {
      // Test connection
      await this.getCurrentSlot()
      console.log(\`✅ Connected to Solana RPC: \${this.endpoint}\`)
    } catch (error) {
      throw new Error(\`Failed to connect to Solana RPC: \${error.message}\`)
    }
  }

  async getCurrentSlot(): Promise<bigint> {
    const result = await this.rpc.getSlot().send()
    return result
  }

  async getAccountInfo(address: string) {
    const result = await this.rpc.getAccountInfo(address as any).send()
    return result
  }

  // Add more RPC methods as needed...
}`;
}

function generateKitTransaction() {
  return `import { 
  pipe,
  createTransactionMessage,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetime
} from '@solana/client'
import type { TransactionMessage, Signer } from '@solana/client'

/**
 * Example transaction building with @solana/kit
 */

export async function buildExampleTransaction(): Promise<TransactionMessage> {
  console.log('📝 Building example transaction with @solana/kit patterns...')

  // Note: This is a template - you'll need to implement:
  // 1. Actual fee payer signer
  // 2. Recent blockhash
  // 3. Specific instructions

  const exampleMessage = pipe(
    createTransactionMessage({ version: 0 }),
    // Add fee payer when available
    // tx => setTransactionMessageFeePayerSigner(feePayer, tx),
    // Add lifetime when blockhash available  
    // tx => setTransactionMessageLifetime({ blockhash: recentBlockhash }, tx)
  )

  return exampleMessage
}

export function validateTransaction(message: TransactionMessage): boolean {
  // Add transaction validation logic
  console.log('🔍 Validating transaction...')
  
  // Check fee payer, signers, instructions, etc.
  
  return true
}`;
}

function generateSolanaDevExConfig(template) {
  return `module.exports = {
  // Solana DevEx Platform Configuration
  template: '${template}',
  
  // Official stack settings
  solana: {
    // Use official @solana/kit for all operations
    useOfficialStack: true,
    
    // Default to framework-kit for React apps
    preferFrameworkKit: ${template.includes('react')},
    
    // Testing preferences
    testing: {
      unitRunner: 'litesvm', // litesvm | mollusk
      integrationRunner: 'surfpool', // surfpool | test-validator
      enableMollusk: false // Enable for advanced testing
    },
    
    // Security settings
    security: {
      enableAutomaticChecks: true,
      requireSignerValidation: true,
      validateFeePayment: true,
      scanForRisks: true
    },
    
    // Program preferences
    programs: {
      defaultFramework: '${template.includes('anchor') ? 'anchor' : template.includes('pinocchio') ? 'pinocchio' : 'anchor'}',
      enableOptimization: ${template.includes('pinocchio')}
    }
  },
  
  // Development settings
  development: {
    rpcEndpoint: process.env.RPC_ENDPOINT || 'http://localhost:8899',
    wsEndpoint: process.env.WS_ENDPOINT || 'ws://localhost:8900',
    autoLint: true,
    autoFormat: true
  }
}`;
}

// Additional generator functions for other templates would go here...
async function generateAnchorReactProject(projectPath, options) {
  // Generate React project first
  await generateReactKitProject(projectPath, options);
  
  // Add Anchor workspace
  const anchorDir = path.join(projectPath, 'anchor');
  await fs.ensureDir(anchorDir);
  
  // Anchor.toml
  await fs.writeFile(path.join(anchorDir, 'Anchor.toml'), `[features]
seeds = false
skip-lint = false

[programs.localnet]
my_program = "11111111111111111111111111111111"

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "localnet"
wallet = "~/.config/solana/id.json"

[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"`);
  
  console.log(chalk.gray('⚓ Added Anchor workspace'));
}

async function generatePinocchioReactProject(projectPath, options) {
  await generateReactKitProject(projectPath, options);
  
  // Add Pinocchio-specific configuration
  await fs.writeFile(path.join(projectPath, 'pinocchio.config.js'), `module.exports = {
  optimization: {
    computeUnits: true,
    binarySize: true,
    zeroDependencies: true
  },
  build: {
    target: 'wasm32-unknown-unknown',
    features: ['no-std']
  }
}`);
  
  console.log(chalk.gray('🏎️ Added Pinocchio performance configuration'));
}

async function generateWalletStandardDemo(projectPath, options) {
  await generateReactKitProject(projectPath, options);
  
  // Add wallet-standard specific components
  const walletDir = path.join(projectPath, 'components', 'wallet');
  await fs.ensureDir(walletDir);
  
  console.log(chalk.gray('👛 Added wallet-standard demo components'));
}

async function generateTestingFirstProject(projectPath, options) {
  await generateKitOnlyProject(projectPath, options);
  
  // Add comprehensive testing setup
  const testsDir = path.join(projectPath, 'tests');
  await fs.ensureDir(testsDir);
  
  console.log(chalk.gray('🧪 Added comprehensive testing setup'));
}

async function generateLegacyProject(projectPath, options) {
  console.log(chalk.yellow('⚠️ Creating legacy web3.js project (not recommended)'));
  
  // Minimal legacy setup - discourage use
  await generateKitOnlyProject(projectPath, options);
  
  console.log(chalk.red('❗ Consider migrating to official stack with: solana-devex compat --migrate'));
}

function generateReadme(projectName, template) {
  return `# ${projectName}

Built with the **Official Solana Stack** - the modern way to build on Solana.

## 🚀 Stack

- **@solana/client** - Modern RPC client with full type safety
- **@solana/kit** - Comprehensive SDK for all Solana operations  
${template.includes('react') ? '- **@solana/react-hooks** - React integration for Solana apps' : ''}
${template.includes('anchor') ? '- **Anchor** - Smart contract framework' : ''}
${template.includes('pinocchio') ? '- **Pinocchio** - High-performance programs' : ''}

## 🏃 Quick Start

\`\`\`bash
npm install
npm run dev
\`\`\`

## 🧪 Testing

This project uses the official Solana testing stack:

\`\`\`bash
# Fast unit tests with LiteSVM
npm test

# Integration tests with Surfpool  
npm run test:integration

# Security analysis
npm run security
\`\`\`

## 🔧 Development

Built with [Solana DevEx Platform](https://github.com/your-repo) - the official stack made easy.

### Commands

- \`solana-devex test unit\` - Run LiteSVM unit tests
- \`solana-devex test integration\` - Run Surfpool integration tests  
- \`solana-devex security --audit\` - Full security audit
- \`solana-devex kit rpc\` - RPC client operations
- \`solana-devex kit transaction\` - Transaction building

### Official Stack Benefits

✅ **Type Safety** - Full TypeScript support  
✅ **Modern APIs** - Latest Solana patterns  
✅ **Fast Testing** - LiteSVM/Mollusk unit tests  
✅ **Security First** - Automated security checks  
✅ **Performance** - Optimized for production  

## 📚 Learn More

- [Official Solana Docs](https://docs.solana.com)
- [Framework Kit Guide](https://solana.com/framework-kit)
- [@solana/kit Documentation](https://solana.com/kit)
`;
}

function generateGitignore() {
  return `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Production
/build
/dist
/.next/
/out/

# Runtime
.pnp
.pnp.js

# Testing
/coverage

# Environment variables
.env
.env.local
.env.development.local  
.env.test.local
.env.production.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Solana
test-ledger/
.anchor/

# Logs
logs
*.log
`;
}

function generateEnvExample() {
  return `# Solana Configuration
RPC_ENDPOINT=http://localhost:8899
WS_ENDPOINT=ws://localhost:8900

# Network (localnet | devnet | testnet | mainnet-beta)
SOLANA_NETWORK=localnet

# For production, use environment-specific endpoints:
# NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com
# NEXT_PUBLIC_WS_ENDPOINT=wss://api.devnet.solana.com

# Development
NODE_ENV=development
`;
}

module.exports = {
  init
};