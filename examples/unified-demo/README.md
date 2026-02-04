# Unified Platform Demo

## 🎯 Overview

This example demonstrates the complete Solana DevEx Platform integration by creating a simple token program that uses all platform components:

- **🏗️ Project Scaffolding** - Initialized with `solana-devex init`
- **🧪 Enhanced Testing** - Jest blockchain extensions + Anchor testing layer
- **🌐 Test Validator** - Enhanced validator with performance monitoring  
- **🔄 CI/CD Pipeline** - Complete GitHub Actions workflow
- **📊 Monitoring** - Real-time dashboard for program metrics
- **⚓ Anchor Enhancements** - Advanced Anchor development tools

## 🚀 Quick Start

### 1. Initialize Project
```bash
# Create project with all platform features
solana-devex init token-demo --template anchor --testing --cicd --monitoring --validator

cd token-demo
```

### 2. Start Development Environment
```bash
# Start enhanced test validator with monitoring
solana-devex validator start --monitor --reset

# Start monitoring dashboard (in another terminal)
solana-devex monitor start
```

### 3. Build and Test
```bash
# Build the program
solana-devex build

# Run tests with blockchain extensions
solana-devex test --coverage --validator
```

### 4. Monitor Performance
- **Validator Dashboard**: http://localhost:8890
- **Platform Monitoring**: http://localhost:3000

## 📁 Project Structure

```
token-demo/
├── programs/
│   └── token-demo/
│       ├── src/
│       │   └── lib.rs          # Token program logic
│       └── Cargo.toml
├── tests/
│   └── token-demo.ts           # Enhanced Anchor tests
├── app/
│   ├── package.json
│   └── src/
│       └── client.ts           # TypeScript client
├── .github/
│   └── workflows/
│       ├── test.yml            # Automated testing
│       ├── build.yml           # Build pipeline
│       └── deploy.yml          # Deployment workflow
├── Anchor.toml                 # Anchor configuration
├── package.json                # Node.js dependencies
├── solana-devex.config.js      # Unified platform config
└── jest.config.js              # Testing configuration
```

## 🧪 Enhanced Testing Examples

### Blockchain-Specific Matchers
```javascript
const { expect } = require('jest');

describe('Token Program', () => {
  test('should mint tokens successfully', async () => {
    const mintTx = await program.rpc.mintTokens(
      new anchor.BN(1000),
      {
        accounts: {
          mint: mintAccount.publicKey,
          authority: provider.wallet.publicKey,
          recipient: recipientAccount.publicKey,
        },
        signers: [mintAccount],
      }
    );
    
    // Use blockchain-specific matchers
    expect(mintTx).toHaveSucceeded();
    expect(recipientAccount).toHaveBalance(1000);
    expect(program).toHaveEmitted('TokensMinted', {
      amount: 1000,
      recipient: recipientAccount.publicKey
    });
  });

  test('should handle transfer correctly', async () => {
    const transferTx = await program.rpc.transferTokens(
      new anchor.BN(500),
      {
        accounts: {
          from: fromAccount.publicKey,
          to: toAccount.publicKey,
          authority: provider.wallet.publicKey,
        },
      }
    );
    
    expect(transferTx).toHaveSucceeded();
    expect(fromAccount).toHaveBalance(500);
    expect(toAccount).toHaveBalance(500);
  });
});
```

### Anchor Testing Enhancements
```javascript
const { enhancedTest, performanceMonitor } = require('@solana-devex/anchor-layer');

enhancedTest('Token operations with monitoring', async ({ program, provider }) => {
  // Automatic performance monitoring
  const monitor = performanceMonitor.start('token-operations');
  
  try {
    // Test setup with automatic account creation
    const { mint, tokenAccount } = await setupTokenAccounts(program, provider);
    
    // Mint tokens with performance tracking
    await program.rpc.mintTokens(new anchor.BN(1000), {
      accounts: {
        mint: mint.publicKey,
        authority: provider.wallet.publicKey,
        recipient: tokenAccount.publicKey,
      },
    });
    
    // Assertions with enhanced matchers
    expect(tokenAccount).toHaveTokenBalance(1000);
    expect(mint).toHaveSupply(1000);
    
  } finally {
    monitor.stop();
  }
});
```

