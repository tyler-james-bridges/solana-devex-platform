# Solana DevEx Platform 🚀

Complete development environment and dashboard for Solana applications. Built for the Colosseum Agent Hackathon by **onchain-devex**.

## Vision

As we move toward autonomous agents managing DeFi protocols, development infrastructure needs to be **bulletproof**. When an agent deploys code, there's no human safety net to catch failures.

**Current reality:** Everyone's building trading bots and yield optimizers, but testing them requires deploying to mainnet and hoping for the best.

**What we need:** Development workflows that validate everything before autonomous deployment.

## Features

### 🎛️ All-in-One Dashboard
- **Test Monitor:** Real-time test results across protocols
- **Deploy Pipeline:** CI/CD status and deployment tracking  
- **Protocol Health:** Integration monitoring for Jupiter, Kamino, Drift
- **Transaction Monitor:** Live transaction tracking and analysis
- **Performance Metrics:** Success rates, gas usage, latency

### 🧪 Testing Framework
- **Mock Protocol Environments** - Test Jupiter/Kamino/Drift safely
- **Integration Validation** - Verify protocol calls before deployment
- **Automated Test Suites** - Comprehensive protocol testing
- **Risk Assessment** - Analyze potential failure modes

### 🔄 CI/CD Pipelines
- **Automated Deployment** - From code to mainnet safely
- **Environment Management** - Devnet → Testnet → Mainnet
- **Rollback Capabilities** - Quick recovery from failures
- **Health Checks** - Continuous monitoring post-deployment

### 📊 Real-Time Monitoring
- **Transaction Tracking** - Monitor all on-chain activity
- **Protocol Status** - Health checks across integrations
- **Performance Analytics** - Detailed metrics and insights
- **Alert System** - Proactive failure detection

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Dashboard     │    │   API Server    │    │ Testing Engine  │
│   (Next.js)     │◄──►│   (Node.js)     │◄──►│   (Protocol     │
│                 │    │                 │    │    Mocks)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                ▲
                                │
                     ┌─────────────────┐
                     │ Solana Network  │
                     │ (RPC + Protocols)│
                     └─────────────────┘
```

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start API server (separate terminal)
npm run api

# Open dashboard
open http://localhost:3000
```

## Built For

- **Vibecoding** - Fast feedback loops and visual understanding
- **Agent Engineering** - Validation and safety rails for autonomous deployment  
- **Traditional Engineering** - Proper testing frameworks and debugging tools

## Stack

- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend:** Node.js, Express, TypeScript
- **Solana:** @solana/web3.js, Anchor framework integration
- **Testing:** Custom protocol mocking framework
- **Monitoring:** Real-time WebSocket connections
- **Deployment:** Vercel-ready with API routes

## Agent-Built

This project was built autonomously by the **onchain-devex** AI agent for the Colosseum Agent Hackathon. All code, architecture, and implementation decisions were made by the AI agent without human code contribution, following hackathon rules.

## License

MIT - Built with ❤️ for the Solana ecosystem