# Code Quality Checks & PR Automation

This document describes the comprehensive code quality and automation system implemented for the Solana DevEx Platform.

## 🏗️ Overview

Our CI/CD pipeline ensures high code quality, security, and automated workflows through:

- **Code Quality Checks**: TypeScript, ESLint, Prettier, security auditing
- **Automated Testing**: Unit tests, integration tests, coverage reporting
- **Security Scanning**: Dependency audits, SAST analysis, Solana-specific checks
- **Performance Monitoring**: Lighthouse CI, bundle size tracking
- **Automated PR Management**: Auto-formatting, labeling, merging

## 🔧 Quality Checks

### Frontend (Next.js/TypeScript)
- **TypeScript**: Strict type checking with `tsc --noEmit`
- **ESLint**: Code quality and security rules
- **Prettier**: Consistent code formatting
- **Bundle Analysis**: Size monitoring and optimization
- **Performance**: Lighthouse CI for web vitals

### API Backend (Node.js)
- **ESLint**: Code quality with security plugins
- **Jest**: Unit testing with coverage reporting
- **Security**: Dependency auditing and vulnerability scanning
- **Integration Tests**: API endpoint testing

### CLI Tools
- **ESLint**: Code quality and security
- **Security**: Input validation and safe execution
- **Functionality**: Command testing and validation

### Rust/Anchor Programs (Future)
- **Clippy**: Rust linter for code quality
- **Rustfmt**: Code formatting
- **Cargo Audit**: Security vulnerability scanning
- **Anchor Build**: Program compilation and IDL generation
- **Security Patterns**: Solana-specific security checks

## 🚀 GitHub Actions Workflows

### 1. CI/CD Pipeline (`.github/workflows/ci-cd.yml`)

**Triggers**: Push to main/develop, Pull requests

**Jobs**:
- **Code Quality**: TypeScript, ESLint, Prettier checks
- **Security Scan**: CodeQL analysis, dependency audits
- **Testing**: Unit tests with coverage reporting
- **Build Verification**: Production build validation
- **Performance**: Lighthouse CI for web vitals
- **Deployment Readiness**: Bundle size and environment checks
- **Auto-format**: Automatic code formatting on PRs

### 2. Security Audit (`.github/workflows/security-audit.yml`)

**Triggers**: Daily schedule, Push/PR to main/develop

**Jobs**:
- **Dependency Scanning**: Snyk vulnerability analysis
- **SAST Analysis**: Static application security testing
- **Solana Security**: Custom security checks for blockchain code
- **Container Security**: Trivy scanning for Docker images
- **License Compliance**: Legal compliance checking

### 3. PR Automation (`.github/workflows/pr-automation.yml`)

**Triggers**: PR events, Reviews, Check suite completion

**Jobs**:
- **PR Analysis**: Size labeling, breaking change detection
- **Auto-assignment**: Code owner-based reviewer assignment
- **Dependency Updates**: Auto-approval for minor updates
- **Auto-merge**: Intelligent merging based on checks and approvals
- **Quality Gates**: Coverage and performance thresholds

### 4. Rust Programs (`.github/workflows/rust-programs.yml`)

**Triggers**: Changes to programs/, Anchor.toml, Cargo files

**Jobs**:
- **Rust Quality**: Clippy linting, formatting checks
- **Security Audit**: Cargo audit, vulnerability patterns
- **Anchor Build**: Program compilation and testing
- **Documentation**: Auto-generated program docs

## 🛠️ Configuration Files

### Code Quality
- **`.eslintrc.js`**: Main ESLint configuration
- **`api/.eslintrc.js`**: API-specific linting rules
- **`cli/.eslintrc.js`**: CLI-specific linting rules
- **`.prettierrc.js`**: Code formatting configuration
- **`.prettierignore`**: Prettier exclusions

### Testing
- **`api/jest.config.js`**: Jest testing configuration
- **`api/jest.setup.js`**: Test environment setup

### Performance
- **`lighthouserc.js`**: Lighthouse CI configuration
- **`.bundlesizerc.json`**: Bundle size monitoring

### Git Hooks
- **`.husky/pre-commit`**: Pre-commit quality checks
- **`.lintstagedrc.js`**: Staged files processing

### GitHub
- **`.github/CODEOWNERS`**: Automatic reviewer assignment
- **`.github/pull_request_template.md`**: PR template with checklist
- **`.github/ISSUE_TEMPLATE/`**: Issue templates for bugs, features, security

## 📊 Quality Gates

### Required Checks for PRs
1. **TypeScript**: No type errors
2. **ESLint**: No linting errors, max warnings: 0
3. **Prettier**: Consistent formatting
4. **Tests**: All tests pass
5. **Coverage**: Minimum 70% code coverage
6. **Security**: No high/critical vulnerabilities
7. **Build**: Successful production build

