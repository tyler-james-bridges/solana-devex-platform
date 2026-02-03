#!/bin/bash

# Script to commit and create PR for quality automation implementation

set -e

echo "🚀 Committing Code Quality Checks & PR Automation Implementation..."

# Navigate to project directory
cd "$(dirname "$0")"

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Not in a git repository. Please run this from the project root."
    exit 1
fi

# Create a new branch for the quality automation features
BRANCH_NAME="feature/quality-checks-pr-automation"
echo "📝 Creating branch: $BRANCH_NAME"

# Switch to a clean branch
git checkout main || git checkout master || { echo "❌ Could not checkout main/master branch"; exit 1; }
git pull origin $(git branch --show-current) || echo "⚠️  Could not pull latest changes"
git checkout -b "$BRANCH_NAME" || git checkout "$BRANCH_NAME"

# Add all the new files
echo "📦 Adding quality automation files..."

# GitHub Actions workflows
git add .github/workflows/
git add .github/CODEOWNERS
git add .github/pull_request_template.md
git add .github/ISSUE_TEMPLATE/

# Configuration files
git add .eslintrc.js
git add api/.eslintrc.js
git add cli/.eslintrc.js
git add .prettierrc.js
git add .prettierignore
git add .lintstagedrc.js
git add .bundlesizerc.json
git add lighthouserc.js

# Testing configuration
git add api/jest.config.js
git add api/jest.setup.js

# Git hooks
git add .husky/
git add .husky/pre-commit

# Documentation
git add QUALITY-AUTOMATION.md

# Updated package.json files
git add package.json
git add api/package.json

# This script itself
git add commit-quality-automation.sh

# Check what we're committing
echo "📊 Files to be committed:"
git diff --cached --name-only

# Commit with descriptive message
echo "💾 Committing changes..."
git commit -m "🔧 Implement comprehensive code quality checks & PR automation

✨ Features:
- GitHub Actions CI/CD pipelines for all quality checks
- TypeScript type checking and ESLint security rules
- Automated security scanning (Snyk, CodeQL, dependency audits)
- Performance monitoring (Lighthouse CI, bundle size tracking)
- Automated PR workflow (labeling, auto-merge, formatting)
- Rust/Anchor program validation pipeline (ready for future use)
- Pre-commit hooks with lint-staged for incremental checks

🔒 Security:
- Solana-specific security pattern detection
- Private key and sensitive data scanning
- Dependency vulnerability monitoring
- SAST analysis with CodeQL
- Container security scanning

🚀 Automation:
- Auto-formatting on PRs with Prettier
- Smart PR labeling (size, breaking changes)
- Automated dependency update approval
- Intelligent auto-merge based on checks and approvals
- Code owner-based reviewer assignment

📊 Quality Gates:
- 70% minimum test coverage requirement
- Performance budgets for web vitals
- Zero-warning policy for linting
- Security vulnerability prevention
- Bundle size monitoring and limits

🛠️ Configuration:
- Comprehensive ESLint configs for all components
- Jest testing setup with security mocks
- Prettier formatting with project-specific rules
- Husky pre-commit hooks for quality enforcement
- GitHub issue/PR templates for consistency

📚 Documentation:
- Complete quality automation guide
- Best practices for developers and reviewers
- Troubleshooting and continuous improvement guidelines

This implementation provides enterprise-grade code quality enforcement
while maintaining developer productivity through automation."

echo "✅ Changes committed successfully!"

# Push the branch
echo "📤 Pushing branch to remote..."
git push origin "$BRANCH_NAME" || {
    echo "⚠️  Could not push to remote. You may need to push manually:"
    echo "   git push origin $BRANCH_NAME"
}

# Instructions for creating PR
echo ""
echo "🎉 Quality automation implementation complete!"
echo ""
echo "📋 Next steps:"
echo "1. Create a Pull Request from branch '$BRANCH_NAME'"
echo "2. Add the 'auto-merge' label if you want it auto-merged"
echo "3. The new CI/CD pipeline will automatically validate the changes"
echo "4. Once approved, the PR can be auto-merged or merged manually"
echo ""
echo "🔗 PR Title Suggestion:"
echo "   🔧 Implement Code Quality Checks & PR Automation"
echo ""
echo "📝 PR Description highlights:"
echo "   - Comprehensive CI/CD pipeline with quality gates"
echo "   - Automated security scanning and vulnerability detection"
echo "   - Smart PR automation with auto-merge capabilities"
echo "   - Solana-specific security and performance checks"
echo "   - Developer experience improvements with pre-commit hooks"
echo ""
echo "🚀 Ready to create your PR and let automation take over!"