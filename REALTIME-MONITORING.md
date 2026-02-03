# Real-Time Protocol Monitoring Dashboard

## 🚀 Overview

The Solana DevEx Platform now features a comprehensive real-time monitoring system that tracks network health, protocol status, and performance metrics across multiple production RPC providers and DeFi protocols.

## 🎯 Key Features

### Live Network Monitoring
- **Real-time slot tracking** with WebSocket connections
- **Multiple RPC provider support** (Helius, QuickNode, Alchemy, Solana Labs)
- **Network performance metrics** (latency, TPS, block times)
- **Automatic failover** between RPC providers

### Protocol Health Dashboard
- **Jupiter V6** - DEX aggregation and swap monitoring
- **Kamino Finance** - Lending protocol health tracking
- **Drift Protocol** - Perpetuals and derivatives monitoring  
- **Raydium** - AMM and liquidity pool status

### Real-Time Updates
- **WebSocket integration** for live dashboard updates
- **Event-driven notifications** for critical alerts
- **Streaming metrics** with automatic reconnection
- **Rate-limited connections** for scalability

### Production RPC Integration
- **Helius** - Enhanced Solana RPC with advanced features
- **QuickNode** - Enterprise-grade blockchain infrastructure
- **Alchemy** - Web3 development platform
- **Automatic fallback** to Solana Labs public endpoints

### Metrics Collection & Analytics
- **Historical performance data** with configurable retention
- **Alert system** with customizable thresholds
- **Performance dashboards** with interactive charts
- **Export capabilities** for external monitoring

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 Real-Time Dashboard (React)                 │
├─────────────────────────────────────────────────────────────┤
│                 WebSocket Client Layer                     │
├─────────────────────────────────────────────────────────────┤
│                 API Server (Express)                       │
├─────────────────────────────────────────────────────────────┤
│              Real-Time Monitor Engine                      │
├─────────────────────┬───────────────────┬───────────────────┤
│   Network Monitor   │ Protocol Monitor  │  Alert System    │
│                     │                   │                  │
│ • Slot tracking    │ • Program health  │ • Thresholds     │
│ • TPS calculation  │ • Account counts  │ • Notifications  │
│ • Latency metrics  │ • Health endpoints│ • Severity       │
└─────────────────────┴───────────────────┴───────────────────┘
                             │
         ┌───────────────────────────────────────────┐
         │           Production RPC Providers         │
         ├─────────────┬─────────────┬─────────────────┤
         │   Helius    │ QuickNode   │    Alchemy      │
         │             │             │                 │
         │ • Enhanced  │ • Enterprise│ • Web3 Platform│
         │   APIs      │   Grade     │   Features      │
         │ • Advanced  │ • High      │ • Robust APIs   │
         │   Features  │   Performance│ • Developer    │
         │             │             │   Tools         │
         └─────────────┴─────────────┴─────────────────┘
```

## 🔧 Setup & Configuration

### 1. Environment Configuration

Copy the example environment file:
```bash
cp .env.example .env
```

### 2. RPC Provider Setup

Configure your production RPC providers in `.env`:

```bash
# Helius Configuration
HELIUS_API_KEY=your-helius-api-key
HELIUS_MAINNET_URL=https://rpc.helius.xyz/
HELIUS_MAINNET_WS=wss://rpc.helius.xyz/

# QuickNode Configuration  
QUICKNODE_API_KEY=your-quicknode-api-key
QUICKNODE_MAINNET_URL=https://solana-mainnet.quicknode.pro/v1/
QUICKNODE_MAINNET_WS=wss://solana-mainnet.quicknode.pro/v1/

# Alchemy Configuration
ALCHEMY_API_KEY=your-alchemy-api-key
ALCHEMY_MAINNET_URL=https://solana-mainnet.g.alchemy.com/v2/
ALCHEMY_MAINNET_WS=wss://solana-mainnet.g.alchemy.com/v2/

# Network Selection
SOLANA_NETWORK=mainnet
```

### 3. Install Dependencies

```bash
# Frontend dependencies
npm install

# API dependencies
cd api && npm install
```

### 4. Start the Real-Time System

```bash
# Start the real-time monitoring API server
cd api && npm run realtime

