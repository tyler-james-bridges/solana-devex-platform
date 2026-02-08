# Solana DevEx Platform

![Build](https://github.com/tyler-james-bridges/solana-devex-platform/actions/workflows/ci.yml/badge.svg) ![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg) ![npm](https://img.shields.io/npm/v/onchain-devex.svg) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg) ![Live](https://img.shields.io/badge/Live-onchain--devex.tools-green.svg)

Developer tools for Solana. CPI debugging, transaction safety analysis, security scanning, and agent wallet management in one platform.

**Live**: [onchain-devex.tools](https://onchain-devex.tools)
**Hackathon**: [Colosseum Agent Hackathon](https://colosseum.com/agent-hackathon/projects/solana-devex-platform) - Agent #25, Project #46

## Tools

### CPI Debugger
Cross-program invocation analysis using live Solana mainnet RPC. Paste a transaction signature and get execution traces, account state changes, program invocations, and error diagnostics. Includes real mainnet examples from Jupiter, Raydium, Marinade, Metaplex, and Drift.

### Transaction Safety Simulator
Pre-execution transaction analysis. Detects risks, estimates compute units and fees, checks for unsafe token approvals, and flags suspicious program interactions before you sign.

### Verifiable Debugging Attestations
Cryptographic proof of debugging findings. SHA-256 hashing with Ed25519 signatures creates tamper-proof records of what was found, when, and by whom. Structured for IPFS storage and on-chain anchoring.

### Agent Wallet Infrastructure
Wallet management for AI agents. Encrypted key storage, granular permission controls (per-operation limits, daily caps, program invoke restrictions), and configurable security levels.

### Guardian Security Scanner
Token risk analysis powered by Guardian's agent swarm. Honeypot detection, whale tracking, liquidity analysis, and threat intelligence for Solana tokens and programs.

## API Routes

```
POST /api/debug-transaction    Fetch and parse a Solana transaction by signature (live mainnet RPC)
GET  /api/security/scan        Token security analysis and threat detection
POST /api/security/scan        Submit token address for risk scoring
```

## SDK

`onchain-devex` - TypeScript client for programmatic access to all platform tools. Located in `packages/sdk/`.

```typescript
import { SolanaDevExClient } from 'onchain-devex';

const client = new SolanaDevExClient({ baseUrl: 'https://onchain-devex.tools' });
const result = await client.debugTransaction('your-tx-signature');
```

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Blockchain**: @solana/web3.js (mainnet RPC)
- **Security**: Guardian integration for token analysis
- **Deployment**: Vercel
- **CI**: GitHub Actions

## Project Structure

```
solana-devex-platform/
├── app/
│   ├── api/
│   │   ├── debug-transaction/    Live Solana RPC transaction parsing
│   │   └── security/scan/        Guardian security scanning
│   ├── cpi-debugger/             CPI debugging interface
│   ├── devex-suite/              Tool suite (simulator, attestations, wallets, scanner)
│   └── provenance/               Build provenance and git history
├── components/
│   ├── AgentWalletManager.tsx    Wallet creation and management
│   ├── SecurityScanner.tsx       Token risk analysis UI
│   ├── TransactionSimulator.tsx  Pre-execution safety checks
│   ├── VerifiableDebugger.tsx    Attestation generation
│   ├── ForumFeed.tsx             Hackathon forum posts
│   ├── Navigation.tsx            Site navigation
│   ├── Footer.tsx                Site footer
│   └── ThemeToggle.tsx           Dark/light mode
├── hooks/
│   └── useTheme.tsx              Theme provider
├── integrations/
│   └── guardian/                 Guardian security client
├── lib/
│   └── solana-rpc.ts             Solana mainnet RPC client
├── packages/
│   ├── sdk/                      onchain-devex TypeScript package
│   └── cli/                      Command-line tools
└── public/
    └── skill.json                Agent interoperability spec
```

## Development

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # Production build
```

Requires a `.env` file with `SOLANA_RPC_URL` for mainnet RPC access.

## How It Was Built

This platform was built by an AI agent (onchain-devex, Agent #25) over 8 days during the Colosseum Agent Hackathon. Human-directed, agent-built. Full development provenance is available at [/provenance](https://onchain-devex.tools/provenance).

## License

MIT - see [LICENSE](./LICENSE)

---

[onchain-devex.tools](https://onchain-devex.tools) | [GitHub](https://github.com/tyler-james-bridges/solana-devex-platform) | [Colosseum](https://colosseum.com/agent-hackathon/projects/solana-devex-platform) | [@onchain_devex](https://twitter.com/onchain_devex)
