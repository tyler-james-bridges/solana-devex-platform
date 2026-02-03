#!/bin/bash

# Solana CI/CD Platform Setup Script
# Production-ready development automation platform for Solana

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ASCII Banner
echo -e "${CYAN}"
echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║                    SOLANA CI/CD PLATFORM SETUP                           ║"
echo "║              Production-Ready Development Automation                      ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${BLUE}🚀 Setting up Solana CI/CD Platform...${NC}"

# Check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}📋 Checking prerequisites...${NC}"
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ first.${NC}"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt "18" ]; then
        echo -e "${RED}❌ Node.js version 18+ required. Current version: $(node --version)${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Node.js $(node --version) detected${NC}"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm is not installed${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ npm $(npm --version) detected${NC}"
    
    # Check Rust
    if ! command -v rustc &> /dev/null; then
        echo -e "${YELLOW}⚠️ Rust is not installed. Installing Rust...${NC}"
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
        source ~/.cargo/env
    fi
    echo -e "${GREEN}✓ Rust $(rustc --version | cut -d' ' -f2) detected${NC}"
    
    # Check Solana CLI
    if ! command -v solana &> /dev/null; then
        echo -e "${YELLOW}⚠️ Solana CLI is not installed. Installing...${NC}"
        sh -c "$(curl -sSfL https://release.solana.com/v1.18.22/install)"
        export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
    fi
    echo -e "${GREEN}✓ Solana CLI $(solana --version | cut -d' ' -f2) detected${NC}"
    
    # Check Anchor CLI
    if ! command -v anchor &> /dev/null; then
        echo -e "${YELLOW}⚠️ Anchor CLI is not installed. Installing...${NC}"
        npm install -g @coral-xyz/anchor-cli@0.29.0
    fi
    echo -e "${GREEN}✓ Anchor CLI detected${NC}"
    
    echo -e "${GREEN}✅ All prerequisites met!${NC}"
}

# Install platform dependencies
install_dependencies() {
    echo -e "${BLUE}📦 Installing CI/CD platform dependencies...${NC}"
    
    # Install core dependencies
    npm install --save-dev \
        commander \
        chalk \
        inquirer \
        ora \
        @octokit/rest \
        turbo \
        @changesets/cli \
        vitest \
        prettier \
        eslint
    
    # Install Solana development dependencies
    npm install --save-dev \
        @coral-xyz/anchor \
        @solana/web3.js \
        @solana/spl-token \
        litesvm
    
    echo -e "${GREEN}✓ Dependencies installed${NC}"
}

# Setup CLI tool
setup_cli() {
    echo -e "${BLUE}🛠️ Setting up Solana CI/CD CLI...${NC}"
    
    # Make CLI executable
    chmod +x cli/solana-cicd-cli.js
    
    # Create symlink for global access (optional)
    if [ -w /usr/local/bin ]; then
        ln -sf "$(pwd)/cli/solana-cicd-cli.js" /usr/local/bin/solana-cicd
        echo -e "${GREEN}✓ CLI tool installed globally as 'solana-cicd'${NC}"
    else
        echo -e "${YELLOW}⚠️ Cannot install globally. Use: ./cli/solana-cicd-cli.js${NC}"
    fi
}

# Setup GitHub Actions templates
setup_github_actions() {
    echo -e "${BLUE}⚙️ Setting up GitHub Actions templates...${NC}"
    
    # Create .github/workflows directory if it doesn't exist
    mkdir -p .github/workflows
    
    echo -e "${GREEN}✓ GitHub Actions templates ready${NC}"
    echo -e "${CYAN}📋 Available templates:${NC}"
    echo -e "  • templates/github-actions/solana-comprehensive.yml"
    echo -e "  • templates/github-actions/solana-agent-multidex.yml"
}

# Setup environment configurations
setup_environments() {
    echo -e "${BLUE}🌍 Setting up environment configurations...${NC}"
    
    # Create environment config directory
    mkdir -p config/environments
    
    echo -e "${GREEN}✓ Environment management ready${NC}"
}

# Create example project
create_example_project() {
    echo -e "${BLUE}📁 Creating example project...${NC}"
    
    if [ ! -d "examples" ]; then
        mkdir examples
    fi
    
    # Create a simple example project structure
    mkdir -p examples/basic-defi/{programs/basic-defi/src,tests,client}
    
    # Basic program example
    cat > examples/basic-defi/programs/basic-defi/src/lib.rs << 'EOF'
use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod basic_defi {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        pool.authority = ctx.accounts.authority.key();
        pool.total_liquidity = 0;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = authority, space = 8 + 40)]
    pub pool: Account<'info, Pool>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Pool {
    pub authority: Pubkey,
    pub total_liquidity: u64,
}
EOF
    
    # Basic Anchor.toml
    cat > examples/basic-defi/Anchor.toml << 'EOF'
[features]
resolution = true
skip-lint = false

[programs.localnet]
basic_defi = "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "Localnet"
wallet = "~/.config/solana/id.json"

[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"
EOF

    echo -e "${GREEN}✓ Example project created in examples/basic-defi${NC}"
}

# Display usage instructions
show_usage() {
    echo -e "${CYAN}"
    echo "╔═══════════════════════════════════════════════════════════════════════════╗"
    echo "║                           SETUP COMPLETE! 🎉                             ║"
    echo "╚═══════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    echo -e "${GREEN}✅ Solana CI/CD Platform is ready!${NC}"
    echo ""
    echo -e "${YELLOW}📋 Quick Start Commands:${NC}"
    echo ""
    echo -e "${CYAN}1. Create a new project:${NC}"
    echo "   ./cli/solana-cicd-cli.js project create my-defi-app --interactive"
    echo ""
    echo -e "${CYAN}2. Generate GitHub Actions workflow:${NC}"
    echo "   ./cli/solana-cicd-cli.js workflow generate --type comprehensive"
    echo ""
    echo -e "${CYAN}3. Deploy to devnet:${NC}"
    echo "   ./cli/solana-cicd-cli.js deploy run --network devnet"
    echo ""
    echo -e "${CYAN}4. Check deployment status:${NC}"
    echo "   ./cli/solana-cicd-cli.js deploy status"
    echo ""
    echo -e "${YELLOW}📚 Documentation:${NC}"
    echo "   • Implementation Guide: CICD-IMPLEMENTATION-GUIDE.md"
    echo "   • Example Project: examples/basic-defi/"
    echo "   • Templates: templates/"
    echo ""
    echo -e "${YELLOW}🔒 Required GitHub Secrets:${NC}"
    echo "   ./cli/solana-cicd-cli.js workflow secrets"
    echo ""
    echo -e "${BLUE}🎯 Focus Areas for 80% of Solana Projects:${NC}"
    echo "   • Multi-DEX integration testing"
    echo "   • Agent trading system automation"
    echo "   • DeFi protocol scaffolding"
    echo "   • Production deployment safety"
    echo "   • Real-time monitoring & alerts"
    echo ""
    echo -e "${GREEN}Happy building! 🚀${NC}"
}

# Main execution
main() {
    check_prerequisites
    install_dependencies
    setup_cli
    setup_github_actions
    setup_environments
    create_example_project
    show_usage
}

# Run main function
main