## 🌐 Enhanced Test Validator

### Configuration
```javascript
// solana-devex.config.js
module.exports = {
  validator: {
    port: 8899,
    resetState: true,
    monitoring: {
      enabled: true,
      port: 8890,
      metricsInterval: 1000,
      trackAccounts: ['*'], // Track all accounts
    },
    logging: {
      enabled: true,
      level: 'debug',
      file: './validator.log'
    },
    programs: [
      './target/deploy/token_demo.so'
    ]
  }
};
```

### Usage
```bash
# Start with custom configuration
solana-devex validator start --monitor --config ./custom-validator.toml

# Monitor specific metrics
solana-devex validator monitor --metrics transaction-count,tps,memory-usage

# View logs in real-time
solana-devex validator logs --follow
```

## 🔄 CI/CD Integration

### GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Solana DevEx Platform
        uses: solana-devex/setup-action@v1
        with:
          solana-version: 1.17.0
          anchor-version: 0.29.0
          
      - name: Install Dependencies
        run: |
          npm install
          solana-devex config init --ci
          
      - name: Build Program
        run: solana-devex build --verify
        
      - name: Run Tests
        run: solana-devex test --coverage --validator --ci
        
      - name: Upload Coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

### Deployment Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Platform
        uses: solana-devex/setup-action@v1
        
      - name: Deploy to Devnet
        run: |
          solana-devex build --release
          solana-devex deploy --network devnet --verify
          
      - name: Integration Tests
        run: solana-devex test --network devnet --integration
        
      - name: Update Monitoring
        run: solana-devex monitor deploy --environment production
```

## 📊 Monitoring Integration

### Dashboard Features
- **Real-time Metrics** - TPS, block time, memory usage
- **Transaction Analytics** - Success rates, error patterns  
- **Account Monitoring** - Balance changes, state updates
- **Program Health** - Call frequency, execution time
- **Custom Alerts** - Performance thresholds, error spikes

### Custom Metrics
```javascript
// In your tests or application
const { platformMonitor } = require('@solana-devex/monitoring');

// Track custom metrics
platformMonitor.increment('token.mints.count');
platformMonitor.timing('token.transfer.duration', transferTime);
platformMonitor.gauge('token.total_supply', totalSupply);

// Custom alerts
platformMonitor.alert('high_error_rate', {
  condition: 'error_rate > 0.05',
  duration: '5m',
  notification: 'slack'
});
```

## 🎯 Key Benefits Demonstrated

### 1. Unified Experience
- Single CLI for all operations
- Consistent configuration across components
- Seamless integration between tools

### 2. Enhanced Testing
- Blockchain-specific Jest matchers
- Automatic validator management
- Performance monitoring integration
- Comprehensive test coverage

### 3. Production Readiness
- Complete CI/CD pipeline
- Monitoring and alerting
- Security best practices
- Deployment automation

### 4. Developer Productivity
- Reduced tool switching
- Automated setup and configuration
- Rich debugging and monitoring tools
- Comprehensive documentation

## 🚀 Next Steps

1. **Explore Advanced Features**
   - Custom monitoring dashboards
   - Multi-network deployments
   - Performance optimization tools

2. **Integrate with Your Project**
   - Copy configuration patterns
   - Adapt testing strategies
   - Implement monitoring

3. **Contribute to Platform**
   - Report issues and suggestions
   - Contribute new features
   - Share your use cases

## 📚 Related Documentation

- [Platform Setup Guide](../../docs/SETUP_GUIDE.md)
- [Testing Advanced Features](../../docs/testing.md)
- [Monitoring Configuration](../../docs/monitoring.md)
- [CI/CD Best Practices](../../docs/deployment.md)

---

**This demo showcases the power of unified Solana development - everything you need in one cohesive platform!** 🚀