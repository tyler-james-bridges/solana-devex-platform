#!/bin/bash

# Commit script for Solana Development Monitoring Dashboard
echo "🚀 Committing Solana Development Monitoring Dashboard..."

# Add all new files
git add .

# Create comprehensive commit message
git commit -m "🚀 Add Real-Time Solana Development Monitoring Dashboard

✨ Features Added:
- Real-time test validator monitoring with performance metrics
- Anchor project management with build/deploy automation  
- Live account state monitoring and transaction tracking
- WebSocket-powered real-time updates
- Developer-focused metrics and alerting system

🔧 Integration Points:
- solana-test-validator process control and monitoring
- Anchor CLI integration for builds and deployments
- Real-time RPC monitoring with latency tracking
- File system watching for auto-rebuild notifications
- Git integration for project version tracking

🖥️ Dashboard Components:
- DevMonitorDashboard.tsx - Main monitoring interface
- Navigation.tsx - Updated navigation with dev monitor
- dev-monitor-server.js - WebSocket server with real integrations
- solana-tooling.js - Integration utilities for Solana tools
- dev-monitor.js - CLI for easy setup and management

📊 Monitoring Capabilities:
- Test validator: CPU, memory, TPS, slot progression
- Anchor projects: Build status, test results, deployments
- Accounts: Balance changes, state monitoring, transaction correlation
- Transactions: Real-time tracking with compute unit analysis
- System: Resource usage and performance optimization

🚨 Alert System:
- Memory/CPU threshold monitoring
- Build failure notifications  
- RPC latency and availability alerts
- Test validator crash detection

💻 Developer Experience:
- One-click test validator control
- Auto-discovery of Anchor projects
- Real-time file change notifications
- Multi-network deployment tracking
- Historical performance analytics

🔌 CLI Tools:
- npm run dev:monitor - Start complete monitoring setup
- scripts/dev-monitor.js - Full CLI with setup, status, control
- Automatic project setup and configuration
- Integration with existing Solana tooling

This dashboard fills the gap that existing Web3 tools don't provide - 
real-time development workflow monitoring specifically designed for 
Solana developers working with test validators, Anchor projects, and 
local development environments."

echo "✅ Development Monitoring Dashboard committed successfully!"
echo ""
echo "🎯 Quick Start:"
echo "  npm install"
echo "  npm run dev:monitor:setup"  
echo "  npm run dev:monitor"
echo ""
echo "📖 See DEV_MONITOR_README.md for complete documentation"