# Troubleshooting Guide 🔧

Common issues and solutions when using Solana/Anchor GitHub Actions workflows.

## 📋 Table of Contents

- [Setup Issues](#setup-issues)
- [Build Problems](#build-problems)
- [Test Failures](#test-failures)
- [Deployment Issues](#deployment-issues)
- [Performance Problems](#performance-problems)
- [Security and Permissions](#security-and-permissions)
- [Debug Techniques](#debug-techniques)

## Setup Issues

### Solana CLI Installation Problems

#### Issue: Solana CLI not found after installation

```yaml
Error: solana: command not found
```

**Solution 1: Check PATH configuration**
```yaml
- name: Debug PATH
  run: |
    echo "PATH: $PATH"
    echo "Solana install directory:"
    ls -la ~/.local/share/solana/install/active_release/bin/ || echo "Directory not found"
    which solana || echo "Solana not in PATH"

- name: Manual PATH setup
  run: |
    export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
    echo "$HOME/.local/share/solana/install/active_release/bin" >> $GITHUB_PATH
    solana --version
```

**Solution 2: Use absolute path temporarily**
```yaml
- name: Test with absolute path
  run: |
    ~/.local/share/solana/install/active_release/bin/solana --version
    ~/.local/share/solana/install/active_release/bin/solana config get
```

#### Issue: Solana installation hangs or times out

```yaml
Error: Installation script hangs indefinitely
```

**Solution: Add timeout and retry logic**
```yaml
- name: Install Solana with timeout
  timeout-minutes: 10
  run: |
    for attempt in {1..3}; do
      echo "Installation attempt $attempt"
      if timeout 300 sh -c "$(curl -sSfL https://release.solana.com/v${{ env.SOLANA_VERSION }}/install)"; then
        echo "Installation successful"
        break
      else
        echo "Installation attempt $attempt failed"
        if [ $attempt -eq 3 ]; then
          echo "All installation attempts failed"
          exit 1
        fi
        sleep 10
      fi
    done
```

### Anchor CLI Installation Problems

#### Issue: Anchor installation fails with cargo

```yaml
Error: failed to compile `anchor-cli v0.30.1`
```

**Solution 1: Use AVM instead of cargo**
```yaml
- name: Install via AVM
  run: |
    cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
    avm install ${{ env.ANCHOR_VERSION }}
    avm use ${{ env.ANCHOR_VERSION }}
```

**Solution 2: Use precompiled binaries**
```yaml
- name: Download precompiled Anchor
  run: |
    curl -L https://github.com/coral-xyz/anchor/releases/download/v${{ env.ANCHOR_VERSION }}/anchor-${{ env.ANCHOR_VERSION }}-x86_64-unknown-linux-gnu.tar.gz | tar xz
    sudo mv anchor ~/.cargo/bin/
    chmod +x ~/.cargo/bin/anchor
```

#### Issue: AVM command not found

```yaml
Error: avm: command not found
```

**Solution: Ensure AVM is in PATH**
```yaml
- name: Setup AVM PATH
  run: |
    echo "$HOME/.cargo/bin" >> $GITHUB_PATH
    echo "$HOME/.avm/bin" >> $GITHUB_PATH
    export PATH="$HOME/.cargo/bin:$HOME/.avm/bin:$PATH"
    
- name: Verify AVM installation
  run: |
    which avm || echo "AVM not found"
    ls -la ~/.cargo/bin/avm || echo "AVM binary not found"
    ls -la ~/.avm/ || echo "AVM directory not found"
```

## Build Problems

### Cargo Build Failures

#### Issue: Rust version compatibility

```yaml
Error: package `anchor-lang v0.30.1` cannot be built because it requires rustc 1.75.0 or newer
```

**Solution: Update Rust toolchain**
```yaml
- name: Setup latest stable Rust
  uses: dtolnay/rust-toolchain@stable
  with:
    components: rustfmt, clippy

- name: Verify Rust version
  run: |
    rustc --version
    cargo --version
```

#### Issue: Missing dependencies

```yaml
Error: linker `cc` not found
```

**Solution: Install build dependencies**
```yaml
- name: Install system dependencies
  run: |
    sudo apt-get update
    sudo apt-get install -y \
      build-essential \
      pkg-config \
      libudev-dev \
      libssl-dev

- name: Install additional tools
  run: |
    sudo apt-get install -y \
      clang \
      llvm
```

### Anchor Build Issues

#### Issue: Program build fails with missing keypair

```yaml
Error: No such file or directory (os error 2): /path/to/program-keypair.json
```

**Solution 1: Generate missing keypairs**
```yaml
- name: Generate program keypairs
  run: |
    for program_dir in programs/*/; do
      if [ -d "$program_dir" ]; then
        program_name=$(basename "$program_dir")
        keypair_file="target/deploy/${program_name}-keypair.json"
        
        if [ ! -f "$keypair_file" ]; then
          echo "Generating keypair for $program_name"
          solana-keygen new --no-bip39-passphrase --silent --outfile "$keypair_file"
        fi
      fi
    done
```

**Solution 2: Use declare_id! macro**
```rust
// In your program's lib.rs
use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111");  // Use a consistent ID

#[program]
pub mod your_program {
    // Your program code
}
```

#### Issue: Anchor.toml configuration errors

```yaml
Error: failed to parse Anchor.toml
```

**Solution: Validate Anchor.toml**
```yaml
- name: Validate Anchor configuration
  run: |
    echo "Checking Anchor.toml syntax..."
    cat Anchor.toml
    
    # Basic validation
    if ! anchor build --help > /dev/null 2>&1; then
      echo "Anchor CLI not working properly"
      exit 1
    fi
    
    # Test configuration parsing
    anchor keys list || echo "Warning: Could not list program keys"
```

## Test Failures

### Local Validator Issues

#### Issue: Validator fails to start

```yaml
Error: Unable to connect to validator
Error: Connection refused
```

**Solution 1: Increase startup timeout**
```yaml
- name: Start validator with extended timeout
  run: |
    echo "Starting solana-test-validator..."
    solana-test-validator --detach --reset --quiet &
    VALIDATOR_PID=$!
    
    echo "Waiting for validator to start (PID: $VALIDATOR_PID)..."
    for i in {1..60}; do
      if solana cluster-version > /dev/null 2>&1; then
        echo "Validator started successfully after $i seconds"
        break
      fi
      
      if ! ps -p $VALIDATOR_PID > /dev/null; then
        echo "Validator process died"
        exit 1
      fi
      
      echo "Attempt $i/60: Validator not ready yet..."
      sleep 1
    done
    
    if ! solana cluster-version > /dev/null 2>&1; then
      echo "Validator failed to start after 60 seconds"
      exit 1
    fi
```

**Solution 2: Check port conflicts**
```yaml
- name: Check port availability
  run: |
    echo "Checking if ports are available..."
    
    # Check common Solana ports
    for port in 8899 8900 9900; do
      if netstat -tuln | grep ":$port "; then
        echo "Port $port is already in use"
        netstat -tuln | grep ":$port "
        exit 1
      else
        echo "Port $port is available"
      fi
    done

- name: Start validator with custom ports
  run: |
    solana-test-validator \
      --rpc-port 18899 \
      --rpc-bind-address 127.0.0.1 \
      --detach \
      --reset \
      --quiet
```

#### Issue: Validator runs out of disk space

```yaml
Error: No space left on device
```

**Solution: Clean up and optimize disk usage**
```yaml
- name: Clean up disk space
  run: |
    echo "Disk usage before cleanup:"
    df -h
    
    # Clean up previous test data
    rm -rf test-ledger/ || true
    rm -rf ~/.config/solana/cli/logs/ || true
    
    # Clean package caches
    sudo apt-get clean || true
    docker system prune -f || true
    
    echo "Disk usage after cleanup:"
    df -h

- name: Start validator with limited ledger
  run: |
    solana-test-validator \
      --detach \
      --reset \
      --quiet \
      --limit-ledger-size 50000000  # Limit to ~50MB
```

### Test Environment Problems

#### Issue: Test timeout errors

```yaml
Error: Test exceeded timeout of 10000ms
```

**Solution: Increase test timeouts and add retry logic**
```yaml
- name: Run tests with extended timeout
  run: |
    # Set test timeout environment variable
    export ANCHOR_TEST_TIMEOUT=60000  # 60 seconds
    
    # Run with retry logic
    for attempt in {1..3}; do
      echo "Test attempt $attempt"
      if npm test; then
        echo "Tests passed on attempt $attempt"
        break
      else
        echo "Tests failed on attempt $attempt"
        if [ $attempt -eq 3 ]; then
          echo "All test attempts failed"
          exit 1
        fi
        sleep 10
      fi
    done
```

**Solution: Optimize test performance**
```typescript
// In your test files
describe("Program Tests", () => {
  // Increase timeout for specific tests
  beforeEach(async () => {
    // Setup code with timeout
  });

  it("should process transaction", async () => {
    // Use Promise.race for timeout control
    const result = await Promise.race([
      yourAsyncFunction(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Test timeout')), 30000)
      )
    ]);
    
    expect(result).toBeDefined();
  }).timeout(60000);  // 60 second timeout
});
```

## Deployment Issues

### Wallet and Balance Problems

#### Issue: Insufficient balance for deployment

```yaml
Error: insufficient balance for deployment
```

**Solution: Check and fund wallet**
```yaml
- name: Check wallet balance and fund if needed
  run: |
    BALANCE=$(solana balance --lamports)
    MIN_BALANCE=100000000  # 0.1 SOL in lamports
    
    echo "Current balance: $BALANCE lamports"
    echo "Required balance: $MIN_BALANCE lamports"
    
    if [ "$BALANCE" -lt "$MIN_BALANCE" ]; then
      echo "Insufficient balance. Current: $BALANCE, Required: $MIN_BALANCE"
      
      # Try to airdrop on devnet/testnet
      if [[ "${{ env.CLUSTER }}" == "devnet" ]] || [[ "${{ env.CLUSTER }}" == "testnet" ]]; then
        echo "Attempting to airdrop SOL..."
        solana airdrop 1
        sleep 5
        
        NEW_BALANCE=$(solana balance --lamports)
        echo "New balance after airdrop: $NEW_BALANCE lamports"
        
        if [ "$NEW_BALANCE" -lt "$MIN_BALANCE" ]; then
          echo "Still insufficient balance after airdrop"
          exit 1
        fi
      else
        echo "Cannot airdrop on mainnet-beta. Please fund the wallet manually."
        exit 1
      fi
    fi
```

#### Issue: Invalid wallet configuration

```yaml
Error: failed to get recent blockhash: Invalid param: could not find account
```

**Solution: Validate wallet setup**
```yaml
- name: Validate wallet configuration
  env:
    DEPLOY_WALLET_SECRET: ${{ secrets.DEPLOY_WALLET_SECRET }}
  run: |
    echo "Validating wallet configuration..."
    
    # Check if secret is provided
    if [ -z "$DEPLOY_WALLET_SECRET" ]; then
      echo "DEPLOY_WALLET_SECRET is not set"
      exit 1
    fi
    
    # Create wallet file
    echo "$DEPLOY_WALLET_SECRET" > wallet.json
    
    # Validate wallet format
    if ! solana-keygen verify wallet.json; then
      echo "Invalid wallet format"
      cat wallet.json  # Debug output (be careful with real secrets)
      exit 1
    fi
    
    # Set up Solana config
    solana config set --keypair wallet.json
    
    # Test connection
    if ! solana address; then
      echo "Cannot get wallet address"
      exit 1
    fi
    
    echo "Wallet validation successful"
    echo "Address: $(solana address)"
```

### Program Deployment Failures

#### Issue: Program deployment verification fails

```yaml
Error: Program deployment verification failed
```

**Solution: Add comprehensive deployment verification**
```yaml
- name: Deploy with verification
  run: |
    echo "Starting deployment..."
    
    # Deploy all programs
    anchor deploy --provider.cluster ${{ env.CLUSTER }}
    
    echo "Verifying deployments..."
    
    # Verify each program
    anchor keys list > program_keys.txt
    
    FAILED_PROGRAMS=""
    while read -r line; do
      if [[ $line == *": "* ]]; then
        PROGRAM_NAME=$(echo "$line" | cut -d':' -f1)
        PROGRAM_ID=$(echo "$line" | cut -d':' -f2 | tr -d ' ')
        
        echo "Verifying $PROGRAM_NAME at $PROGRAM_ID..."
        
        # Check if account exists
        if solana account "$PROGRAM_ID" --output json > /dev/null 2>&1; then
          echo "✅ $PROGRAM_NAME deployed successfully"
          
          # Additional verification: check if it's executable
          ACCOUNT_INFO=$(solana account "$PROGRAM_ID" --output json)
          if echo "$ACCOUNT_INFO" | jq -e '.account.executable == true' > /dev/null; then
            echo "✅ $PROGRAM_NAME is executable"
          else
            echo "⚠️ $PROGRAM_NAME exists but is not executable"
            FAILED_PROGRAMS="$FAILED_PROGRAMS $PROGRAM_NAME"
          fi
        else
          echo "❌ $PROGRAM_NAME deployment failed"
          FAILED_PROGRAMS="$FAILED_PROGRAMS $PROGRAM_NAME"
        fi
      fi
    done < program_keys.txt
    
    if [ -n "$FAILED_PROGRAMS" ]; then
      echo "Failed programs:$FAILED_PROGRAMS"
      exit 1
    fi
    
    echo "All programs deployed and verified successfully"
```

### Network and RPC Issues

#### Issue: RPC connection timeouts

```yaml
Error: RPC connection timed out
```

**Solution: Add retry logic and fallback RPCs**
```yaml
- name: Deploy with RPC fallbacks
  run: |
    # Define RPC endpoints for each environment
    case "${{ env.CLUSTER }}" in
      "mainnet-beta")
        RPC_URLS=(
          "https://api.mainnet-beta.solana.com"
          "https://solana-mainnet.rpc.extrnode.com"
          "https://rpc.ankr.com/solana"
        )
        ;;
      "testnet")
        RPC_URLS=(
          "https://api.testnet.solana.com"
          "https://testnet.solana.com"
        )
        ;;
      "devnet")
        RPC_URLS=(
          "https://api.devnet.solana.com"
          "https://devnet.solana.com"
        )
        ;;
    esac
    
    # Try each RPC endpoint
    for rpc_url in "${RPC_URLS[@]}"; do
      echo "Trying RPC: $rpc_url"
      
      solana config set --url "$rpc_url"
      
      # Test connection
      if solana cluster-version --timeout 30; then
        echo "Successfully connected to $rpc_url"
        
        # Attempt deployment
        if anchor deploy --provider.cluster "${{ env.CLUSTER }}"; then
          echo "Deployment successful using $rpc_url"
          break
        else
          echo "Deployment failed with $rpc_url, trying next..."
        fi
      else
        echo "Failed to connect to $rpc_url"
      fi
    done
```

## Performance Problems

### Slow Build Times

#### Issue: Rust compilation takes too long

**Solution: Optimize caching and parallel builds**
```yaml
- name: Optimize Rust caching
  uses: Swatinem/rust-cache@v2
  with:
    # Include more cache keys for better hit rates
    key: ${{ runner.os }}-cargo-${{ hashFiles('**/Cargo.lock') }}-${{ hashFiles('**/Cargo.toml') }}
    restore-keys: |
      ${{ runner.os }}-cargo-${{ hashFiles('**/Cargo.lock') }}-
      ${{ runner.os }}-cargo-

- name: Build with parallel jobs
  run: |
    # Use all available cores
    export CARGO_BUILD_JOBS=$(nproc)
    echo "Building with $CARGO_BUILD_JOBS parallel jobs"
    
    # Build with optimized flags
    CARGO_NET_GIT_FETCH_WITH_CLI=true \
    CARGO_INCREMENTAL=1 \
    cargo build --release
```

### Memory Issues

#### Issue: Out of memory during build

```yaml
Error: signal: 9 (SIGKILL) - out of memory
```

**Solution: Optimize memory usage**
```yaml
- name: Check available memory
  run: |
    echo "Available memory:"
    free -h
    echo "Available disk space:"
    df -h

- name: Build with memory constraints
  run: |
    # Limit parallel jobs to reduce memory usage
    export CARGO_BUILD_JOBS=1
    
    # Use less memory for linking
    export RUSTFLAGS="-C link-arg=-Wl,--no-keep-memory"
    
    # Split build into smaller chunks
    cargo build --lib
    cargo build --bins
```

## Security and Permissions

### Secret Management Issues

#### Issue: Secrets not accessible in workflow

```yaml
Error: DEPLOY_WALLET_SECRET is empty
```

**Solution: Debug secret configuration**
```yaml
- name: Debug secrets availability
  run: |
    echo "Checking secret availability..."
    
    # Check if secret is set (without exposing value)
    if [ -z "${{ secrets.DEPLOY_WALLET_SECRET }}" ]; then
      echo "❌ DEPLOY_WALLET_SECRET is not set"
      echo "Please check:"
      echo "1. Secret is added in repository settings"
      echo "2. Secret name matches exactly"
      echo "3. Current workflow has access to the secret"
      exit 1
    else
      echo "✅ DEPLOY_WALLET_SECRET is available"
      echo "Secret length: ${#{{ secrets.DEPLOY_WALLET_SECRET }}}"
    fi

- name: Validate secret format
  env:
    WALLET_SECRET: ${{ secrets.DEPLOY_WALLET_SECRET }}
  run: |
    echo "Validating secret format..."
    
    # Check if it looks like a JSON array
    if [[ "$WALLET_SECRET" =~ ^\[.*\]$ ]]; then
      echo "✅ Secret appears to be in array format"
    else
      echo "⚠️ Secret might not be in correct format"
      echo "Expected: [1,2,3,...]"
      echo "Got length: ${#WALLET_SECRET}"
    fi
```

### Permission Errors

#### Issue: GitHub token permissions insufficient

```yaml
Error: insufficient permissions to write to repository
```

**Solution: Check and configure permissions**
```yaml
name: CI with correct permissions

on: [push, pull_request]

# Explicitly set permissions
permissions:
  contents: read
  actions: read
  security-events: write  # For CodeQL
  checks: write           # For test results

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
      
      # Your workflow steps
```

## Debug Techniques

### Enable Debug Logging

```yaml
- name: Enable debug mode
  run: |
    # Enable Rust debug logging
    export RUST_LOG=debug
    export RUST_BACKTRACE=1
    
    # Enable Solana debug logging
    export SOLANA_LOG=debug
    
    # Enable Anchor debug logging
    export ANCHOR_LOG=debug
    
    # Your commands here
    anchor build
```

### Comprehensive Debug Information

```yaml
- name: Collect debug information
  if: failure()
  run: |
    echo "=== System Information ==="
    uname -a
    cat /etc/os-release
    
    echo "=== Environment Variables ==="
    env | grep -E "(SOLANA|ANCHOR|CARGO|RUST)" | sort
    
    echo "=== Network Information ==="
    ping -c 3 api.devnet.solana.com || true
    curl -s https://api.devnet.solana.com -o /dev/null -w "HTTP: %{http_code}, Time: %{time_total}s\n" || true
    
    echo "=== Disk Usage ==="
    df -h
    du -sh ~/.cargo ~/.cache ~/.local 2>/dev/null || true
    
    echo "=== Process Information ==="
    ps aux | grep -E "(solana|anchor|validator)" || true
    
    echo "=== Port Usage ==="
    netstat -tuln | grep -E "(8899|8900|9900)" || true
    
    echo "=== Log Files ==="
    find . -name "*.log" -exec echo "=== {} ===" \; -exec tail -20 {} \; 2>/dev/null || true
    
    echo "=== Solana Configuration ==="
    solana config get || true
    solana address || true
    solana balance || true
```

### Interactive Debugging

```yaml
- name: Setup tmate session for debugging
  if: failure() && github.event_name == 'workflow_dispatch'
  uses: mxschmitt/action-tmate@v3
  with:
    limit-access-to-actor: true
    timeout-minutes: 30
```

### Log Analysis

```yaml
- name: Analyze logs on failure
  if: failure()
  run: |
    echo "Analyzing recent logs..."
    
    # Check validator logs
    if [ -d "test-ledger" ]; then
      echo "=== Validator Logs ==="
      find test-ledger -name "*.log" -exec tail -50 {} +
    fi
    
    # Check anchor logs
    if [ -f "anchor.log" ]; then
      echo "=== Anchor Logs ==="
      tail -100 anchor.log
    fi
    
    # Check for common error patterns
    echo "=== Error Pattern Analysis ==="
    grep -r "ERROR\|FAILED\|panic" . --include="*.log" || echo "No error patterns found"
    
    # Check system messages
    echo "=== System Messages ==="
    dmesg | tail -20 || echo "Cannot access system messages"
```

---

## Getting More Help

If you're still experiencing issues:

1. **Check the GitHub Actions logs** - Look for the specific error messages
2. **Search existing issues** - Someone might have faced the same problem
3. **Enable debug mode** - Use the debug techniques above
4. **Create a minimal reproduction** - Isolate the problem
5. **Open an issue** - Include your debug information

### Useful Resources

- [Solana Documentation](https://docs.solana.com/)
- [Anchor Documentation](https://www.anchor-lang.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Solana Discord](https://discord.gg/solana)
- [Anchor Discord](https://discord.gg/PBbAqzj)

Remember: Most issues are configuration or environment related. Double-check your setup before assuming it's a bug! 🐛