#!/bin/bash

# Real-Time Solana Network Monitoring Startup Script
# This script starts the real-time monitoring server with REAL Solana network data

echo "🚀 Starting Real-Time Solana Network Monitoring..."
echo "📊 This will fetch REAL data from Solana mainnet"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "📝 Creating .env file with real network configuration..."
    cp .env.example .env
fi

# Display configuration
echo "🔧 Configuration:"
echo "   • Network: MAINNET"
echo "   • RPC Providers: Helius, QuickNode, Alchemy, Solana Labs"
echo "   • Protocols: Jupiter, Kamino, Drift, Raydium"
echo "   • AgentDEX Monitoring: 13 endpoints"
echo "   • API Port: 3001"
echo "   • WebSocket: Real-time updates"
echo ""

# Check if API dependencies are installed
echo "📦 Installing API dependencies..."
cd api
npm install
cd ..

echo ""
echo "🌐 Starting real-time monitoring server..."
echo "   • Dashboard API: http://localhost:3001/api/dashboard/data"
echo "   • Health Check: http://localhost:3001/api/health"
echo "   • WebSocket: ws://localhost:3001"
echo ""

# Start the simplified real data server
cd api
echo "🔥 Starting REAL Solana network monitoring server..."
echo "📊 This uses 100% REAL mainnet data - no mocks, no simulations!"
node simple-real-server.js

# This script will:
# 1. Connect to real Solana mainnet RPC endpoints
# 2. Monitor real slot numbers, block heights, TPS
# 3. Check real Jupiter/Kamino/Drift/Raydium protocol health
# 4. Measure actual latency to protocol endpoints
# 5. Provide live WebSocket data feeds
# 6. Monitor @JacobsClawd AgentDEX endpoints in real-time