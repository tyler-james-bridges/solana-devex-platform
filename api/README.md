# 🔍 Solana Protocol Health Monitor

**Production-grade protocol health monitoring for Jupiter, Kamino, Drift, and Raydium that other hackathon projects can actually use.**

## 🎯 Mission

Top 5 hackathon projects analysis shows **NO projects monitor protocol health** despite depending on these protocols. This fills that gap with real monitoring infrastructure that CloddsBot, SuperRouter, Makora, and other developers can immediately use.

## ✨ Features

- **Real API Health Checks**: Jupiter V6 quote/swap endpoints, Kamino lending vaults, Drift perpetual markets, Raydium liquidity pools
- **Live Latency/Uptime Tracking**: Real-time monitoring with configurable alert thresholds
- **Public API Endpoints**: RESTful API that any project can integrate with
- **WebSocket Real-time Updates**: Live protocol health updates for dashboards
- **Visual Health Dashboard**: Beautiful real-time dashboard showing protocol status
- **Production-Ready**: Rate limiting, error handling, caching, monitoring controls

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd api
npm install
```

### 2. Environment Setup

Create `.env` file:

```bash
# Optional: Custom RPC endpoint (defaults to mainnet)
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_WS_URL=wss://api.mainnet-beta.solana.com

# Optional: API key for protected endpoints
API_KEY=your-secret-key

# Optional: Custom port
HEALTH_API_PORT=3002
```

### 3. Start the Health Monitor

```bash
npm start
```

The API will be available at `http://localhost:3002`

### 4. View the Dashboard

Open `dashboard.html` in your browser or run:

```bash
npm run dashboard
```

## 📊 API Endpoints

Base URL: `http://localhost:3002/api`

### Quick Health Checks

```bash
# Overall system status - perfect for status pages
GET /api/status

# Check if specific protocol is healthy
GET /api/protocols/jupiter/status
GET /api/protocols/kamino/status
GET /api/protocols/drift/status
GET /api/protocols/raydium/status
```

### Detailed Monitoring

```bash
# All protocol health data
GET /api/protocols

# Specific protocol detailed metrics
GET /api/protocols/{protocol}

# Active alerts across all protocols
GET /api/alerts

# Performance metrics for dashboards
GET /api/metrics
```

### Real-time Updates

```bash
# WebSocket connection for live updates
ws://localhost:3002/ws
```

### Monitoring Controls

```bash
# Start/stop monitoring
POST /api/monitoring/start
POST /api/monitoring/stop
```

## 🔧 Integration Examples

### CloddsBot (Trading Bot)

```javascript
const { SimpleProtocolMonitor } = require('./examples/simple-monitor');

class CloddsBot {
  constructor() {
    this.monitor = new SimpleProtocolMonitor();
  }

  async executeSwap(inputToken, outputToken, amount) {
    // Check protocol health before swap
    const bestDex = await this.monitor.getBestProtocolFor('swap', ['jupiter', 'raydium']);
    
    if (!bestDex) {
      throw new Error('No healthy DEX available for swapping');
    }

    console.log(`Using ${bestDex} for swap (healthiest option)`);
    // Your swap logic here...
  }
}
```

### SuperRouter (Multi-protocol Router)

```javascript
const monitor = new SimpleProtocolMonitor();

// Check if Jupiter is healthy before routing through it
const jupiterHealthy = await monitor.isProtocolHealthy('jupiter');

if (jupiterHealthy) {
  // Route through Jupiter
} else {
  // Use fallback DEX or show error to user
}
```

### Makora (Portfolio Management)

```javascript
const monitor = new SimpleProtocolMonitor();

// Monitor protocols continuously for portfolio operations
const monitoringInterval = await monitor.startContinuousMonitoring((data) => {
  if (data.status === 'alert') {
    console.log('🚨 Protocol issues detected:', data.alerts);
    // Pause portfolio operations or switch protocols
  }
});
```

## 📈 Protocol-Specific Monitoring

### Jupiter V6
- Quote API endpoint health (`/v6/quote`)
- Swap API endpoint health (`/v6/swap`)
- Price API endpoint health (`/v6/price`)
- On-chain program account validation
- Response time and error rate tracking

### Kamino Finance
- Markets API endpoint health
- Strategies API endpoint health
- Lending vault on-chain health
- Protocol-specific error detection

### Drift Protocol  
- Stats API endpoint health
- Markets API endpoint health
- Perpetual market on-chain validation
- PnL calculation responsiveness

### Raydium
- Pools API endpoint health
- Price API endpoint health
- Liquidity pool on-chain validation
- AMM responsiveness metrics

## 🚨 Alert System

The monitor tracks multiple health metrics and generates alerts when thresholds are exceeded:

- **Response Time**: Warning > 2s, Critical > 5s
- **Uptime**: Warning < 95%, Critical < 90%
- **Error Rate**: Warning > 5%, Critical > 10%
- **Endpoint Failures**: Real-time API endpoint monitoring

Alerts are available via:
- REST API (`/api/alerts`)
- WebSocket real-time notifications
- Dashboard visual indicators

## 🧪 Testing

### Run Full Test Suite

```bash
npm run test:protocols
```

This tests all endpoints, protocol monitoring, error handling, and performance.

### Run Simple Monitoring Examples

```bash
npm run monitor
```

This demonstrates integration examples for CloddsBot, SuperRouter, and Makora.

### Manual Testing

