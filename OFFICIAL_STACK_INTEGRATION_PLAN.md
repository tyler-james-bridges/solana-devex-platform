# Official Solana Stack Integration Plan

## 🎯 Mission: Transform Platform into "The DevEx layer that makes the official Solana stack easy to use"

### Current State Analysis
- Platform uses web3.js v1.95.0 + Anchor v0.30.0 (legacy stack)
- Jest extensions built for web3.js patterns
- CLI follows foundry-style patterns but uses old SDK
- No framework-kit or @solana/kit integration
- Missing official testing tools (LiteSVM, Mollusk, Surfpool)

### Target State: Official Stack Compliance
Position as: **"Official Solana Stack Made Easy"** - The essential tooling layer that handles complexity, toolchain integration, and workflow automation for the framework-kit + @solana/kit ecosystem.

---

## 🔧 Integration Points

### 1. CLI Stack Migration (CRITICAL)

#### Current Dependencies → Official Stack
```diff
- "@solana/web3.js": "^1.95.0"           → Keep as legacy fallback
- "@coral-xyz/anchor": "^0.30.0"          → Keep for Anchor workflows
+ "@solana/client": "latest"              → Primary UI client
+ "@solana/react-hooks": "latest"         → React integration
+ "@solana/kit": "latest"                 → Primary SDK for all operations
+ "@solana/web3-compat": "latest"         → Legacy adapters only
```

#### New CLI Command Structure
```
solana-devex
├── init                 # Framework-kit + @solana/kit project scaffolding
├── kit                  # @solana/kit operations (RPC, transactions, etc.)
│   ├── rpc              # RPC management with kit patterns
│   ├── transaction      # Transaction building with kit
│   └── client           # Client generation with Codama
├── test                 # Official testing stack
│   ├── unit             # LiteSVM + Mollusk unit tests
│   ├── integration      # Surfpool integration tests
│   └── legacy           # solana-test-validator fallback
├── anchor               # Anchor-first development
├── pinocchio            # Performance-optimized programs
├── wallet               # Wallet-standard-first connection
├── security             # Automated security checklist
└── compat               # web3.js compatibility layer
```

### 2. Testing Stack Overhaul

#### Jest Extensions Enhancement
- **LiteSVM Integration**: In-process unit testing with fast feedback
- **Mollusk Support**: Advanced unit testing patterns
- **Surfpool Integration**: Local integration tests against realistic state
- **Legacy Fallback**: Keep solana-test-validator for RPC-specific tests

#### New Testing Templates
```
templates/
├── unit-tests/
│   ├── litesvm-basic/         # Basic LiteSVM setup
│   ├── mollusk-advanced/      # Mollusk testing patterns
│   └── kit-transaction/       # @solana/kit transaction tests
├── integration-tests/
│   ├── surfpool-mainnet/      # Mainnet state integration
│   └── surfpool-devnet/       # Devnet integration
└── wallet-tests/
    ├── standard-connection/   # Wallet-standard tests
    └── hook-mocking/         # React hook testing
```

### 3. Project Templates (Official Stack)

#### Framework-Kit + Kit Templates
```
templates/official-stack/
├── react-nextjs-kit/         # @solana/client + react-hooks
├── vanilla-kit/              # Pure @solana/kit for scripts/backends
├── anchor-kit/               # Anchor + kit integration
├── pinocchio-kit/            # High-performance programs
└── wallet-standard/          # Wallet-standard connection examples
```

#### Codama Integration
- Automated client generation workflows
- IDL-to-TypeScript with official patterns
- Progressive disclosure documentation

### 4. Security Automation

#### Automated Checklist Implementation
- Pre-commit hooks for security patterns
- Risk analysis for signing/fees/CPIs/token transfers
- Audit-style review automation
- Token program variant detection (SPL vs Token-2022)

---

## 📦 Package Restructuring

### New Monorepo Structure
```
solana-devex-platform/
├── packages/
│   ├── kit-extensions/           # @solana/kit utilities
│   ├── framework-integrations/   # Framework-kit helpers
│   ├── testing-stack/           # LiteSVM/Mollusk/Surfpool
│   ├── security-tools/          # Automated security
│   ├── wallet-standard/         # Wallet connection patterns
│   ├── legacy-compat/           # web3.js compatibility
│   └── cli-unified/             # Unified CLI
├── templates/
│   ├── official-stack/          # Framework-kit templates
│   ├── testing/                 # Test templates
│   └── security/                # Security-first templates
└── docs/
    ├── official-stack/          # Official stack docs
    ├── migration/               # Legacy migration guides
    └── progressive/             # Progressive disclosure
```

---

## 🚀 Implementation Phases

### Phase 1: Dependencies & Core Infrastructure (Week 1)
1. **Update package.json** with official stack dependencies
2. **Create compatibility layer** for web3.js boundaries
3. **Implement @solana/kit** as primary SDK
4. **Add framework-kit** for UI patterns

### Phase 2: Testing Stack Integration (Week 1-2)
1. **LiteSVM setup** in Jest extensions
2. **Mollusk integration** for advanced testing
3. **Surfpool configuration** for integration tests
4. **Update test templates** with official patterns

### Phase 3: CLI Transformation (Week 2)
1. **Unified CLI restructure** following official stack
2. **Command routing** to appropriate packages
3. **Kit-first workflows** for all operations
4. **Security automation** integration

### Phase 4: Templates & Documentation (Week 2-3)
1. **Official stack project templates**
2. **Wallet-standard connection examples**
3. **Progressive disclosure documentation**
4. **Migration guides** from legacy stack

### Phase 5: Security & Polish (Week 3)
1. **Automated security checklist**
2. **Risk analysis tooling**
3. **End-to-end testing**
4. **Production readiness**

---

## 🎯 Success Metrics

### Developer Experience Goals
- **Single command setup**: `npx solana-devex init` creates official stack project
- **Zero configuration testing**: LiteSVM/Mollusk work out-of-box
- **Automated security**: Security checklist runs automatically
- **Progressive disclosure**: Developers see complexity only when needed

### Platform Positioning
- **"Official Solana Stack Made Easy"** messaging
- **Essential tooling layer** for framework-kit + @solana/kit
- **Complexity abstraction** while maintaining power
- **Workflow automation** for official patterns

### Technical Targets
- All new projects use @solana/kit + framework-kit by default
- Legacy web3.js contained to compatibility boundaries
- LiteSVM/Mollusk become default testing patterns
- Wallet-standard-first connection everywhere

---

## 🔄 Migration Strategy

### For Existing Projects
1. **Compatibility mode**: Keep web3.js projects working
2. **Gradual migration**: Provide migration tools and guides  
3. **Side-by-side**: Run both stacks during transition
4. **Clear upgrade path**: Step-by-step official stack adoption

### For New Projects
1. **Official stack default**: All new templates use framework-kit + kit
2. **Legacy opt-in**: web3.js available only by explicit choice
3. **Security-first**: Automated security checks from start
4. **Best practices**: Official patterns enforced by default

This transformation positions the platform as the essential DevEx layer that makes the official Solana stack accessible to all developers, handling the complexity while maintaining the power and flexibility of the official tools.