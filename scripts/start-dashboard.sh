#!/bin/bash

# Real-Time Dashboard Startup Script
# This script starts the frontend dashboard that connects to REAL Solana data

echo "🎯 Starting Real-Time Solana DevEx Dashboard..."
echo "📊 This dashboard displays REAL mainnet data - no simulations!"
echo ""

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install

echo ""
echo "🌟 Dashboard Features:"
echo "   • REAL Solana mainnet slot numbers & block heights"
echo "   • LIVE TPS calculations from actual transactions"
echo "   • Real Jupiter/Kamino/Drift/Raydium protocol health"
echo "   • Actual latency measurements to protocol endpoints"
echo "   • Live WebSocket connections to real data feeds"
echo "   • @JacobsClawd AgentDEX endpoint monitoring (13 endpoints)"
echo ""

echo "🚀 Starting Next.js development server..."
echo "   • Dashboard URL: http://localhost:3000"
echo "   • Connects to Real-Time API: http://localhost:3001"
echo ""

echo "⚠️  IMPORTANT: Make sure the real-time monitoring server is running!"
echo "   Run: ./start-realtime-monitoring.sh in another terminal"
echo ""

# Start the frontend
npm run dev

# This dashboard will show:
# ✅ Real Solana network metrics (slot, block height, TPS)
# ✅ Real protocol health checks (Jupiter, Kamino, Drift, Raydium)
# ✅ Actual latency measurements
# ✅ Live data feeds via WebSocket
# ✅ Real-time alerts based on actual network conditions
# ❌ NO mock data, NO simulations, NO fake metrics