### Performance Thresholds
- **First Contentful Paint**: < 2s
- **Largest Contentful Paint**: < 4s
- **Cumulative Layout Shift**: < 0.1
- **Total Blocking Time**: < 300ms
- **Bundle Size**: Monitored and capped per chunk

### Security Requirements
- **Dependency Audit**: No moderate+ vulnerabilities
- **CodeQL**: No security issues
- **Sensitive Data**: No hardcoded secrets
- **Access Control**: Proper authentication/authorization

## 🔄 Auto-merge System

PRs are automatically merged when:

1. **Required Checks**: All CI checks pass ✅
2. **Approvals**: At least 1 approval from code owners ✅
3. **Labels**: Contains `auto-merge` label ✅
4. **No Conflicts**: Mergeable state ✅
5. **Not Draft**: Ready for review ✅

### Auto-merge Triggers
- Dependency updates (patch/minor versions)
- Documentation updates
- Code formatting changes
- PRs explicitly labeled for auto-merge

## 🚨 Security Features

### Solana-Specific Security
- **Private Key Detection**: Scan for hardcoded private keys
- **RPC Endpoint Validation**: Check for secure endpoint usage
- **Transaction Security**: Validate transaction handling patterns
- **Access Control**: Verify program authority patterns

### General Security
- **Dependency Scanning**: Daily Snyk scans
- **SAST Analysis**: CodeQL static analysis
- **Container Security**: Trivy vulnerability scanning
- **License Compliance**: Legal compliance monitoring

## 📝 Pre-commit Hooks

Automatically run on each commit:
1. **Lint Staged Files**: ESLint + Prettier on changed files
2. **Type Checking**: TypeScript compilation check
3. **Security Scan**: Check for sensitive data patterns
4. **Test Related**: Run tests for changed files

## 🎯 Getting Started

### Setup Development Environment
```bash
# Install dependencies and setup hooks
npm run setup
npm run prepare  # Setup Husky hooks

# Run quality checks locally
npm run quality:check   # Full quality check
npm run quality:fix     # Auto-fix issues
npm run lint           # Run linting
npm run format         # Format code
npm run type-check     # TypeScript check
npm run test           # Run tests
```

### Adding Quality Checks
1. **New ESLint Rules**: Add to appropriate `.eslintrc.js`
2. **Security Patterns**: Add to security workflow
3. **Performance Budgets**: Update `lighthouserc.js`
4. **Test Coverage**: Adjust thresholds in Jest config

### Creating Auto-merge PRs
1. Add `auto-merge` label to PR
2. Ensure all checks pass
3. Get required approvals
4. System will auto-merge when ready

## 🔍 Monitoring and Alerts

### Performance Monitoring
- **Lighthouse CI**: Tracks web vitals over time
- **Bundle Size**: Monitors JavaScript bundle growth
- **Build Times**: CI/CD performance tracking

### Security Monitoring
- **Daily Scans**: Automated dependency audits
- **Real-time**: PR-based security checks
- **Compliance**: License and legal compliance

### Quality Metrics
- **Coverage**: Test coverage tracking
- **Linting**: Code quality metrics
- **Type Safety**: TypeScript strictness

## 🛡️ Best Practices

### For Developers
1. **Pre-commit**: Always run local checks before pushing
2. **Small PRs**: Keep changes focused and reviewable
3. **Tests**: Write tests for new functionality
4. **Documentation**: Update docs for new features

### For Reviewers
1. **Security**: Focus on security implications
2. **Performance**: Consider performance impact
3. **Maintainability**: Evaluate long-term maintainability
4. **Testing**: Ensure adequate test coverage

### For Solana Development
1. **Security First**: Always consider attack vectors
2. **Gas Optimization**: Optimize for transaction costs
3. **Error Handling**: Proper error propagation
4. **Access Controls**: Implement proper authorization

## 📈 Continuous Improvement

The quality system is continuously evolving:

- **Regular Reviews**: Weekly assessment of quality metrics
- **Tool Updates**: Monthly dependency and tool updates
- **Process Refinement**: Quarterly process improvements
- **Community Feedback**: Ongoing developer experience improvements

## 🆘 Troubleshooting

### Common Issues
- **ESLint Errors**: Run `npm run lint:fix` for auto-fixable issues
- **Type Errors**: Check TypeScript configuration and dependencies
- **Test Failures**: Run tests locally with `npm test`
- **Security Alerts**: Review and address dependency vulnerabilities

### Getting Help
- Check documentation in `docs/`
- Create issue using appropriate template
- Join Discord community for real-time support
- Contact security team for security concerns

---

This quality system ensures high standards, security, and developer productivity while maintaining automation and efficiency. All developers are expected to follow these guidelines and contribute to continuous improvement.