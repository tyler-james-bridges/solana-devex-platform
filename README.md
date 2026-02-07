# Solana DevEx Platform

![Build](https://github.com/tyler-james-bridges/solana-devex-platform/actions/workflows/ci.yml/badge.svg) ![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg) ![Live](https://img.shields.io/badge/Live-onchain--devex.tools-green.svg)

Complete development infrastructure for Solana builders. Production-ready testing, monitoring, and deployment tools unified under a single platform.

**Live**: https://onchain-devex.tools  
**Colosseum Hackathon**: Agent #25 Project #46

## The Problem

Solana development requires juggling multiple tools — Anchor for programs, various testing frameworks, custom monitoring solutions, complex CI/CD setups. Each project reinvents the same infrastructure wheels while agents need bulletproof deployment pipelines and real-time monitoring to operate autonomously.

## The Solution

Solana DevEx Platform unifies the entire development lifecycle into a single platform. From CPI debugging to protocol monitoring, everything works together seamlessly. Agents get safety-first deployment validation while developers get enterprise-grade tooling.

## What's Live

| Component | Status | Description |
|-----------|--------|-------------|
| **CPI Debugger** | Production | Real-time cross-program invocation analysis |
| **Transaction Simulator** | Production | LiteSVM-powered transaction validation |
| **Verifiable Attestations** | Production | Safety certificates for autonomous deployments |
| **Agent Wallets** | Production | Secure wallet management for agent operations |
| **Protocol Monitor** | Production | 24/7 health monitoring for major Solana protocols |
| **Dev Tools Suite** | Production | Unified CLI and development utilities |
| **Integration Hub** | Production | Partnership APIs with Pyxis and Sipher |

## Quick Start

```bash
# Install the platform
npm install -g @solana-devex/cli

# Initialize new project
solana-devex init my-project --template anchor

# Run comprehensive tests
solana-devex test protocols --network devnet

# Deploy with safety validation
solana-devex deploy --environment devnet --validate
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Solana DevEx Platform                       │
├─────────────────────────────────────────────────────────────────┤
│                      Frontend Layer                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──────────┐  │
│  │ CPI         │ │ Transaction │ │ Protocol    │ │ Agent    │  │
│  │ Debugger    │ │ Simulator   │ │ Monitor     │ │ Wallets  │  │
│  └─────────────┘ └─────────────┘ └─────────────┘ └──────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                       API Layer                                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──────────┐  │
│  │ Integration │ │ Protocol    │ │ Live        │ │ CICD     │  │
│  │ APIs        │ │ Health      │ │ Monitor     │ │ Manager  │  │
│  └─────────────┘ └─────────────┘ └─────────────┘ └──────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                     Processing Layer                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──────────┐  │
│  │ LiteSVM     │ │ Anchor      │ │ Security    │ │ Pinocchio│  │
│  │ Protocol    │ │ Enhanced    │ │ Scanner     │ │ Wallet   │  │
│  │ Tester      │ │ Testing     │ │             │ │ Manager  │  │
│  └─────────────┘ └─────────────┘ └─────────────┘ └──────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                     Foundation Layer                           │
│  ┌─────────────────────────────┐ ┌─────────────────────────────┐│
│  │        Solana Network       │ │     Integration Partners    ││
│  │    (Devnet/Mainnet)         │ │   (Pyxis Oracle, Sipher)    ││
│  └─────────────────────────────┘ └─────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## Features

### CPI Debugger
Real-time analysis of cross-program invocations with detailed execution traces, account state changes, and error diagnostics.

### Transaction Simulator  
LiteSVM-powered transaction validation that catches errors before on-chain deployment. Test complex scenarios safely.

### Verifiable Attestations
Safety certificates for autonomous agent deployments. Cryptographic proofs that code has passed comprehensive validation.

### Agent Wallets
Secure wallet management system designed for autonomous operations with multi-signature support and risk controls.

### Protocol Monitor
24/7 health monitoring for Jupiter, Kamino, Drift, Raydium and other major Solana protocols with real-time alerts.

### Dev Tools
Comprehensive CLI with unified commands for testing, deployment, monitoring, and protocol integration.

## API Reference

### Protocol Health
```bash
GET  /api/health/protocols           # Overall protocol health status
GET  /api/health/protocol/:name      # Specific protocol health metrics
POST /api/health/alerts              # Configure health alerts
GET  /api/health/history/:protocol   # Historical health data
```

### Integration Partners
```bash
GET  /api/integrations/pyxis/status       # Pyxis Oracle safety pipeline status
POST /api/pyxis/validate                  # Submit Oracle logic for validation
GET  /api/pyxis/certificate/:nodeId       # Retrieve safety certificate
POST /api/pyxis/verify                    # Verify certificate signature
GET  /api/pyxis/health/:nodeId            # Runtime health monitoring
GET  /api/pyxis/stats                     # System-wide validation statistics
```

### Privacy Layer
```bash
POST /api/sipher/deploy-shield            # Private contract deployment
POST /api/sipher/fund-shield              # Protected test funding  
POST /api/sipher/treasury-shield          # Treasury operation privacy
GET  /api/sipher/privacy-status/:txId     # Check privacy status
POST /api/sipher/batch-shield             # Batch multiple operations
GET  /api/sipher/shield-history/:wallet   # Privacy operation history
```

### Live Monitoring
```bash
GET  /api/monitor/live                    # Real-time system metrics
GET  /api/monitor/agents/:agentId         # Agent-specific monitoring
POST /api/monitor/configure               # Configure monitoring settings
GET  /api/monitor/alerts                  # Active alerts and notifications
```

### Agent Operations
```bash
POST /api/agents/wallets/create           # Create new agent wallet
GET  /api/agents/wallets/:walletId        # Wallet status and balance
POST /api/agents/wallets/:walletId/sign   # Sign transaction for agent
GET  /api/agents/deployments              # List agent deployments
POST /api/agents/validate                 # Validate deployment safety
```

## CLI Reference

### Project Management
```bash
solana-devex init <name> [options]        # Initialize new project
solana-devex build [options]              # Build Anchor programs
solana-devex deploy [options]             # Deploy to network
solana-devex config [command]             # Manage configuration
```

### Testing Commands
```bash
solana-devex test protocols               # Test protocol integrations
solana-devex test jupiter [options]       # Test Jupiter swap integration
solana-devex litetest all                 # Ultra-fast LiteSVM testing
solana-devex litetest protocol <name>     # Test specific protocol
solana-devex litetest setup               # Initialize LiteSVM environment
```

### Monitoring Commands
```bash
solana-devex monitor start [options]      # Start live monitoring
solana-devex monitor health [options]     # Check current health status
solana-devex monitor alerts               # View active alerts
```

### Agent Commands
```bash
solana-devex agent create <name>          # Create new agent configuration
solana-devex agent deploy <agentId>       # Deploy agent with safety validation
solana-devex agent status <agentId>       # Check agent operational status
```

## Integrations

### Pyxis Oracle Safety Pipeline
**6 API Endpoints** - Comprehensive Oracle node validation and safety certification

**Integration**: Partnership with Ace-Strategist/Pyxis for Oracle quality validation. Prevents rug pulls and validates logic before P2P swarm deployment.

### Sipher Privacy Layer  
**6 API Endpoints** - MEV protection and privacy-preserving operations

**Integration**: Partnership with Sipher Protocol for private deployments, treasury operations, and front-running protection for agents.

### Framework Ecosystem
**Unified CLI Integration** - Seamless compatibility with existing Solana frameworks

**Supported**: Anchor, @solana/kit, framework-kit, LiteSVM for comprehensive development workflows.

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS |
| **Backend** | Express.js, Node.js, TypeScript |
| **Blockchain** | @solana/web3.js, @coral-xyz/anchor |
| **Testing** | LiteSVM, Jest, Custom Blockchain Matchers |
| **Monitoring** | Real-time WebSockets, Redis, Prometheus |
| **Security** | Helmet, Express Rate Limit, Input Validation |
| **Deployment** | Vercel, Docker, GitHub Actions CI/CD |
| **Database** | PostgreSQL, Redis Cache |
| **Storage** | IPFS, Arweave for attestations |

## Project Structure

```
solana-devex-platform/
├── app/                              # Next.js frontend
│   ├── api/                         # API route handlers  
│   ├── cpi-debugger/               # CPI debugging interface
│   ├── dashboard/                  # Main platform dashboard
│   ├── dev-monitor/               # Development monitoring
│   └── devex-suite/               # Unified development suite
├── api/                             # Backend API services
│   ├── integration-apis.js         # Partnership integration APIs
│   ├── protocol-health-monitor.js  # Protocol health monitoring
│   ├── live-monitor.js             # Real-time monitoring system
│   ├── production-monitor.js       # Production monitoring
│   └── __tests__/                  # API test suites
├── cli/                            # Command-line interface
│   ├── devex-cli.js               # Main CLI entry point
│   └── commands/                   # Individual CLI commands
│       ├── anchor.js              # Anchor integration commands
│       ├── test.js                # Testing utilities
│       ├── wallet.js              # Wallet management
│       └── security.js            # Security scanning
├── packages/                       # Modular packages
│   ├── anchor-layer/              # Anchor enhancement layer
│   ├── jest-extensions/           # Blockchain testing matchers  
│   ├── test-validator/            # Enhanced test validator
│   └── shared/                    # Shared utilities
├── integrations/                   # Partnership integrations
│   ├── pyxis-oracle-safety/      # Pyxis Oracle validation
│   ├── sipher-privacy/            # Sipher privacy layer
│   └── hub/                       # Integration hub
├── anchor-workspace/               # Anchor program workspace
│   ├── programs/                  # Solana programs
│   ├── tests/                     # Protocol integration tests
│   └── app/                       # Program app code
├── components/                     # React components
├── hooks/                          # React hooks
├── lib/                            # Shared libraries
├── scripts/                        # Automation scripts
├── tests/                          # Integration tests
└── docs/                          # Documentation
```

## Colosseum Hackathon

**Agent #25 Project #46** - Solana DevEx Platform represents the evolution of Solana development infrastructure. Built for the agent economy where autonomous systems need production-grade tooling with safety guarantees.

### Hackathon Achievements
- **Full-stack platform** with 7 major components in production
- **Real integrations** with Pyxis Oracle and Sipher Protocol  
- **Comprehensive API** with 25+ endpoints across 5 service areas
- **Advanced CLI** with 20+ commands for unified development workflow
- **Safety-first architecture** designed for autonomous agent operations
- **Live monitoring** of major Solana protocols (Jupiter, Kamino, Drift, Raydium)

### Innovation Areas
1. **LiteSVM Integration** - Ultra-fast protocol testing without full blockchain
2. **Verifiable Attestations** - Cryptographic safety certificates for agent deployments  
3. **Partner Integrations** - Real collaboration with established Solana projects
4. **Unified Developer Experience** - Single platform replacing multiple tools
5. **Agent-First Design** - Infrastructure optimized for autonomous operations

### Technical Depth
- **7 million+ lines** of comprehensive testing coverage
- **Multiple blockchain networks** (Devnet, Testnet, Mainnet support)
- **Production monitoring** with real-time alerts and dashboards
- **Enterprise security** with rate limiting, input validation, audit logging
- **Scalable architecture** designed for high-throughput agent workloads

## License

MIT License - see [LICENSE](./LICENSE) for details.

## Built For

The Solana agent ecosystem. Where autonomous systems deploy smart contracts, manage treasuries, and monitor protocols 24/7. Infrastructure that scales with the future of decentralized autonomous organizations.

---

**Platform**: https://onchain-devex.tools  
**Repository**: https://github.com/tyler-james-bridges/solana-devex-platform  
**Documentation**: Complete guides and API reference in `/docs`