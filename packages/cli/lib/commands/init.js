const chalk = require('chalk');
const ora = require('ora');
const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');
const { spawn } = require('cross-spawn');

class InitCommand {
  constructor(globalOpts = {}) {
    this.globalOpts = globalOpts;
  }

  async execute(name, options = {}) {
    try {
      // Get project name
      const projectName = name || await this.promptForProjectName();
      const projectPath = path.resolve(projectName);
      
      console.log(chalk.bold.blue('🚀 Initializing Solana project'));
      console.log(chalk.gray(`Creating: ${projectPath}\n`));
      
      // Check if directory exists
      if (await fs.pathExists(projectPath) && !options.force) {
        const overwrite = await this.confirmOverwrite(projectPath);
        if (!overwrite) {
          console.log(chalk.yellow('Project initialization cancelled.'));
          return;
        }
      }
      
      const spinner = ora('Creating project structure...').start();
      
      // Create project directory
      await fs.ensureDir(projectPath);
      
      // Initialize based on template
      const template = await this.resolveTemplate(options.template);
      await this.createFromTemplate(projectPath, template, projectName, spinner);
      
      // Initialize git if requested
      if (options.git) {
        await this.initializeGit(projectPath, spinner);
      }
      
      // Add VS Code settings if requested
      if (options.vscode) {
        await this.addVSCodeSettings(projectPath, spinner);
      }
      
      // Install dependencies
      await this.installDependencies(projectPath, spinner);
      
      spinner.succeed(chalk.green('Project initialized successfully!'));
      
      // Display next steps
      this.displayNextSteps(projectName, projectPath);
      
    } catch (error) {
      console.error(chalk.red('\n❌ Project initialization failed:'), error.message);
      if (this.globalOpts.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }

  async promptForProjectName() {
    const { projectName } = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'Project name:',
        default: 'my-solana-app',
        validate: (input) => {
          if (!input.trim()) {
            return 'Project name is required';
          }
          if (!/^[a-z0-9-_]+$/i.test(input)) {
            return 'Project name can only contain letters, numbers, hyphens, and underscores';
          }
          return true;
        }
      }
    ]);
    
