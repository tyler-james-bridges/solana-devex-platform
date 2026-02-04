# Troubleshooting Guide

## Common Issues and Solutions

### Installation Issues

#### Node.js Version Error
```
Error: Node.js version 14.x is not supported
```

**Solution:** Install Node.js 16 or higher:
```bash
# Using nvm
nvm install 16
nvm use 16

# Or download from https://nodejs.org/
```

#### Solana CLI Not Found
```
Error: solana-test-validator not found
```

**Solution:** Install Solana CLI:
```bash
# Linux/macOS
sh -c "$(curl -sSfL https://release.solana.com/v1.17.0/install)"

# Or using Homebrew (macOS)
brew install solana
```

#### Permission Denied
```
Error: EACCES: permission denied, mkdir '/home/user/.solana-test-validator-ext'
```

**Solution:** Check directory permissions:
```bash
sudo chown -R $USER ~/.solana-test-validator-ext
chmod 755 ~/.solana-test-validator-ext
```

### Runtime Issues

#### Validator Fails to Start
```
❌ Failed to start validator: spawn solana-test-validator ENOENT
```

**Possible Causes & Solutions:**

1. **Solana CLI not in PATH:**
   ```bash
   export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
   source ~/.bashrc  # or ~/.zshrc
   ```

2. **Port already in use:**
   ```bash
   # Check what's using the port
   lsof -i :8899
   
   # Kill the process or use a different port
   stve env create dev-alt --port 8901
   ```

3. **Insufficient disk space:**
   ```bash
   # Check disk usage
   df -h
   
   # Clean up ledger data
   stve validator reset --hard
   ```

#### Dashboard Won't Load
```
Error: Cannot connect to monitoring server
```

**Solutions:**

1. **Check if monitoring server is running:**
   ```bash
   stve monitor start --port 3001
   ```

2. **Firewall blocking connection:**
   ```bash
   # Allow port 3001
   sudo ufw allow 3001  # Linux
   ```

3. **Port conflict:**
   ```bash
   # Use different port
   stve monitor start --port 3002
   ```

#### High Memory Usage
```
Warning: Memory usage exceeding 4GB
```

**Solutions:**

1. **Reduce ledger retention:**
   ```yaml
   # Edit ~/.solana-test-validator-ext/config.yaml
   validator:
     limit_ledger_size: 10000000  # Reduce from 50MB
   ```

2. **Regular cleanup:**
   ```bash
   # Reset validator periodically
   stve validator reset
   
   # Clean old metrics
   ~/.solana-test-validator-ext/maintenance.sh
   ```

#### Slow Performance
```
Warning: Startup time > 60 seconds
```

**Solutions:**

1. **Check system resources:**
   ```bash
   # Monitor performance
   stve monitor metrics --watch
   
   # Run benchmark
   node scripts/benchmark.js
   ```

2. **Optimize configuration:**
   ```yaml
   # Edit config.yaml
   validator:
     slots_per_epoch: 32  # Reduce from 432000
     enable_rpc_transaction_history: false
   ```

3. **Hardware recommendations:**
   - Minimum: 4GB RAM, 2 cores
   - Recommended: 8GB RAM, 4 cores
   - SSD storage preferred

### Configuration Issues

#### Invalid Configuration
```
Error: Failed to load config: Invalid YAML
```

**Solution:**
```bash
# Backup and recreate config
cp ~/.solana-test-validator-ext/config.yaml ~/.solana-test-validator-ext/config.yaml.bak
stve config init
```

#### Environment Not Found
```
Error: Environment 'production' not found
```

**Solution:**
```bash
# List available environments
stve env list

# Create the missing environment
stve env create production --port 8902
```

#### Port Conflicts
```
Error: Port 8899 already in use
```

**Solutions:**

1. **Find conflicting process:**
   ```bash
   lsof -i :8899
   sudo kill -9 <pid>
   ```

2. **Use different port:**
   ```bash
   stve env create dev-alt --port 8901
   stve validator start dev-alt
   ```

### Network Issues

#### RPC Connection Timeout
```
Error: RPC request timed out
```

**Solutions:**

1. **Check validator is running:**
   ```bash
   stve validator status
   ```

2. **Test RPC endpoint:**
   ```bash
   curl -X POST -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}' \
     http://localhost:8899
   ```

3. **Restart validator:**
   ```bash
   stve validator restart
   ```

#### WebSocket Connection Failed
```
Dashboard: WebSocket connection failed
```

**Solutions:**

1. **Check monitoring server:**
   ```bash
   curl http://localhost:3001/health
   ```

2. **Browser proxy issues:**
   - Disable proxy for localhost
   - Try different browser
   - Clear browser cache

### Development Issues

#### Account Clone Failed
```
Error: Failed to clone account <pubkey>
```

**Solutions:**

1. **Check internet connection:**
   ```bash
   ping api.mainnet-beta.solana.com
   ```

2. **Verify account exists:**
   ```bash
   solana account <pubkey> --url mainnet-beta
   ```

3. **Try different RPC endpoint:**
   ```bash
   # Edit environment to use different RPC
   # (This feature would need to be added)
   ```

#### Transaction Failures
```
Error: Transaction simulation failed
```

**Solutions:**

1. **Check account balances:**
   ```bash
   solana balance --url http://localhost:8899
   ```

2. **Request airdrop:**
   ```bash
   solana airdrop 10 --url http://localhost:8899
   ```

3. **Reset environment:**
   ```bash
   stve validator restart --reset
   ```

## Getting Help

### Diagnostic Information

When reporting issues, please include:

```bash
# System information
uname -a
node --version
npm --version
solana --version

# Extension information
stve --version
stve config show
stve validator status

# Log files
tail -50 ~/.solana-test-validator-ext/validator.log
```

### Log Locations

- **Validator logs:** `~/.solana-test-validator-ext/validator.log`
- **Setup logs:** `~/.solana-test-validator-ext/setup.log`
- **Metrics data:** `~/.solana-test-validator-ext/metrics/`
- **Configuration:** `~/.solana-test-validator-ext/config.yaml`

### Useful Commands

```bash
# Full status check
stve validator status

# Reset everything
stve validator reset --hard
stve config init

# Check configuration
stve config show

# Monitor real-time
stve monitor metrics --watch

# Run benchmark
node scripts/benchmark.js
```

### Support Channels

1. **GitHub Issues:** Report bugs and request features
2. **GitHub Discussions:** Ask questions and share tips
3. **Documentation:** Check README and docs folder
4. **Discord:** Join Solana developer communities

### Self-Diagnosis Checklist

Before seeking help:

- [ ] Is Solana CLI installed and in PATH?
- [ ] Is Node.js 16+ installed?
- [ ] Are required ports available (8899, 3001)?
- [ ] Is there sufficient disk space (>1GB)?
- [ ] Are log files showing specific errors?
- [ ] Have you tried restarting the validator?
- [ ] Have you tried resetting the configuration?

---

If none of these solutions work, please create a GitHub issue with:
1. Your system information
2. Complete error messages
3. Steps to reproduce
4. Log files (sanitized)