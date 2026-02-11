# Solana DevEx Platform

![Build](https://github.com/tyler-james-bridges/solana-devex-platform/actions/workflows/ci.yml/badge.svg) ![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg) ![Live](https://img.shields.io/badge/Live-onchain--devex.tools-green.svg)

Developer tools for Solana. Live mainnet RPC integration, real transaction analysis, and a published npm SDK.

**Live**: https://onchain-devex.tools  
**Colosseum Hackathon**: Agent #25 Project #46  
**npm**: [`onchain-devex`](https://www.npmjs.com/package/onchain-devex)

## What It Does

Paste any Solana mainnet transaction signature → get real CPI call flows, compute unit analysis, cross-program invocation traces, and error diagnostics. All data from live Solana RPC — nothing mocked.

## What's Live

| Tool | Description |
|------|-------------|
| **CPI Debugger** | Real-time cross-program invocation analysis against mainnet |
| **Transaction Simulator** | Pre-execution risk analysis and safety checks |
| **Verifiable Attestations** | Cryptographic proof of debugging sessions (Ed25519) |
| **Agent Wallet Infrastructure** | Secure key management for AI agent operations |
| **Guardian Security Scanner** | Token risk scoring, honeypot detection, whale tracking |
| **Protocol Monitor** | Health monitoring for Jupiter, Raydium, Drift, Kamino |
| **TypeScript SDK** | `npm install onchain-devex` — programmatic CPI debugging |

## Quick Start

```bash
npm install onchain-devex
```

```typescript
import { parseCPITransaction } from 'onchain-devex';

const result = await parseCPITransaction(
  '5UfDuX...',  // any mainnet tx signature
  'https://api.mainnet-beta.solana.com'
);

console.log(result.cpiCalls);    // cross-program invocations
console.log(result.computeUnits); // compute budget analysis
```

Or use the web interface at [onchain-devex.tools](https://onchain-devex.tools).

## API Endpoints

```
POST /api/debug-transaction    — Parse a mainnet transaction signature
POST /api/security/scan        — Security scan for token contracts
GET  /api/forum-posts          — Colosseum forum integration
```

## Agent Interoperability

The platform exposes a [`skill.json`](https://onchain-devex.tools/skill.json) for agent-to-agent discovery and integration.

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Blockchain**: @solana/web3.js (mainnet RPC)
- **Deployment**: Vercel
- **Package**: Published on npm as `onchain-devex`

## Built By

Human-directed, agent-built over 8 days for the [Colosseum Agent Hackathon](https://colosseum.com/agent-hackathon/projects/solana-devex-platform). Built by Agent #25.

## License

MIT — see [LICENSE](./LICENSE)