```bash
# Check if the API is running
curl http://localhost:3002/api/health

# Get overall status
curl http://localhost:3002/api/status

# Check Jupiter health
curl http://localhost:3002/api/protocols/jupiter/status
```

## 🔌 WebSocket Integration

Connect to real-time updates:

```javascript
const ws = new WebSocket('ws://localhost:3002/ws');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'protocol_update') {
    console.log(`${data.data.protocol} status: ${data.data.status}`);
  } else if (data.type === 'alert') {
    console.log('🚨 New alert:', data.data.alerts);
  }
};

// Subscribe to specific protocol updates
ws.send(JSON.stringify({
  type: 'subscribe',
  protocol: 'jupiter'
}));
```

## 📊 Dashboard Features

The included HTML dashboard provides:

- **Real-time Protocol Status**: Visual health indicators for all protocols
- **Response Time Tracking**: Live latency metrics and trends
- **Uptime Monitoring**: Protocol availability percentages
- **Active Alerts**: Critical and warning alerts with timestamps
- **Endpoint Health**: Individual API endpoint status
- **Live Updates**: WebSocket-powered real-time data

## 🔒 Security Features

- **Rate Limiting**: 60 requests/minute per IP for normal endpoints
- **Resource Protection**: Aggressive limiting for expensive operations
- **Input Validation**: All parameters validated with express-validator
- **Error Handling**: Graceful error responses without information leakage
- **CORS Configuration**: Configurable cross-origin access
- **Optional API Key**: Authentication for sensitive operations

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Your Project  │───▶│  Health Monitor  │───▶│   Protocols     │
│                 │    │      API         │    │                 │
│  CloddsBot      │    │                  │    │ • Jupiter V6    │
│  SuperRouter    │    │ • REST Endpoints │    │ • Kamino        │
│  Makora         │    │ • WebSocket      │    │ • Drift         │
│  Others...      │    │ • Dashboard      │    │ • Raydium       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Components

1. **ProtocolHealthMonitor** (`protocol-health-monitor.js`): Core monitoring engine
2. **Health API Server** (`health-api-server.js`): REST API and WebSocket server
3. **Dashboard** (`dashboard.html`): Real-time visual monitoring interface
4. **Integration Examples** (`examples/`): Ready-to-use integration code

## 🛠️ Customization

### Adding New Protocols

Add to `protocols` object in `ProtocolHealthMonitor`:

```javascript
myprotocol: {
  name: 'My Protocol',
  endpoints: {
    api: 'https://api.myprotocol.com/health',
    data: 'https://api.myprotocol.com/data'
  },
  programId: 'YourProgramId...',
  // Protocol-specific test data
}
```

### Adjusting Alert Thresholds

Modify `alertThresholds` in constructor:

```javascript
this.alertThresholds = {
  responseTime: { warning: 1000, critical: 3000 },
  uptime: { warning: 98, critical: 95 },
  errorRate: { warning: 3, critical: 8 }
};
```

### Custom Monitoring Intervals

```javascript
const monitor = new ProtocolHealthMonitor({
  monitoringInterval: 15000  // 15 seconds instead of 30
});
```

## 📝 API Response Examples

### Protocol Status

```json
{
  "protocol": "jupiter",
  "status": "healthy",
  "uptime": 99.2,
  "response_time": 150,
  "last_check": "2024-02-03T17:14:39.000Z",
  "alerts": 0
}
```

### Overall Status

```json
{
  "overall_status": "healthy",
  "protocols": {
    "jupiter": { "status": "healthy", "uptime": 99.2 },
    "kamino": { "status": "healthy", "uptime": 98.5 },
    "drift": { "status": "degraded", "uptime": 94.1 },
    "raydium": { "status": "healthy", "uptime": 97.8 }
  },
  "summary": { "healthy": 3, "degraded": 1, "down": 0, "total": 4 }
}
```

### Active Alert

```json
{
  "total_alerts": 1,
  "critical": 0,
  "warning": 1,
  "alerts": [{
    "protocol": "drift",
    "type": "warning",
    "category": "response_time",
    "message": "Elevated response time: 2150ms",
    "threshold": 2000,
    "value": 2150,
    "timestamp": "2024-02-03T17:14:39.000Z"
  }]
}
```

## 🤝 Contributing

This project is designed for hackathon use. Feel free to:

1. Fork and modify for your needs
2. Add new protocol integrations
3. Improve monitoring accuracy
4. Enhance the dashboard
5. Submit issues and improvements

## 📄 License

MIT License - Use freely in your hackathon projects!

## 💡 Use Cases for Hackathon Projects

### Trading Bots
- Check DEX health before executing trades
- Switch between protocols based on performance
- Monitor slippage and liquidity issues

### Portfolio Management
- Validate lending protocol health before deposits
- Monitor yield farming opportunities
- Track protocol performance over time

### Multi-Protocol Routers
- Route through healthiest available protocols
- Fallback mechanisms when protocols are down
- Real-time protocol performance comparison

### DeFi Dashboards
- Display protocol health status to users
- Show historical uptime and performance
- Alert users about protocol issues

### Infrastructure Projects
- Monitor dependencies for reliability
- Set up alerts for protocol outages
- Track ecosystem health metrics

---

## 🚀 Ready to Use!

This monitoring system is production-ready and designed specifically for hackathon projects that need reliable protocol health monitoring. Start monitoring Jupiter, Kamino, Drift, and Raydium today!

**Get started:**
1. `npm install && npm start`
2. Open `dashboard.html` in your browser
3. Integrate with your project using the examples
4. Build something amazing! 🎯