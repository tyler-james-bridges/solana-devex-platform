# Solana/Anchor GitHub Actions Workflow Templates 🚀

Production-ready GitHub Actions workflows for Solana and Anchor development, including CI/CD pipelines, security scanning, and deployment automation.

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Workflow Templates](#workflow-templates)
- [Reusable Actions](#reusable-actions)
- [Examples](#examples)
- [Setup Guide](#setup-guide)
- [Security Best Practices](#security-best-practices)
- [Troubleshooting](#troubleshooting)

## 🚀 Quick Start

### 1. Choose Your Template

**Basic Anchor Project**:
```bash
# Copy the basic template
cp examples/basic-anchor-project.yml .github/workflows/ci.yml
```

**Multi-Program Project**:
```bash
# Copy the advanced template
cp examples/multi-program-project.yml .github/workflows/ci.yml
```

### 2. Copy Reusable Actions

```bash
# Copy all reusable actions to your repository
cp -r .github/actions/* .github/actions/
```

### 3. Configure Secrets

Add these secrets to your GitHub repository (`Settings > Secrets and variables > Actions`):

```
DEPLOY_WALLET_SECRET      # Base58-encoded private key for deployment wallet
SLACK_WEBHOOK_URL         # Optional: Slack notifications
DISCORD_WEBHOOK_URL       # Optional: Discord notifications
```

### 4. Customize for Your Project

Edit the workflow file to match your:
- Solana/Anchor versions
- Program names
- Test commands
- Deployment environments

## 📁 Workflow Templates

### Core Workflows

| Workflow | Description | Use Case |
|----------|-------------|----------|
| [`anchor-ci.yml`](.github/workflows/anchor-ci.yml) | Complete CI pipeline | Build, test, and validate Anchor programs |
| [`anchor-deploy.yml`](.github/workflows/anchor-deploy.yml) | Deployment automation | Deploy to devnet/testnet/mainnet |
| [`security-scan.yml`](.github/workflows/security-scan.yml) | Security scanning | Vulnerability and compliance checking |
| [`validator-tests.yml`](.github/workflows/validator-tests.yml) | Validator testing | Test with solana-test-validator |

### Anchor CI Workflow Features

✅ **Smart Change Detection** - Only runs when relevant files change  
✅ **Multi-Node Testing** - Tests on multiple Node.js versions  
✅ **Parallel Execution** - Runs lint, build, and tests in parallel  
✅ **Artifact Management** - Saves build artifacts between jobs  
✅ **Security Integration** - Built-in security scanning  
✅ **Compatibility Testing** - Tests against multiple Solana/Anchor versions  

### Deployment Workflow Features

🚀 **Environment-Aware** - Supports devnet, testnet, and mainnet-beta  
🚀 **Pre-Deploy Validation** - Runs tests before deployment  
🚀 **Wallet Balance Checks** - Ensures sufficient SOL for deployment  
🚀 **Deployment Verification** - Confirms programs are deployed correctly  
🚀 **IDL Management** - Automatically updates IDLs  
🚀 **Rollback Support** - Manual rollback triggers on failures  

### Security Scanning Features

🔒 **Dependency Auditing** - Scans Rust and NPM dependencies  
🔒 **CodeQL Analysis** - GitHub's semantic code analysis  
🔒 **Unsafe Code Detection** - Finds unsafe Rust code blocks  
🔒 **License Compliance** - Checks for problematic licenses  
🔒 **Secret Scanning** - Detects exposed secrets in commits  
🔒 **Smart Contract Best Practices** - Anchor-specific security checks  

## 🔧 Reusable Actions

### Setup Actions

#### `setup-solana`
```yaml
- uses: ./.github/actions/setup-solana
  with:
    solana-version: "1.18.26"
```

**Features**:
- Caches Solana CLI installation
- Configures default keypair
- Verifies installation
- Supports multiple versions

#### `setup-anchor`
```yaml
- uses: ./.github/actions/setup-anchor
  with:
    anchor-version: "0.30.1"
    install-method: "avm"  # or "cargo"
```

**Features**:
- Supports AVM (Anchor Version Manager) or direct Cargo installation
- Caches installation
- Installs additional development tools
- Version verification

### Notification Actions

#### `notify-failure`
```yaml
- uses: ./.github/actions/notify-failure
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
    run-id: ${{ github.run_id }}
```

#### `notify-deployment`
```yaml
- uses: ./.github/actions/notify-deployment
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
    environment: "devnet"
    success: true
    program-ids: "11111111111111111111111111111111"
```

## 📖 Examples

### Example 1: Basic Anchor Project

Perfect for simple Anchor projects with standard structure:

```
my-anchor-project/
├── programs/
│   └── my-program/
├── tests/
├── app/
├── Anchor.toml
└── package.json
```

**Features**:
- Builds and tests on every PR
- Deploys to devnet on main branch
- Basic security scanning
- Slack notifications

### Example 2: Multi-Program Project

Ideal for complex projects with multiple programs:

```
my-defi-project/
├── programs/
│   ├── token-program/
│   ├── staking-program/
│   └── governance-program/
├── tests/
│   ├── token-tests/
│   ├── staking-tests/
│   └── integration-tests/
├── frontend/
└── Anchor.toml
```

**Features**:
- Parallel program builds
- Test suite matrix
- Cross-program testing
- Frontend E2E testing
- Multi-environment deployment
- Advanced security scanning

### Example 3: Library/SDK Project

For Solana libraries and SDKs:

```yaml
name: Library CI

on: [push, pull_request]

jobs:
  test:
    strategy:
      matrix:
        rust-version: [1.70, 1.75, stable]
        solana-version: ["1.17.34", "1.18.26"]
    
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: dtolnay/rust-toolchain@${{ matrix.rust-version }}
      
      - uses: ./.github/actions/setup-solana
        with:
          solana-version: ${{ matrix.solana-version }}
      
      - run: cargo test --all-features
      
      - run: cargo doc --no-deps
```

## ⚙️ Setup Guide

### 1. Repository Structure

Ensure your repository follows Anchor conventions:

```
your-project/
├── .github/
│   ├── workflows/
│   └── actions/           # Copy reusable actions here
├── programs/
│   └── your-program/
│       ├── src/
│       └── Cargo.toml
├── tests/
├── Anchor.toml
├── Cargo.toml
└── package.json
```

### 2. Environment Configuration

#### Development Environment Secrets

```bash
# Required for deployment
DEPLOY_WALLET_SECRET="[1,2,3,...]"  # Array format private key

# Optional notifications
SLACK_WEBHOOK_URL="https://hooks.slack.com/..."
DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."
```

#### Environment Protection Rules

1. Go to `Settings > Environments`
2. Create environments: `devnet`, `testnet`, `mainnet-beta`
3. Add protection rules:
   - **devnet**: No restrictions
   - **testnet**: Required reviewers
   - **mainnet-beta**: Required reviewers + deployment branch restrictions

### 3. Wallet Setup

#### Generate Deployment Wallet

```bash
# Generate new keypair
solana-keygen new --outfile deploy-wallet.json

# Get the private key array
solana-keygen pubkey deploy-wallet.json --outfile /dev/stdout
cat deploy-wallet.json
```

#### Fund the Wallet

```bash
# Devnet
solana airdrop 10 --url devnet

# Testnet  
solana airdrop 5 --url testnet

# Mainnet-beta
# Transfer SOL manually
```

### 4. Customization

#### Adjust Versions

```yaml
env:
  SOLANA_VERSION: "1.18.26"    # Your target Solana version
  ANCHOR_VERSION: "0.30.1"     # Your target Anchor version
  NODE_VERSION: "20"           # Node.js version for tests
```

#### Modify Program Names

Update the strategy matrix in multi-program workflows:

```yaml
strategy:
  matrix:
    program:
      - your-token-program
      - your-staking-program
      - your-governance-program
```

#### Configure Test Commands

```yaml
- name: Run tests
  run: |
    npm run test:unit
    npm run test:integration
    npm run test:e2e
```

## 🔒 Security Best Practices

### 1. Secret Management

✅ **Use GitHub Secrets** - Never commit private keys  
✅ **Rotate Keys Regularly** - Update deployment wallets periodically  
✅ **Minimum Permissions** - Use dedicated wallets with minimal SOL  
✅ **Environment Separation** - Different wallets for each environment  

### 2. Deployment Safety

✅ **Pre-Deploy Testing** - Always test before deployment  
✅ **Gradual Rollout** - Deploy to devnet → testnet → mainnet  
✅ **Verification Steps** - Confirm deployments succeed  
✅ **Rollback Plans** - Prepare for deployment failures  

### 3. Code Security

✅ **Dependency Auditing** - Regular security scans  
✅ **Static Analysis** - CodeQL and other tools  
✅ **Unsafe Code Review** - Monitor unsafe Rust usage  
✅ **License Compliance** - Check dependency licenses  

### 4. Access Control

✅ **Protected Branches** - Require PR reviews  
✅ **Environment Protection** - Restrict mainnet deployments  
✅ **Audit Logs** - Monitor deployment activities  
✅ **Team Access** - Limit who can deploy  

## 🔧 Troubleshooting

### Common Issues

#### Build Failures

```yaml
# Issue: Anchor version mismatch
Error: anchor-cli 0.29.0 but Anchor.toml specifies 0.30.1

# Solution: Update workflow versions
env:
  ANCHOR_VERSION: "0.30.1"  # Match your Anchor.toml
```

#### Test Validator Issues

```yaml
# Issue: Validator fails to start
Error: Unable to connect to validator

# Solution: Increase timeout and add debugging
- name: Start validator
  run: |
    solana-test-validator --detach --reset --quiet
    timeout 60s bash -c 'until solana cluster-version; do sleep 1; done'
    solana cluster-version  # Verify it's running
```

#### Deployment Failures

```yaml
# Issue: Insufficient balance
Error: Insufficient balance for deployment

# Solution: Check and fund wallet
- name: Check wallet balance
  run: |
    BALANCE=$(solana balance --lamports)
    echo "Wallet balance: $BALANCE lamports"
    if [ "$BALANCE" -lt "100000000" ]; then
      echo "::error::Insufficient balance for deployment"
      exit 1
    fi
```

### Performance Optimization

#### Cache Strategy

```yaml
# Optimize cache keys for better hit rates
- name: Cache Rust dependencies
  uses: Swatinem/rust-cache@v2
  with:
    key: build-${{ runner.os }}-${{ hashFiles('**/Cargo.lock') }}
    restore-keys: |
      build-${{ runner.os }}-
      build-
```

#### Parallel Execution

```yaml
# Use job dependencies for optimal parallelism
jobs:
  lint:
    runs-on: ubuntu-latest
    # runs immediately
  
  build:
    runs-on: ubuntu-latest  
    # runs immediately
  
  test:
    needs: [build]  # waits for build to complete
    runs-on: ubuntu-latest
```

### Debug Mode

Enable debug output for troubleshooting:

```yaml
- name: Debug Solana setup
  run: |
    echo "Solana CLI version: $(solana --version)"
    echo "Config: $(solana config get)"
    echo "Keypair: $(solana address)"
    echo "Balance: $(solana balance)"
    echo "Cluster version: $(solana cluster-version)"
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/improvement`
3. **Test your changes** with a real Anchor project
4. **Submit a pull request** with detailed description

### Development Guidelines

- Test workflows with multiple Anchor versions
- Ensure backwards compatibility
- Add comprehensive error handling
- Update documentation for new features
- Follow GitHub Actions best practices

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- **Anchor Framework** - For the excellent Solana development framework
- **Solana Labs** - For the robust blockchain platform
- **GitHub Actions** - For the powerful CI/CD platform
- **Community Contributors** - For feedback and improvements

---

**Need Help?** 
- 📖 Check the [examples](examples/)
- 🐛 Open an [issue](../../issues)
- 💬 Join the discussion in [Discussions](../../discussions)
- 📧 Contact the maintainers

Happy building on Solana! 🚀