#!/bin/bash

# Solana Protocol Health Monitor Startup Script
# Quick setup and testing for hackathon projects

set -e

echo "🔍 Solana Protocol Health Monitor"
echo "================================="
echo "Setting up production-grade protocol monitoring..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${YELLOW}⚠️  Node.js version $NODE_VERSION detected. Recommended: 18+${NC}"
fi

echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm install

echo ""
echo -e "${BLUE}🔧 Setting up environment...${NC}"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    cat > .env << EOF
# Solana Protocol Health Monitor Configuration
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_WS_URL=wss://api.mainnet-beta.solana.com
HEALTH_API_PORT=3002

# Optional: API key for protected endpoints
# API_KEY=your-secret-key

# Optional: CORS configuration
# CORS_ORIGIN=http://localhost:3000
EOF
    echo -e "${GREEN}✅ Created .env configuration file${NC}"
else
    echo -e "${GREEN}✅ Using existing .env configuration${NC}"
fi

echo ""
echo -e "${BLUE}🚀 Starting Protocol Health Monitor...${NC}"
echo ""

# Start the monitoring server in background
node health-api-server.js &
SERVER_PID=$!

# Give the server time to start
sleep 3

# Check if server started successfully
if ps -p $SERVER_PID > /dev/null; then
    echo -e "${GREEN}✅ Health Monitor API is running on port 3002${NC}"
    echo ""
    
    # Run tests to verify everything is working
    echo -e "${BLUE}🧪 Running health checks...${NC}"
    sleep 2
    
    # Basic connectivity test
    if curl -f -s http://localhost:3002/api/health > /dev/null; then
        echo -e "${GREEN}✅ API health check passed${NC}"
    else
        echo -e "${RED}❌ API health check failed${NC}"
        kill $SERVER_PID 2>/dev/null || true
        exit 1
    fi
    
    # Run comprehensive tests
    echo -e "${BLUE}🔍 Running comprehensive protocol tests...${NC}"
    node examples/test-all-protocols.js
    
    TEST_EXIT_CODE=$?
    
    if [ $TEST_EXIT_CODE -eq 0 ]; then
        echo ""
        echo -e "${GREEN}🎉 All tests passed! Protocol monitoring is working correctly.${NC}"
        echo ""
        echo -e "${YELLOW}🌟 READY FOR HACKATHON PROJECTS! 🌟${NC}"
        echo ""
        echo "📊 Dashboard: Open dashboard.html in your browser"
        echo "🔌 API Base URL: http://localhost:3002/api"
        echo "📡 WebSocket: ws://localhost:3002/ws"
        echo ""
        echo "🔧 Quick API Examples:"
        echo "   curl http://localhost:3002/api/status"
        echo "   curl http://localhost:3002/api/protocols/jupiter/status"
        echo "   curl http://localhost:3002/api/alerts"
        echo ""
        echo "💻 Integration Examples:"
        echo "   node examples/simple-monitor.js"
        echo ""
        echo "📝 Documentation: See README.md for full API docs"
        echo ""
        
        # Optionally open dashboard
        if command -v open &> /dev/null; then
            read -p "🌐 Open dashboard in browser? [y/N]: " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                open dashboard.html
            fi
        elif command -v xdg-open &> /dev/null; then
            read -p "🌐 Open dashboard in browser? [y/N]: " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                xdg-open dashboard.html
            fi
        fi
        
        echo ""
        echo -e "${BLUE}💡 Integration Tips:${NC}"
        echo "   • CloddsBot: Check protocol health before trades"
        echo "   • SuperRouter: Route through healthiest protocols"  
        echo "   • Makora: Monitor dependencies for portfolio ops"
        echo "   • Any Project: Use /api/status for health checks"
        echo ""
        echo -e "${GREEN}🔄 Monitoring is running... Press Ctrl+C to stop${NC}"
        echo ""
        
        # Keep the process running
        wait $SERVER_PID
        
    else
        echo ""
        echo -e "${RED}❌ Some tests failed. Please check the configuration.${NC}"
        kill $SERVER_PID 2>/dev/null || true
        exit 1
    fi
    
else
    echo -e "${RED}❌ Failed to start health monitor server${NC}"
    exit 1
fi

# Cleanup function
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Shutting down monitoring...${NC}"
    kill $SERVER_PID 2>/dev/null || true
    echo -e "${GREEN}✅ Monitoring stopped${NC}"
    echo ""
    echo -e "${BLUE}Thanks for using Solana Protocol Health Monitor!${NC}"
    echo -e "${BLUE}Perfect for hackathon projects monitoring Jupiter, Kamino, Drift & Raydium${NC}"
}

# Set up cleanup on script exit
trap cleanup EXIT INT TERM