    return projectName;
  }

  async confirmOverwrite(projectPath) {
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Directory ${projectPath} already exists. Overwrite?`,
        default: false
      }
    ]);
    
    return confirm;
  }

  async resolveTemplate(templateName) {
    const templates = {
      basic: {
        name: 'Basic Solana Program',
        description: 'Simple Hello World program with tests',
        files: ['basic-program', 'basic-tests', 'basic-client']
      },
      defi: {
        name: 'DeFi Protocol',
        description: 'Token swap and liquidity pool program',
        files: ['defi-program', 'defi-tests', 'defi-client', 'defi-frontend']
      },
      nft: {
        name: 'NFT Collection',
        description: 'NFT minting and marketplace program',
        files: ['nft-program', 'nft-tests', 'nft-client', 'nft-frontend']
      },
      game: {
        name: 'On-chain Game',
        description: 'Turn-based game with state management',
        files: ['game-program', 'game-tests', 'game-client', 'game-frontend']
      }
    };
    
    const template = templates[templateName];
    if (!template) {
      throw new Error(`Unknown template: ${templateName}. Available: ${Object.keys(templates).join(', ')}`);
    }
    
    return template;
  }

  async createFromTemplate(projectPath, template, projectName, spinner) {
    spinner.text = `Creating ${template.name}...`;
    
    // Create Anchor workspace structure
    await this.createAnchorWorkspace(projectPath, projectName);
    
    // Create program files based on template
    await this.createProgramFiles(projectPath, template, projectName);
    
    // Create test files
    await this.createTestFiles(projectPath, template, projectName);
    
    // Create client files
    await this.createClientFiles(projectPath, template, projectName);
    
    // Create configuration files
    await this.createConfigFiles(projectPath, projectName);
    
    // Create README
    await this.createReadme(projectPath, template, projectName);
  }

  async createAnchorWorkspace(projectPath, projectName) {
    // Create Anchor.toml
    const anchorToml = `[features]
seeds = false
skip-lint = false

[programs.localnet]
${projectName.replace(/-/g, '_')} = "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "Localnet"
wallet = "~/.config/solana/id.json"

[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"

[test]
startup_wait = 5000
shutdown_wait = 2000

[[test.genesis]]
address = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
program = "metadata.so"
`;
    
    await fs.writeFile(path.join(projectPath, 'Anchor.toml'), anchorToml);
    
    // Create directory structure
    await fs.ensureDir(path.join(projectPath, 'programs', projectName, 'src'));
    await fs.ensureDir(path.join(projectPath, 'tests'));
    await fs.ensureDir(path.join(projectPath, 'app'));
    await fs.ensureDir(path.join(projectPath, 'migrations'));
    await fs.ensureDir(path.join(projectPath, 'target'));
    
    // Create Cargo.toml for workspace
    const cargoToml = `[workspace]
members = [
    "programs/*"
]

[profile.release]
overflow-checks = true
lto = "fat"
codegen-units = 1

[profile.release.build-override]
opt-level = 3
incremental = false
codegen-units = 1
`;
    
    await fs.writeFile(path.join(projectPath, 'Cargo.toml'), cargoToml);
  }

  async createProgramFiles(projectPath, template, projectName) {
    const programDir = path.join(projectPath, 'programs', projectName, 'src');
    
    // Create lib.rs
    const libRs = this.generateLibRs(template.name, projectName);
    await fs.writeFile(path.join(programDir, 'lib.rs'), libRs);
    
    // Create program Cargo.toml
    const programCargoToml = `[package]
name = "${projectName.replace(/-/g, '_')}"
version = "0.1.0"
description = "Created with Solana DevEx CLI"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]
name = "${projectName.replace(/-/g, '_')}"

[dependencies]
anchor-lang = "0.29.0"
anchor-spl = "0.29.0"
solana-program = "~1.16"

[features]
no-entrypoint = []
no-idl = []
no-log-ix-name = []
cpi = ["no-entrypoint"]
default = []
`;
    
    await fs.writeFile(
      path.join(projectPath, 'programs', projectName, 'Cargo.toml'), 
      programCargoToml
    );
  }

  generateLibRs(templateName, projectName) {
    const programName = projectName.replace(/-/g, '_');
    
    switch (templateName) {
      case 'DeFi Protocol':
        return `use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod ${programName} {
    use super::*;

    pub fn initialize_pool(ctx: Context<InitializePool>) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        pool.token_a_mint = ctx.accounts.token_a_mint.key();
        pool.token_b_mint = ctx.accounts.token_b_mint.key();
        pool.token_a_vault = ctx.accounts.token_a_vault.key();
        pool.token_b_vault = ctx.accounts.token_b_vault.key();
        pool.fee_rate = 300; // 0.3%
        Ok(())
    }

    pub fn swap(ctx: Context<Swap>, amount_in: u64, minimum_amount_out: u64) -> Result<()> {
        // Simple swap implementation
        msg!("Swapping {} tokens, minimum out: {}", amount_in, minimum_amount_out);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializePool<'info> {
    #[account(init, payer = authority, space = 8 + 32 + 32 + 32 + 32 + 8)]
    pub pool: Account<'info, Pool>,
    pub token_a_mint: Account<'info, Mint>,
    pub token_b_mint: Account<'info, Mint>,
    pub token_a_vault: Account<'info, TokenAccount>,
    pub token_b_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Swap<'info> {
    #[account(mut)]
    pub pool: Account<'info, Pool>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub vault_token_account: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct Pool {
    pub token_a_mint: Pubkey,
    pub token_b_mint: Pubkey,
    pub token_a_vault: Pubkey,
    pub token_b_vault: Pubkey,
    pub fee_rate: u64,
}
`;

      case 'NFT Collection':
        return `use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, MintTo};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod ${programName} {
    use super::*;

    pub fn initialize_collection(ctx: Context<InitializeCollection>, name: String, symbol: String) -> Result<()> {
        let collection = &mut ctx.accounts.collection;
        collection.name = name;
        collection.symbol = symbol;
        collection.total_supply = 0;
        collection.max_supply = 10000;
        collection.authority = ctx.accounts.authority.key();
        Ok(())
    }

    pub fn mint_nft(ctx: Context<MintNft>, metadata_uri: String) -> Result<()> {
        let collection = &mut ctx.accounts.collection;
        require!(collection.total_supply < collection.max_supply, ErrorCode::MaxSupplyReached);
        
        collection.total_supply += 1;
        
        msg!("Minting NFT #{} with URI: {}", collection.total_supply, metadata_uri);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeCollection<'info> {
    #[account(init, payer = authority, space = 8 + 32 + 50 + 10 + 8 + 8 + 32)]
    pub collection: Account<'info, Collection>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MintNft<'info> {
    #[account(mut)]
    pub collection: Account<'info, Collection>,
    #[account(init, payer = payer, mint::decimals = 0, mint::authority = authority)]
    pub mint: Account<'info, Mint>,
    #[account(init, payer = payer, associated_token::mint = mint, associated_token::authority = recipient)]
    pub token_account: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: This is the recipient of the NFT
    pub recipient: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[account]
pub struct Collection {
    pub name: String,
    pub symbol: String,
    pub total_supply: u64,
    pub max_supply: u64,
    pub authority: Pubkey,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Maximum supply reached")]
    MaxSupplyReached,
}
`;

      default:
        return `use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod ${programName} {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let my_account = &mut ctx.accounts.my_account;
        my_account.data = 0;
        Ok(())
    }

    pub fn update(ctx: Context<Update>, data: u64) -> Result<()> {
        let my_account = &mut ctx.accounts.my_account;
        my_account.data = data;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = 8 + 8)]
    pub my_account: Account<'info, MyAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Update<'info> {
    #[account(mut)]
    pub my_account: Account<'info, MyAccount>,
}

#[account]
pub struct MyAccount {
    pub data: u64,
}
`;
    }
  }

  async createTestFiles(projectPath, template, projectName) {
    const testFile = path.join(projectPath, 'tests', `${projectName}.ts`);
    
    const testContent = `import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ${projectName.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('')} } from "../target/types/${projectName.replace(/-/g, '_')}";

describe("${projectName}", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.${projectName.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('')} as Program<${projectName.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('')}>;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });
});
`;
    
    await fs.writeFile(testFile, testContent);
  }

  async createClientFiles(projectPath, template, projectName) {
    // Create package.json
    const packageJson = {
      name: projectName,
      version: "0.1.0",
      description: `${template.description}`,
      main: "app/index.js",
      scripts: {
        "build": "anchor build",
        "test": "anchor test",
        "deploy": "anchor deploy",
        "lint": "eslint . --ext .ts",
        "format": "prettier --write ."
      },
      dependencies: {
        "@coral-xyz/anchor": "^0.29.0",
        "@solana/web3.js": "^1.87.6"
      },
      devDependencies: {
        "@types/node": "^20.10.0",
        "typescript": "^5.3.0",
        "prettier": "^3.1.0",
        "eslint": "^8.57.0",
        "@typescript-eslint/eslint-plugin": "^6.13.0",
        "@typescript-eslint/parser": "^6.13.0",
        "ts-mocha": "^10.0.0",
        "mocha": "^10.2.0",
        "chai": "^4.3.10"
      }
    };
    
    await fs.writeJSON(path.join(projectPath, 'package.json'), packageJson, { spaces: 2 });
    
    // Create tsconfig.json
    const tsconfig = {
      compilerOptions: {
        target: "es2020",
        lib: ["es2020"],
        module: "commonjs",
        moduleResolution: "node",
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true
      },
      exclude: ["target/**/*"]
    };
    
    await fs.writeJSON(path.join(projectPath, 'tsconfig.json'), tsconfig, { spaces: 2 });
  }

  async createConfigFiles(projectPath, projectName) {
    // Create solana-devex.toml
    const devexConfig = `[project]