# Start the dashboard (separate terminal)
npm run dev
```

## 📊 Dashboard Features

### Network Status Overview
- **Provider Health** - Status of each RPC provider
- **Network Metrics** - Real-time latency, TPS, slot tracking
- **Performance Charts** - Historical trends and analytics
- **Connection Status** - WebSocket connection monitoring

### Protocol Health Monitoring
- **Program Status** - On-chain program availability
- **Account Monitoring** - Critical account tracking
- **Health Endpoints** - API endpoint availability
- **Performance Metrics** - Response times and error rates

### Alert System
- **Real-time Alerts** - Instant notifications for issues
- **Configurable Thresholds** - Custom alert conditions
- **Alert History** - Historical alert tracking
- **Resolution Tracking** - Alert acknowledgment and resolution

### Interactive Charts
- **Latency Trends** - Network performance over time
- **Availability Metrics** - Protocol uptime tracking
- **TPS Monitoring** - Transaction throughput analysis
- **Error Rate Tracking** - System health indicators

## 🔌 API Endpoints

### Health & Status
- `GET /api/health` - System health check
- `GET /api/dashboard/data` - Complete dashboard data
- `GET /api/metrics/public` - Public metrics (rate limited)

### Network Monitoring
- `GET /api/metrics/network` - Network performance data
- `GET /api/metrics/network?provider=helius` - Provider-specific data
- `GET /api/metrics/network?timeframe=1h` - Time-scoped data

### Protocol Monitoring
- `GET /api/metrics/protocols` - All protocol metrics
- `GET /api/metrics/protocols?protocol=jupiter` - Protocol-specific data
- `POST /api/protocols/test` - Run protocol health tests

### Alert Management
- `GET /api/alerts` - Recent alerts
- `POST /api/alerts/:id/resolve` - Mark alert as resolved
- `GET /api/alerts?severity=critical` - Filter by severity

## 📡 WebSocket Events

### Connection Events
- `initial_data` - Complete dashboard state on connect
- `dashboard_update` - Periodic full dashboard updates
- `monitoring_status` - Monitoring system status changes

### Real-time Updates
- `network_metrics` - Live network performance data
- `protocol_metrics` - Protocol health updates
- `slot_update` - Solana slot changes
- `finality_update` - Block finality notifications

### Alerts & Notifications
- `alert` - New alert notifications
- `health_check` - Health endpoint results
- `alert_resolved` - Alert resolution notifications

## ⚙️ Monitoring Configuration

### Network Monitoring
- **Update Interval**: 10 seconds
- **Metrics Tracked**: Latency, TPS, slot height, block time
- **Provider Failover**: Automatic with exponential backoff
- **Data Retention**: 24 hours (configurable)

### Protocol Monitoring
- **Update Interval**: 30 seconds
- **Health Checks**: Program accounts, health endpoints
- **Metrics Tracked**: Availability, error rates, response times
- **Alert Thresholds**: Configurable per protocol

### Alert Configuration
```javascript
// Default Alert Rules
{
  "network-latency-high": {
    "threshold": 2000,    // 2 seconds
    "condition": "gt"     // greater than
  },
  "protocol-availability-low": {
    "threshold": 95,      // 95%
    "condition": "lt"     // less than
  },
  "error-rate-high": {
    "threshold": 5,       // 5%
    "condition": "gt"     // greater than
  }
}
```

## 🚨 Alert System

### Alert Severity Levels
- **Critical** - >50% deviation from threshold
- **Warning** - 20-50% deviation from threshold  
- **Info** - <20% deviation from threshold

### Alert Types
- **Network Alerts** - Latency, TPS, connectivity issues
- **Protocol Alerts** - Program unavailability, high error rates
- **System Alerts** - Monitoring system health issues

### Notification Channels
- **Dashboard** - Real-time dashboard notifications
- **WebSocket** - Instant client notifications
- **Webhook** - External system integration (configurable)
- **Discord/Slack** - Team notifications (optional)

## 📈 Performance Metrics

### Network Metrics
- **Latency**: RPC response times across providers
- **TPS**: Transactions per second calculation
- **Block Time**: Time between block confirmations
- **Slot Tracking**: Real-time slot progression
- **Supply**: Total SOL supply metrics

### Protocol Metrics
- **Availability**: Program accessibility percentage
- **Error Rate**: Failed request percentage
- **Response Time**: API endpoint response times
- **Account Count**: Program account statistics
- **Health Status**: Overall protocol health

## 🔒 Security & Best Practices

### API Security
- **Rate Limiting**: 200 requests per 15 minutes
- **CORS Protection**: Configured origins only
- **Helmet Security**: Security headers enabled
- **Input Validation**: All inputs validated
- **Error Handling**: No sensitive data in responses

### WebSocket Security
- **Connection Limits**: 10 per IP per minute
- **Rate Limiting**: Message rate limiting
- **Auto-reconnection**: Exponential backoff
- **Heartbeat**: Connection health monitoring

### RPC Provider Security
- **API Key Management**: Environment-based configuration
- **Fallback Providers**: Multiple provider support
- **Request Timeouts**: 30-second timeouts
- **Error Handling**: Graceful degradation

## 🛠️ Development

### Local Development
```bash
# Start development mode
npm run dev              # Frontend
npm run realtime:dev     # API with hot reload
```

### Production Deployment
```bash
# Build frontend
npm run build

# Start production API
npm run realtime

# Health check
curl http://localhost:3001/api/health
```

### Testing
```bash
# Run protocol tests
npm run test:protocols

# API health check
npm run health

# Export monitoring data  
npm run monitor
```

## 🔍 Troubleshooting

### Common Issues

**WebSocket Connection Failed**
- Check CORS configuration
- Verify WebSocket URL
- Check network connectivity

**RPC Provider Issues**
- Verify API keys in `.env`
- Check provider rate limits
- Monitor provider status pages

**High Latency Alerts**
- Check network connectivity
- Verify RPC provider performance
- Consider switching providers

**Protocol Health Issues**
- Check program account status
- Verify health endpoint availability
- Monitor protocol status pages

### Debug Commands
```bash
# Check API health
curl http://localhost:3001/api/health

# Test WebSocket connection
wscat -c ws://localhost:3001

# Monitor logs
tail -f api/logs/monitoring.log

# Export current metrics
node -e "const { monitor } = require('./api/real-time-server.js'); console.log(JSON.stringify(monitor.exportData(), null, 2));"
```

## 📚 Additional Resources

- [Solana Web3.js Documentation](https://solana-labs.github.io/solana-web3.js/)
- [Helius RPC Documentation](https://docs.helius.xyz/)
- [QuickNode Solana Guide](https://www.quicknode.com/guides/solana-development/)
- [Alchemy Solana Documentation](https://docs.alchemy.com/solana/)
- [Jupiter API Documentation](https://docs.jup.ag/)
- [Kamino Finance Documentation](https://docs.kamino.finance/)
- [Drift Protocol Documentation](https://docs.drift.trade/)
- [Raydium Documentation](https://docs.raydium.io/)

## 📄 License

MIT License - see LICENSE file for details.

---

**Built for the Solana Colosseum AI Agent Hackathon by onchain-devex Agent #25**