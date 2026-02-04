# Solana DevEx Platform

## 🚀 Unified Solana Developer Experience Platform

A comprehensive, production-ready development platform that integrates all essential tools for Solana development into a single, cohesive experience. No more juggling multiple tools – everything you need is unified under one command.

## ✨ What's Integrated

### 🎯 Core Components
- **🏗️ Enhanced Project Scaffolding** - Foundry-style project initialization and building
- **🧪 Blockchain Testing Extensions** - Jest custom matchers specifically for Solana/Anchor testing
- **⚓ Anchor Enhancement Layer** - Advanced testing utilities and monitoring for Anchor projects
- **🌐 Enhanced Test Validator** - Test validator with performance monitoring and automation
- **🔄 CI/CD Pipeline** - Complete GitHub Actions templates and deployment automation
- **📊 Monitoring Dashboard** - Real-time monitoring for your Solana applications

### 🌟 Unified Features
- **Single CLI** - One command (`solana-devex`) for all functionality
- **Shared Configuration** - Consistent settings across all tools
- **Seamless Integration** - All components work together out of the box
- **Production Ready** - Built for teams and enterprise use

---

## 🚀 Quick Start

### One-Command Setup
```bash
# Install the platform
npm install -g solana-devex-platform

# Run the setup wizard
solana-devex setup

# Create your first project
solana-devex init my-awesome-dapp --testing --cicd --monitoring --validator
```

### Manual Setup
```bash
# Clone the platform
git clone https://github.com/solana-devex/platform.git
cd solana-devex-platform

# Install dependencies
npm install

# Initialize configuration
solana-devex config init

# Start building!
solana-devex init my-project
```

---

## 🛠️ Unified CLI Commands

### Project Management
```bash
# Initialize new project with full platform integration
solana-devex init [name] --template anchor --testing --cicd --monitoring --validator

# Build projects (Anchor + TypeScript)
solana-devex build --release --verify --parallel

# Configuration management
solana-devex config init
solana-devex config show
```

### Testing & Quality
```bash
# Run tests with blockchain-specific matchers
solana-devex test --coverage --validator --anchor

# Enhanced Anchor testing
solana-devex anchor enhance
solana-devex anchor monitor
```

### Development Environment
```bash
# Enhanced test validator with monitoring
solana-devex validator start --monitor --reset
solana-devex validator stop
solana-devex validator monitor

# Real-time monitoring dashboard
solana-devex monitor start --port 3000
solana-devex monitor api
```

### CI/CD & Deployment
```bash
# Setup complete CI/CD pipeline
solana-devex cicd setup
solana-devex cicd actions

# GitHub Actions template setup
solana-devex actions setup
```

---

## 📋 Platform Architecture

```
solana-devex-platform/
├── bin/
│   └── solana-devex              # Unified CLI entry point
├── packages/
│   ├── cli/                      # Core CLI commands (build, init, deploy)
│   ├── jest-extensions/          # Blockchain testing matchers
│   ├── anchor-layer/             # Anchor enhancements
│   ├── test-validator/           # Enhanced test validator
│   ├── github-actions/           # CI/CD templates
│   └── shared/                   # Shared utilities & config
├── apps/
│   ├── dashboard/                # Web monitoring dashboard
│   └── monitor/                  # Monitoring backend
├── docs/                         # Complete documentation
└── examples/                     # Example projects
```

---

## 🔧 Configuration

### Shared Configuration File
All components share a single configuration file: `solana-devex.config.js`

```javascript
module.exports = {
  platform: {
    environment: 'development',
    logLevel: 'info'
  },
  solana: {
    network: 'localnet',
    rpcUrl: 'http://localhost:8899',
    commitment: 'confirmed'
  },
  testing: {
    framework: 'jest',
    parallel: true,
    coverage: true,
    validators: {
      autoStart: true,
      port: 8899,
      resetState: true
    }
  },
  validator: {
    port: 8899,
    monitoring: {
      enabled: true,
      port: 8890
    }
  },
  monitoring: {
    dashboard: {
      enabled: true,
      port: 3000
    },
    api: {
      enabled: true,
      port: 3001
    }
  }
};
```

---