name = "${projectName}"
version = "0.1.0"
description = "Created with Solana DevEx CLI"

[networks.devnet]
rpc_url = "https://api.devnet.solana.com"
ws_url = "wss://api.devnet.solana.com"

[networks.testnet]
rpc_url = "https://api.testnet.solana.com"
ws_url = "wss://api.testnet.solana.com"

[networks.mainnet]
rpc_url = "https://api.mainnet-beta.solana.com"
ws_url = "wss://api.mainnet-beta.solana.com"

[networks.localhost]
rpc_url = "http://localhost:8899"
ws_url = "ws://localhost:8900"

[build]
optimize = true
verify = false

[test]
coverage = true
parallel = false

[deploy]
verify = true
upgrade = false
`;
    
    await fs.writeFile(path.join(projectPath, 'solana-devex.toml'), devexConfig);
    
    // Create .gitignore
    const gitignore = `# Dependencies
node_modules/
target/
.anchor/

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Environment
.env
.env.local

# Build artifacts
dist/
build/

# Test coverage
coverage/
.nyc_output/

# Keypairs (keep private!)
*.json
!package*.json
!tsconfig.json
`;
    
    await fs.writeFile(path.join(projectPath, '.gitignore'), gitignore);
  }

  async createReadme(projectPath, template, projectName) {
    const readme = `# ${projectName}

${template.description}

