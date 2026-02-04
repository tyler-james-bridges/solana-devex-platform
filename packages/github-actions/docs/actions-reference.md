# GitHub Actions Reference Guide

Complete reference for all reusable GitHub Actions included in this template collection.

## 📋 Table of Contents

- [Setup Actions](#setup-actions)
  - [setup-solana](#setup-solana)
  - [setup-anchor](#setup-anchor)
- [Notification Actions](#notification-actions)
  - [notify-failure](#notify-failure)
  - [notify-deployment](#notify-deployment)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)

## Setup Actions

### setup-solana

Installs and configures Solana CLI with caching and verification.

#### Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `solana-version` | Solana CLI version to install | ✅ | `1.18.26` |
| `cache-key-suffix` | Additional suffix for cache key | ❌ | `''` |
| `install-path` | Installation path for Solana CLI | ❌ | `~/.local/share/solana/install/active_release/bin` |

#### Outputs

| Output | Description |
|--------|-------------|
| `solana-version` | Installed Solana CLI version |
| `install-path` | Solana CLI installation path |

#### Example Usage

```yaml
- name: Setup Solana CLI
  uses: ./.github/actions/setup-solana
  with:
    solana-version: "1.18.26"
    cache-key-suffix: "build"
```

#### Features

- **Intelligent Caching**: Caches installation to speed up subsequent runs
- **Automatic Configuration**: Sets up default keypair and localhost URL
- **Version Verification**: Confirms installation success
- **PATH Management**: Automatically adds Solana CLI to PATH
- **Multi-Platform Support**: Works on Linux, macOS, and Windows

#### Troubleshooting

```yaml
# Issue: Solana CLI not found after setup
- name: Debug Solana setup
  run: |
    echo "PATH: $PATH"
    which solana || echo "Solana not in PATH"
    ls -la ~/.local/share/solana/install/active_release/bin/
```

---

### setup-anchor

Installs and configures Anchor CLI with support for multiple installation methods.

#### Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `anchor-version` | Anchor CLI version to install | ✅ | `0.30.1` |
| `install-method` | Installation method (`cargo` or `avm`) | ❌ | `avm` |
| `cache-key-suffix` | Additional suffix for cache key | ❌ | `''` |

#### Outputs

| Output | Description |
|--------|-------------|
| `anchor-version` | Installed Anchor CLI version |
| `install-method` | Installation method used |

#### Example Usage

```yaml
# Install via AVM (recommended)
- name: Setup Anchor CLI
  uses: ./.github/actions/setup-anchor
  with:
    anchor-version: "0.30.1"
    install-method: "avm"

# Install via Cargo
- name: Setup Anchor CLI  
  uses: ./.github/actions/setup-anchor
  with:
    anchor-version: "0.30.1"
    install-method: "cargo"
```

#### Installation Methods

##### AVM (Anchor Version Manager) - Recommended

✅ **Version Management**: Easy switching between Anchor versions  
✅ **Faster Installation**: Pre-compiled binaries  
✅ **Better Caching**: More efficient caching strategy  

```yaml
install-method: "avm"
```

##### Direct Cargo Installation

✅ **Latest Versions**: Access to cutting-edge features  
✅ **Custom Builds**: Compile with specific features  
❌ **Slower**: Compiles from source  

```yaml
install-method: "cargo"
```

#### Features

- **Version Flexibility**: Supports specific versions or latest
- **Smart Caching**: Caches both AVM and Cargo installations  
- **Dependency Management**: Installs additional development tools
- **Verification**: Tests basic functionality after installation
- **Rust Integration**: Works seamlessly with Rust toolchain

#### Troubleshooting

```yaml
# Issue: Anchor CLI not found
- name: Debug Anchor setup
  run: |
    echo "PATH: $PATH"
    which anchor || echo "Anchor not in PATH"
    which avm || echo "AVM not found"
    ls -la ~/.cargo/bin/
    ls -la ~/.avm/ || echo "AVM directory not found"
```

## Notification Actions

### notify-failure

Sends detailed notifications when CI builds fail, supporting multiple platforms.

#### Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `webhook-url` | Slack webhook URL | ✅ | - |
| `discord-webhook` | Discord webhook URL | ❌ | - |
| `run-id` | GitHub Actions run ID | ✅ | - |
| `additional-info` | Additional failure information | ❌ | `''` |

#### Example Usage

```yaml
- name: Notify on failure
  if: failure()
  uses: ./.github/actions/notify-failure
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
    discord-webhook: ${{ secrets.DISCORD_WEBHOOK_URL }}
    run-id: ${{ github.run_id }}
    additional-info: "Custom deployment failed on production"
```

#### Notification Content

The notification includes:

- **Repository Information**: Name, branch, commit
- **Build Details**: Workflow name, trigger event, actor
- **Failure Context**: Commit message, timestamp
- **Quick Actions**: Links to logs and commit
- **Visual Indicators**: Emojis and color coding

#### Slack Notification Format

```json
{
  "text": "🚨 Solana CI Build Failed",
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text", 
        "text": "🚨 Build Failure Alert"
      }
    },
    {
      "type": "section",
      "fields": [
        {
          "type": "mrkdwn",
          "text": "*Repository:*\norg/repo"
        }
      ]
    }
  ]
}
```

#### Discord Notification Format

```json
{
  "embeds": [
    {
      "title": "🚨 Solana CI Build Failed",
      "color": 15158332,
      "fields": [
        {
          "name": "Repository",
          "value": "org/repo",
          "inline": true
        }
      ]
    }
  ]
}
```

---

### notify-deployment

Sends notifications for deployment events with environment-specific formatting.

#### Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `webhook-url` | Slack webhook URL | ✅ | - |
| `discord-webhook` | Discord webhook URL | ❌ | - |
| `environment` | Deployment environment | ✅ | - |
| `success` | Whether deployment was successful | ✅ | `true` |
| `program-ids` | Comma-separated program IDs | ❌ | - |
| `additional-info` | Additional deployment info | ❌ | `''` |

#### Example Usage

```yaml
# Success notification
- name: Notify deployment success
  uses: ./.github/actions/notify-deployment
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
    environment: "mainnet-beta"
    success: true
    program-ids: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA,StakeConfig11111111111111111111111111111111"

# Failure notification  
- name: Notify deployment failure
  if: failure()
  uses: ./.github/actions/notify-deployment
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
    environment: "testnet" 
    success: false
    additional-info: "Deployment failed due to insufficient balance"
```

#### Environment-Specific Features

##### Mainnet-beta 🚀
- **Red Alert Styling**: High-visibility notifications
- **Explorer Links**: Direct links to Solana Explorer  
- **Program Verification**: Links to deployed programs
- **Extra Caution**: Additional confirmation messages

##### Testnet 🧪  
- **Gold/Orange Styling**: Testing environment indicators
- **Test Data Warnings**: Reminds about test environment
- **Quick Reset**: Easy testnet reset instructions

##### Devnet 🔧
- **Blue Styling**: Development environment
- **Rapid Iteration**: Optimized for frequent deployments
- **Debug Links**: Additional debugging information

#### Notification Features

- **Smart Emoji Selection**: Environment-appropriate emojis
- **Explorer Integration**: Direct links to Solana Explorer
- **Program Links**: Clickable program addresses
- **Deployment History**: Tracks deployment metadata
- **Rich Formatting**: Platform-optimized message formatting

## Usage Examples

### Complete CI Pipeline

```yaml
name: Complete Solana CI

on: [push, pull_request]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      # Setup environment
      - uses: actions/checkout@v4
      
      - name: Setup Solana
        id: solana
        uses: ./.github/actions/setup-solana
        with:
          solana-version: "1.18.26"
          
      - name: Setup Anchor
        id: anchor  
        uses: ./.github/actions/setup-anchor
        with:
          anchor-version: "0.30.1"
          install-method: "avm"

      # Build and test
      - name: Build programs
        run: anchor build
        
      - name: Run tests
        run: anchor test
        
      # Handle failures
      - name: Notify on failure
        if: failure()
        uses: ./.github/actions/notify-failure
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
          run-id: ${{ github.run_id }}

  deploy:
    needs: build-and-test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      # Setup for deployment
      - uses: actions/checkout@v4
      
      - name: Setup Solana
        uses: ./.github/actions/setup-solana
        with:
          solana-version: "1.18.26"
          
      - name: Setup Anchor
        uses: ./.github/actions/setup-anchor
        with:
          anchor-version: "0.30.1"

      # Deploy
      - name: Deploy to mainnet
        id: deploy
        run: |
          echo "${{ secrets.DEPLOY_WALLET_SECRET }}" > wallet.json
          solana config set --keypair wallet.json --url mainnet-beta
          anchor deploy --provider.cluster mainnet-beta
          
          # Extract program IDs for notification
          PROGRAM_IDS=$(anchor keys list | grep -o '[A-Za-z0-9]*$' | tr '\n' ',')
          echo "program-ids=${PROGRAM_IDS%,}" >> $GITHUB_OUTPUT

      # Notify success
      - name: Notify deployment success
        if: success()
        uses: ./.github/actions/notify-deployment  
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
          environment: "mainnet-beta"
          success: true
          program-ids: ${{ steps.deploy.outputs.program-ids }}
          
      # Notify failure
      - name: Notify deployment failure
        if: failure()
        uses: ./.github/actions/notify-deployment
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
          environment: "mainnet-beta"
          success: false
```

### Matrix Testing

```yaml
jobs:
  compatibility-test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        solana-version: ["1.17.34", "1.18.26"]
        anchor-version: ["0.29.0", "0.30.1"]
        
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Solana ${{ matrix.solana-version }}
        uses: ./.github/actions/setup-solana
        with:
          solana-version: ${{ matrix.solana-version }}
          cache-key-suffix: ${{ matrix.solana-version }}
          
      - name: Setup Anchor ${{ matrix.anchor-version }}
        uses: ./.github/actions/setup-anchor
        with:
          anchor-version: ${{ matrix.anchor-version }}
          cache-key-suffix: ${{ matrix.anchor-version }}
          
      - name: Test compatibility
        run: |
          anchor build
          anchor test
```

### Custom Notification Formatting

```yaml
- name: Custom failure notification
  if: failure()
  uses: ./.github/actions/notify-failure
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
    run-id: ${{ github.run_id }}
    additional-info: |
      🔥 **Critical Production Failure** 🔥
      
      **Impact**: All services down
      **ETA**: Investigating
      **Oncall**: @devops-team
      
      **Next Steps**:
      1. Check rollback status
      2. Verify database integrity  
      3. Contact infrastructure team
```

## Best Practices

### 1. Caching Strategy

```yaml
# Good: Environment-specific cache keys
- name: Setup Solana  
  uses: ./.github/actions/setup-solana
  with:
    solana-version: "1.18.26"
    cache-key-suffix: "${{ matrix.os }}-${{ matrix.node-version }}"

# Better: Include file hashes for dependency changes
- name: Setup with smart caching
  uses: ./.github/actions/setup-anchor
  with:
    anchor-version: "0.30.1"  
    cache-key-suffix: "${{ hashFiles('**/Anchor.toml', '**/Cargo.lock') }}"
```

### 2. Error Handling

```yaml
# Good: Check action success
- name: Setup Solana
  id: solana-setup
  uses: ./.github/actions/setup-solana
  with:
    solana-version: "1.18.26"
    
- name: Verify setup
  if: steps.solana-setup.outcome == 'success'
  run: |
    echo "Solana version: ${{ steps.solana-setup.outputs.solana-version }}"
    solana --version

# Better: Handle failures gracefully  
- name: Setup Solana with fallback
  id: solana-setup
  uses: ./.github/actions/setup-solana
  with:
    solana-version: "1.18.26"
  continue-on-error: true
  
- name: Fallback installation
  if: steps.solana-setup.outcome == 'failure'
  run: |
    echo "Primary installation failed, trying manual installation"
    curl -sSfL https://release.solana.com/stable/install | sh
```

### 3. Security Considerations

```yaml
# Good: Use secrets properly
- name: Notify with secrets
  uses: ./.github/actions/notify-failure
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}  # ✅ Secure
    run-id: ${{ github.run_id }}

# Bad: Expose sensitive data
- name: Debug notification  
  run: |
    echo "Webhook URL: ${{ secrets.SLACK_WEBHOOK_URL }}"  # ❌ Logs secrets
```

### 4. Resource Management

```yaml
# Good: Clean resource usage
- name: Setup and test
  run: |
    # Your test commands
    
- name: Cleanup
  if: always()
  run: |
    pkill -f solana-test-validator || true
    rm -f temporary-files.json

# Better: Use containers for isolation
jobs:
  test:
    runs-on: ubuntu-latest
    container:
      image: solanalabs/rust:1.75.0
    steps:
      # Tests run in isolated environment
```

### 5. Notification Management

```yaml
# Good: Conditional notifications
- name: Notify on important failures
  if: failure() && github.ref == 'refs/heads/main'
  uses: ./.github/actions/notify-failure
  
# Better: Rate limiting and context-aware notifications
- name: Smart notification
  if: |
    failure() && 
    (github.ref == 'refs/heads/main' || startsWith(github.ref, 'refs/tags/'))
  uses: ./.github/actions/notify-failure
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
    additional-info: |
      Environment: ${{ github.ref == 'refs/heads/main' && 'Production' || 'Release' }}
      Severity: ${{ github.ref == 'refs/heads/main' && 'Critical' || 'High' }}
```

---

## Advanced Configuration

### Custom Action Development

If you need to extend these actions:

```yaml
# .github/actions/custom-setup/action.yml
name: 'Custom Solana Setup'
description: 'Extended Solana setup with custom tools'

inputs:
  solana-version:
    description: 'Solana version'
    required: true
  custom-tools:
    description: 'Additional tools to install'
    required: false
    default: 'spl-token-cli,solana-verify'

runs:
  using: 'composite'
  steps:
    - name: Setup base Solana
      uses: ./.github/actions/setup-solana
      with:
        solana-version: ${{ inputs.solana-version }}
        
    - name: Install custom tools
      shell: bash
      run: |
        IFS=',' read -ra TOOLS <<< "${{ inputs.custom-tools }}"
        for tool in "${TOOLS[@]}"; do
          echo "Installing $tool..."
          cargo install "$tool" || echo "Failed to install $tool"
        done
```

### Debugging Actions

```yaml
# Enable debug output
- name: Setup Solana with debug
  uses: ./.github/actions/setup-solana
  with:
    solana-version: "1.18.26"
  env:
    ACTIONS_STEP_DEBUG: true
    
- name: Debug action outputs
  run: |
    echo "All step outputs:"
    cat $GITHUB_OUTPUT || echo "No outputs found"
```

---

Need help with specific action configurations? Check the [main README](../README.md) or open an issue!