# Solana Test Validator Extension Layer

> Enhanced Solana test validator with performance metrics, automation, and developer productivity features.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D16.0.0-green.svg)](https://nodejs.org/)
[![Solana](https://img.shields.io/badge/solana-compatible-purple.svg)](https://solana.com/)

## 🚀 Features

- **🎮 Enhanced CLI** - Intuitive command-line interface with rich output
- **🌍 Multi-Environment Management** - Switch between different validator configurations
- **📊 Real-time Monitoring** - Web dashboard with live performance metrics
- **🔄 Automated Setup/Teardown** - One-command environment management
- **⚡ Performance Metrics** - CPU, memory, disk, and validator-specific metrics
- **📈 Historical Analytics** - Track performance over time
- **🧹 Reset Automation** - Automated ledger reset and cleanup
- **🔧 Developer Tools** - Benchmarking, maintenance scripts, and utilities
- **📱 Web Dashboard** - Modern, responsive monitoring interface
- **🎯 Production Ready** - Systemd/Launchd services and auto-start capabilities

## 📦 Quick Start

### 1. Installation

```bash
# Clone or download the project
git clone <repository-url>
cd solana-test-validator-extension

# Run the auto-setup script (recommended)
chmod +x scripts/auto-setup.sh
./scripts/auto-setup.sh
```

### 2. Basic Usage

```bash
# Initialize configuration
./cli/index.js config init

# Start validator with monitoring dashboard
./cli/index.js validator start development --monitor

# Open dashboard
open http://localhost:3001

# Check status
./cli/index.js validator status

# Stop validator
./cli/index.js validator stop
```

### 3. Using Aliases (after setup)

```bash
# Source the aliases
source ~/.solana-test-validator-ext/aliases.sh

# Now you can use short commands
stve validator start development --monitor
solana-dev --monitor
solana-status
```

## 🎯 Core Components

### CLI Interface

The main command-line interface provides comprehensive validator management:

```bash
# Validator lifecycle
stve validator start [environment] [--monitor] [--reset]
stve validator stop
stve validator restart [environment] [--reset]
stve validator reset [--hard]
stve validator status

# Environment management
stve env create <name> [--port <port>] [--reset] [--clone-account <pubkey>]
stve env list
stve env switch <name>

# Monitoring
stve monitor start [--port <port>]
stve monitor metrics [--watch]

# Configuration
stve config init
stve config show
```

### Environment Manager

Manage multiple test validator configurations:

- **Development** - Default environment (port 8899)
- **Testing** - Auto-reset environment (port 8900)  
- **Local** - Local development with mainnet accounts (port 8901)
- **Custom** - Create your own environments with specific settings

```bash
# Create a custom environment
stve env create staging \
  --port 8902 \
  --clone-account EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v \
  --clone-account Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB \
  --description "Staging environment with USDC and USDT"

# Switch to the new environment
stve env switch staging

# Start validator with the staging environment
stve validator start staging --monitor
```

### Performance Monitoring

Real-time metrics collection and monitoring:

- **System Metrics**: CPU, Memory, Load Average
- **Validator Metrics**: TPS, Block Height, Slot Height, Process Stats
- **Storage Metrics**: Ledger Size, Disk Usage, Free Space
- **Network Metrics**: Interface Stats, Data Transfer

### Web Dashboard

Modern web interface accessible at `http://localhost:3001`:

- Live metrics updates via WebSocket
- Interactive validator controls
- Real-time performance charts
- Log viewing and management
- Environment switching
- Mobile-responsive design

## 🛠️ Advanced Usage

### Automated Testing Workflow

```bash
# Start a clean testing environment
stve validator start testing --reset --monitor

# Run your tests
npm test

# Reset for next test run
stve validator reset

# Or restart with fresh state
stve validator restart testing --reset
```

### Performance Benchmarking

```bash
# Run comprehensive benchmark
node scripts/benchmark.js

# View results
cat ~/.solana-test-validator-ext/benchmark-reports/benchmark-*.json
```

### Production Deployment

The extension includes service definitions for system integration:

**Linux (Systemd):**
```bash
# Enable auto-start
systemctl --user enable solana-test-validator-ext
systemctl --user start solana-test-validator-ext

# View logs
journalctl --user -f -u solana-test-validator-ext
```

**macOS (Launchd):**
```bash
# Load service
launchctl load ~/Library/LaunchAgents/com.solana.test-validator-ext.plist

# Start service
launchctl start com.solana.test-validator-ext
```

### Maintenance and Cleanup

```bash
# Run maintenance script (cleans old logs, updates dependencies)
~/.solana-test-validator-ext/maintenance.sh

# Manual cleanup
stve monitor metrics --cleanup-old
```

## 📊 API Integration

The monitoring server exposes REST APIs for integration:

```javascript
// Get current status
fetch('http://localhost:3001/api/status')
  .then(r => r.json())
  .then(status => console.log(status));

// Start validator programmatically
fetch('http://localhost:3001/api/validator/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ environment: 'development', monitoring: true })
});

// Get historical metrics
fetch('http://localhost:3001/api/metrics/history?start=2023-01-01&end=2023-01-02')
  .then(r => r.json())
  .then(metrics => console.log(metrics));
```

## ⚙️ Configuration

Configuration is stored in `~/.solana-test-validator-ext/config.yaml`:

```yaml
default_environment: development

validator:
  ledger_dir: ~/.solana-test-validator-ext/ledger
  accounts_dir: ~/.solana-test-validator-ext/accounts
  log_file: ~/.solana-test-validator-ext/validator.log
  rpc_port: 8899
  rpc_bind_address: 127.0.0.1
  enable_rpc_transaction_history: true
  limit_ledger_size: 50000000

monitoring:
  enabled: true
  metrics_port: 3001
  dashboard_port: 3002
  collect_interval_ms: 1000
  retention_hours: 24

performance:
  alert_thresholds:
    cpu_percent: 85
    memory_mb: 3072
    disk_gb: 90
```

### Environment Configuration

Each environment is stored as a separate YAML file in `~/.solana-test-validator-ext/environments/`:

```yaml
name: development
port: 8899
reset: false
cloneAccounts:
  - EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v  # USDC
  - Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB  # USDT
accountsDir: null
description: Development environment with common tokens
customFlags: []
programs: []
setupScripts: []
teardownScripts: []
```

## 🔧 Development

### Project Structure

```
solana-test-validator-extension/
├── cli/                    # Command-line interface
│   └── index.js           # Main CLI entry point
├── lib/                   # Core libraries
│   ├── config-loader.js   # Configuration management
│   ├── validator-manager.js # Validator lifecycle management
│   ├── environment-manager.js # Multi-environment support
│   ├── performance-collector.js # Metrics collection
│   └── monitoring-server.js # Web server and API
├── monitoring/            # Web dashboard
│   ├── dashboard.html    # Main dashboard interface
│   └── public/          # Static assets
├── scripts/              # Utility scripts
│   ├── auto-setup.sh    # Automated installation
│   └── benchmark.js     # Performance benchmarking
├── config/              # Default configurations
├── docs/               # Documentation
└── examples/           # Usage examples
```

### Adding New Features

1. **Extend CLI**: Add new commands in `cli/index.js`
2. **Add Metrics**: Extend `PerformanceCollector` class
3. **Environment Options**: Update `EnvironmentManager`
4. **Dashboard Features**: Modify `monitoring/dashboard.html`
5. **API Endpoints**: Add routes to `MonitoringServer`

### Testing

```bash
# Install dependencies
npm install

# Run linting
npm run lint

# Run tests
npm test

# Build TypeScript (if used)
npm run build
```

## 📚 Documentation

- [Quick Start Guide](~/.solana-test-validator-ext/QUICK_START.md)
- [API Documentation](docs/API.md)
- [Configuration Reference](docs/CONFIG.md)
- [Troubleshooting Guide](docs/TROUBLESHOOTING.md)

## 🎯 Use Cases

### DApp Development
```bash
# Start development environment with monitoring
stve validator start development --monitor

# Clone important accounts for testing
stve env create dapp-dev \
  --clone-account <your-program-account> \
  --clone-account <test-token-account>
```

### Continuous Integration
```bash
# In your CI script
stve validator start testing --reset
# Run tests
npm test
# Validator automatically stops when process ends
```

### Performance Testing
```bash
# Benchmark different configurations
node scripts/benchmark.js

# Monitor performance during load testing
stve monitor start --port 3001 &
# Run your load tests
stve monitor metrics --watch
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Solana Labs](https://solana.com/) for the excellent test validator
- [Node.js](https://nodejs.org/) and the npm ecosystem
- The Solana developer community

## 🆘 Support

- Create an [Issue](https://github.com/your-username/solana-test-validator-extension/issues) for bug reports
- Join the discussion in [Discussions](https://github.com/your-username/solana-test-validator-extension/discussions)
- Check the [Troubleshooting Guide](docs/TROUBLESHOOTING.md)

---

**Happy coding!** 🚀

Made with ❤️ for the Solana developer community.