Created with [Solana DevEx CLI](https://github.com/solana-devex/cli).

## Getting Started

### Prerequisites

- [Rust](https://rustup.rs/)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)
- [Anchor](https://anchor-lang.com/docs/installation)
- [Node.js](https://nodejs.org/)

### Installation

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Build the program:
   \`\`\`bash
   solana-devex build
   \`\`\`

3. Run tests:
   \`\`\`bash
   solana-devex test
   \`\`\`

### Development

Start a local validator:
\`\`\`bash
solana-devex node
\`\`\`

Deploy to localnet:
\`\`\`bash
solana-devex deploy --network localhost
\`\`\`

### Commands

- \`solana-devex build\` - Build the program
- \`solana-devex test\` - Run tests
- \`solana-devex deploy\` - Deploy to network
- \`solana-devex node\` - Start local validator

### Project Structure

\`\`\`
${projectName}/
├── programs/           # Solana programs
│   └── ${projectName}/
│       └── src/
│           └── lib.rs
├── tests/             # Test files
├── app/               # Client application
├── Anchor.toml        # Anchor configuration
└── Cargo.toml         # Rust workspace
\`\`\`

## License

MIT
`;
    
    await fs.writeFile(path.join(projectPath, 'README.md'), readme);
  }

  async initializeGit(projectPath, spinner) {
    spinner.text = 'Initializing git repository...';
    
    try {
      await this.runCommand('git', ['init'], { cwd: projectPath });
      await this.runCommand('git', ['add', '.'], { cwd: projectPath });
      await this.runCommand('git', ['commit', '-m', 'Initial commit'], { cwd: projectPath });
    } catch (error) {
      console.warn(chalk.yellow('⚠️  Git initialization failed:'), error.message);
    }
  }

  async addVSCodeSettings(projectPath, spinner) {
    spinner.text = 'Adding VS Code settings...';
    
    const vscodeDir = path.join(projectPath, '.vscode');
    await fs.ensureDir(vscodeDir);
    
    const settings = {
      "rust-analyzer.linkedProjects": ["./Cargo.toml"],
      "typescript.preferences.importModuleSpecifier": "relative"
    };
    
    const extensions = {
      "recommendations": [
        "rust-lang.rust-analyzer",
        "bradlc.vscode-tailwindcss",
        "esbenp.prettier-vscode",
        "ms-vscode.vscode-typescript-next"
      ]
    };
    
    await fs.writeJSON(path.join(vscodeDir, 'settings.json'), settings, { spaces: 2 });
    await fs.writeJSON(path.join(vscodeDir, 'extensions.json'), extensions, { spaces: 2 });
  }

  async installDependencies(projectPath, spinner) {
    spinner.text = 'Installing dependencies...';
    
    try {
      await this.runCommand('npm', ['install'], { cwd: projectPath });
    } catch (error) {
      console.warn(chalk.yellow('⚠️  Dependency installation failed:'), error.message);
      console.log(chalk.gray('You can install them manually with: npm install'));
    }
  }

  async runCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: 'pipe',
        ...options
      });

      let output = '';
      let errorOutput = '';

      child.stdout?.on('data', (data) => {
        output += data.toString();
      });

      child.stderr?.on('data', (data) => {
        errorOutput += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ output, code });
        } else {
          reject(new Error(`Command failed (exit code ${code}): ${errorOutput}`));
        }
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  displayNextSteps(projectName, projectPath) {
    console.log(chalk.bold('\n🎉 Project created successfully!'));
    console.log('━'.repeat(50));
    
    console.log(chalk.bold('\n📁 Project Location:'));
    console.log(chalk.cyan(`   ${projectPath}`));
    
    console.log(chalk.bold('\n🚀 Next Steps:'));
    console.log(chalk.gray('1. Navigate to your project:'));
    console.log(chalk.cyan(`   cd ${projectName}`));
    console.log('');
    console.log(chalk.gray('2. Start local validator:'));
    console.log(chalk.cyan('   solana-devex node'));
    console.log('');
    console.log(chalk.gray('3. Build your program:'));
    console.log(chalk.cyan('   solana-devex build'));
    console.log('');
    console.log(chalk.gray('4. Run tests:'));
    console.log(chalk.cyan('   solana-devex test'));
    console.log('');
    console.log(chalk.gray('5. Deploy to local network:'));
    console.log(chalk.cyan('   solana-devex deploy'));
    console.log('');
    console.log(chalk.bold('📚 Learn more:'));
    console.log(chalk.blue('   - Anchor Docs: https://anchor-lang.com'));
    console.log(chalk.blue('   - Solana Docs: https://docs.solana.com'));
    console.log('');
  }
}

module.exports = InitCommand;