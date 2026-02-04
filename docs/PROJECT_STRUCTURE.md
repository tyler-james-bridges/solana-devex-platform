# Project Structure

This document outlines the organized structure of the Solana DevEx Platform codebase.

## Directory Organization

### Root Level (Essential Files Only)
```
├── package.json              # Main dependencies and scripts  
├── next.config.js             # Next.js configuration
├── tailwind.config.js         # Tailwind CSS configuration
├── tsconfig.json             # TypeScript configuration
├── postcss.config.js         # PostCSS configuration
├── README.md                 # Project documentation
├── SECURITY.md               # Security guidelines
├── .env files                # Environment configuration
├── .nvmrc                    # Node.js version specification
├── .gitignore               # Git ignore rules
├── .prettierignore          # Prettier ignore rules
└── next-env.d.ts            # Next.js type definitions
```

### Core Application Directories
```
├── app/                     # Next.js App Router pages
├── components/              # React components  
├── lib/                     # Shared utilities and helpers
├── public/                  # Static assets
├── api/                     # API routes and backend logic
├── cli/                     # Command-line interface tools
└── anchor-workspace/        # Solana/Anchor programs
```

### Organized Tool Directories  
```
├── scripts/                 # Automation and setup scripts
├── tests/                   # Test files and load testing
├── config/                  # Configuration files (.eslintrc, etc.)
├── tooling/                 # Development tooling configuration
├── templates/               # Code generation templates
├── integrations/           # Integration examples and configs
└── docs/                   # Project documentation
```

### Generated/Tool Directories
```
├── .github/                # GitHub workflows and templates
├── .next/                  # Next.js build output (ignored)
├── .vercel/                # Vercel deployment config  
├── .husky/                 # Git hooks
└── node_modules/           # Dependencies (ignored)
```

## Benefits of This Structure

✅ **Clean Root Directory**: Only essential configuration files in root  
✅ **Logical Grouping**: Related files organized together  
✅ **Easy Navigation**: Clear separation between code, tests, and tools  
✅ **Professional Appearance**: Standard Next.js project structure  
✅ **Scalable**: Easy to add new features without clutter

## Script Locations

All automation scripts are now in `scripts/` directory:
- `setup.sh` - Basic project setup
- `quick-start-cicd.sh` - CI/CD pipeline setup  
- `setup-production.sh` - Production deployment
- `start-dashboard.sh` - Development dashboard
- And more...

## Test Organization

All tests are in `tests/` directory:
- `test-agentdex-integration.js` - AgentDEX integration tests
- `test-real-data.js` - Real Solana data tests  
- `production-load-test.js` - Load testing
- And more...

This structure follows Next.js best practices and enterprise standards for clean, maintainable codebases.