## 🧪 Enhanced Testing

### Jest Blockchain Extensions
Custom matchers specifically designed for Solana and Anchor testing:

```javascript
// Test account balances
expect(account).toHaveBalance(1000000);

// Test transaction success
expect(transaction).toHaveSucceeded();

// Test program interactions
expect(program).toHaveEmitted('Transfer', { from, to, amount });

// Test account data
expect(account).toHaveData({ initialized: true });
```

### Anchor Testing Enhancements
Advanced utilities for Anchor program testing:

```javascript
// Enhanced test setup with monitoring
const { enhancedTest } = require('@solana-devex/anchor-layer');

enhancedTest('Token transfer', async ({ program, provider }) => {
  // Test with automatic performance monitoring
  const result = await program.rpc.transfer(amount, {
    accounts: { from, to, authority },
    signers: [authority]
  });
  
  expect(result).toHaveSucceeded();
  expect(provider.wallet).toHaveBalance(expectedBalance);
});
```

---

## 🌐 Enhanced Test Validator

### Features
- **Performance Monitoring** - Real-time metrics and dashboards
- **Automated Management** - Auto-start/stop with tests
- **Advanced Logging** - Detailed transaction and account monitoring
- **State Management** - Easy reset and snapshot capabilities

### Usage
```bash
# Start with full monitoring
solana-devex validator start --monitor --reset

# View performance dashboard
solana-devex validator monitor

# Monitor specific accounts
solana-devex validator monitor --accounts <pubkey1,pubkey2>
```

---

## 📊 Monitoring Dashboard

### Real-time Monitoring
- **Transaction Analytics** - Success rates, gas usage, timing
- **Account Monitoring** - Balance changes, state updates
- **Program Health** - Error rates, performance metrics
- **Validator Status** - Node health, network stats

### Access Dashboard
```bash
# Start monitoring suite
solana-devex monitor start

# Access at http://localhost:3000
# API available at http://localhost:3001
```

---

## 🔄 CI/CD Integration

### GitHub Actions Templates
Pre-configured workflows for:
- **Testing** - Automated test runs with validator
- **Building** - Anchor program compilation
- **Deployment** - Multi-environment deployments
- **Monitoring** - Continuous health checks

### Setup Pipeline
```bash
# Setup complete CI/CD pipeline
solana-devex cicd setup

# Add specific templates
solana-devex cicd actions --templates test,build,deploy
```

---

## 📚 Documentation

### Complete Guides
- [**Quick Start**](./docs/quickstart.md) - Get started in 5 minutes
- [**Configuration**](./docs/configuration.md) - Detailed configuration options
- [**Testing Guide**](./docs/testing.md) - Advanced testing patterns
- [**Deployment**](./docs/deployment.md) - Production deployment guide
- [**Monitoring**](./docs/monitoring.md) - Monitoring and observability
- [**CLI Reference**](./docs/cli-reference.md) - Complete command reference

### Examples
- [**Basic Anchor Project**](./examples/basic-anchor/)
- [**Token Program**](./examples/token-program/)
- [**NFT Collection**](./examples/nft-collection/)
- [**DeFi Protocol**](./examples/defi-protocol/)

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Setup
```bash
# Clone repository
git clone https://github.com/solana-devex/platform.git
cd solana-devex-platform

# Install dependencies
npm run setup

# Run tests
npm test

# Start development environment
npm run dev
```

---

## 🆘 Support

### Community
- **Discord**: [Solana DevEx Community](https://discord.gg/solana-devex)
- **GitHub Issues**: [Report bugs or request features](https://github.com/solana-devex/platform/issues)
- **Documentation**: [Complete docs](https://docs.solana-devex.com)

### Professional Support
- **Enterprise Support**: enterprise@solana-devex.com
- **Consulting**: consulting@solana-devex.com

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

---

## 🙏 Acknowledgments

Built with ❤️ for the Solana developer community. Special thanks to:
- **Solana Labs** - For the amazing Solana ecosystem
- **Anchor Framework** - For simplifying Solana development
- **The Community** - For feedback and contributions

---

**Ready to supercharge your Solana development? Get started with `solana-devex setup`!** 🚀