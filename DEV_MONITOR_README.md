# 🚀 Real-Time Solana Development Monitoring Dashboard

A comprehensive, real-time monitoring solution for Solana development workflows. Monitor test validators, track deployments, watch account states, and analyze transaction flows in real-time.

![Dev Monitor Dashboard](https://img.shields.io/badge/status-production--ready-green) ![Real-time](https://img.shields.io/badge/real--time-WebSocket-blue) ![Integrations](https://img.shields.io/badge/integrations-anchor%20|%20solana--cli-orange)

## 🎯 What It Monitors

### 🔧 Test Validator Performance
- **Real-time metrics**: Slot progression, block height, TPS
- **Resource monitoring**: CPU, memory, disk usage
- **Health checks**: RPC latency, uptime tracking
- **Error detection**: Automatic error and warning capture

### ⚓ Anchor Projects
- **Build status**: Real-time build monitoring with success/failure tracking
- **Test results**: Automatic test execution and result parsing
- **Deployment tracking**: Multi-network deployment status with transaction signatures
- **Program monitoring**: IDL changes, binary sizes, upgrade authorities

### 💰 Account & Transaction Monitoring
- **Watch accounts**: Real-time balance and state changes
- **Transaction tracking**: Live transaction monitoring with compute unit analysis
- **Program interactions**: Instruction parsing and call analysis
- **State changes**: Historical change tracking with timestamps

### 📊 Developer-Focused Metrics
- **RPC performance**: Endpoint latency and success rates
- **System resources**: Development environment monitoring
- **Build performance**: Compile times and optimization insights
- **Network health**: Connection status and throughput

## 🚀 Quick Start

### Installation
```bash
# Install dependencies
npm install

# Setup development monitoring for your project
npm run dev:monitor:setup

# Start the monitoring dashboard
npm run dev:monitor
```

### Using the CLI
```bash
# Start all monitoring services
node scripts/dev-monitor.js start

# Stop all services
node scripts/dev-monitor.js stop

# Check service status
node scripts/dev-monitor.js status

# Setup project monitoring
node scripts/dev-monitor.js setup --project-path ./my-anchor-project
```

## 🖥️ Dashboard Features

### Main Dashboard
- **Live metrics overview**: System health at a glance
- **Real-time charts**: Performance trends and historical data
- **Alert center**: Automated issue detection and notifications
- **Service controls**: Start/stop validator and services

### Test Validator Panel
- **Process control**: Start, stop, restart validator with custom configuration
- **Performance metrics**: Real-time TPS, latency, and resource usage
- **Slot monitoring**: Live slot progression with block time analysis
- **Log analysis**: Error detection and performance warnings

### Anchor Projects Manager
- **Project discovery**: Automatic detection of Anchor projects
- **Build automation**: One-click builds with progress tracking
- **Deploy management**: Multi-network deployment with status tracking
- **Test execution**: Automated test running with detailed results

### Account Monitor
- **Account tracking**: Add accounts to watch for changes
- **Balance monitoring**: Real-time SOL and token balance updates  
- **State analysis**: Data size changes and ownership tracking
- **Transaction correlation**: Link changes to specific transactions

### Transaction Tracker
- **Live transactions**: Real-time transaction monitoring
- **Program analysis**: Instruction parsing and program identification
- **Performance metrics**: Compute unit usage and fee analysis
- **Log inspection**: Detailed transaction logs and error analysis

## 🔌 Integration Points

### Solana CLI Integration
```bash
# Automatically detects current network configuration
solana config get
```

### Anchor Integration
```toml
# Reads Anchor.toml for project configuration
[programs.localnet]
my_program = "PROGRAM_ID_HERE_1111111111111111111111111111"
```

### File Watching
- Monitors program source files for changes
- Triggers rebuild notifications on file modifications
- Tracks test file changes and suggests re-runs

### WebSocket Real-Time Updates
- Live data streaming at 2-second intervals
- Automatic reconnection on connection loss
- Efficient data diffing to minimize bandwidth

## ⚙️ Configuration

### Config File: `dev-monitor.config.json`
```json
{
  "dashboard": {
    "port": 3000,
    "autoOpen": true
  },
  "validator": {
    "port": 8899,
    "autoStart": true,
    "resetOnStart": true
  },
  "monitoring": {
    "watchPaths": ["./programs", "./tests"],
    "alertThresholds": {
      "memoryUsage": 80,
      "cpuUsage": 90,
      "blockTime": 1000
    }
  }
}
```

### Environment Variables
```bash
MONITOR_PORT=3000          # Dashboard port
API_PORT=3006             # API server port  
WS_PORT=3007              # WebSocket port
VALIDATOR_PORT=8899       # Test validator RPC port
SOLANA_RPC_URL=...        # Custom RPC endpoint
```

## 🎯 Use Cases

### Development Workflow
1. **Start monitoring**: `npm run dev:monitor`
2. **Write code**: Edit Anchor programs or tests
3. **Auto-build**: File changes trigger build notifications
4. **Deploy & test**: One-click deployment to test networks
5. **Monitor**: Watch transactions and account changes in real-time

### Debugging & Optimization
- **Performance profiling**: Identify slow transactions and high compute usage
- **Error tracking**: Real-time error detection and alerting
- **Resource monitoring**: Prevent test validator crashes from resource exhaustion
- **Network analysis**: RPC latency and success rate monitoring

### Team Collaboration
- **Shared monitoring**: Multiple developers can view the same dashboard
- **Deployment coordination**: Track who deployed what and when
- **Environment status**: Shared visibility into test validator health
- **Performance baselines**: Historical data for performance comparisons

## 📡 API Endpoints

### Validator Control
```bash
POST /api/validator/control
{
  "action": "start|stop|restart"
}
```

### Project Management
```bash
POST /api/anchor/build
{
  "project": "my-project"
}

POST /api/anchor/deploy  
{
  "project": "my-project",
  "network": "localnet"
}
```

### Account Monitoring
```bash
POST /api/dev/watch-account
{
  "address": "...",
  "name": "My Account",
  "type": "program|user|token"
}
```

### Real-time Data
```bash
GET /api/dev/metrics
# Returns current development metrics

WebSocket: ws://localhost:3007
# Real-time updates stream
```

## 🔧 Advanced Configuration

### Custom Validator Setup
```javascript
// Custom validator configuration
const validatorOptions = {
  cloneAccounts: [
    'TOKEN_PROGRAM_ID_HERE_1111111111111111111111', // Token Program
    'METAPLEX_PROGRAM_ID_HERE_1111111111111111111'  // Metaplex
  ],
  programs: [
    { id: 'MyProg111111111111111111111111111111111', path: './target/deploy/my_program.so' }
  ]
};
```

### Alert Configuration
```javascript
// Custom alerting thresholds
const alertConfig = {
  validator: {
    maxMemoryUsage: 85,      // Alert at 85% memory
    maxCpuUsage: 95,         // Alert at 95% CPU
    maxBlockTime: 800,       // Alert if block time > 800ms
    minTps: 1000            // Alert if TPS < 1000
  },
  rpc: {
    maxLatency: 100,        // Alert if RPC latency > 100ms
    minSuccessRate: 98      // Alert if success rate < 98%
  }
};
```

## 🚨 Troubleshooting

### Common Issues

**Validator won't start**
```bash
# Check if port is already in use
lsof -ti:8899

# Clean ledger and restart
rm -rf test-ledger
npm run dev:monitor
```

**WebSocket connection failed**
```bash
# Dashboard falls back to polling mode automatically
# Check if port 3007 is available
netstat -an | grep 3007
```

**Build failures**
```bash
# Verify Anchor installation
anchor --version

# Check project structure
ls -la programs/
cat Anchor.toml
```

**Memory issues**
```bash
# Monitor system resources
htop

# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
```

### Performance Optimization

**Dashboard performance**
- Adjust refresh intervals in settings
- Limit historical data retention
- Disable unused monitoring features

**Validator performance**
- Increase `--limit-ledger-size` if running long tests
- Use `--reset` flag to clean state between runs
- Monitor disk space in test-ledger directory

## 🤝 Contributing

### Development Setup
```bash
git clone <repository>
cd solana-devex-platform
npm install
npm run dev:monitor:setup
npm run dev
```

### Adding New Monitors
1. Create monitor class in `integrations/`
2. Add WebSocket event handlers in `api/dev-monitor-server.js`
3. Update dashboard components in `components/DevMonitorDashboard.tsx`
4. Add configuration options to default config

### Testing
```bash
npm run test
npm run lint
npm run type-check
```

## 📊 Metrics & Analytics

The dashboard tracks and visualizes:
- **Build times** and success rates over time
- **Deployment frequency** across different networks
- **Test execution times** and failure patterns
- **Validator performance** trends and optimization opportunities
- **Resource utilization** patterns for capacity planning

## 🔐 Security Notes

- Dashboard runs on localhost by default
- No sensitive data is logged or transmitted
- WebSocket connections are authenticated
- Configuration files should not contain private keys
- Test validator ledger data is ephemeral

---

**Built for the Solana developer community** 🌟

*Part of the Solana DevEx Platform - empowering the next generation of Web3 development.*