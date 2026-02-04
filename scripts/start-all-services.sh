#!/bin/bash
#
# Start All Services - One-command demo environment
# Perfect for judges and partnership demos
#

echo " Starting Solana DevEx Platform - All Services"
echo "=================================================="

# Check if ports are available
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "  Port $1 is already in use. Service may already be running."
        return 1
    fi
    return 0
}

echo ""
echo " Checking available ports..."
check_port 3000 && echo " Port 3000 (Frontend) available"
check_port 3002 && echo " Port 3002 (Health API) available"
check_port 3004 && echo " Port 3004 (Partnership APIs) available"  
check_port 3005 && echo " Port 3005 (Demo Environment) available"

echo ""
echo " Installing dependencies..."
npm ci > /dev/null 2>&1
cd api && npm ci > /dev/null 2>&1
cd ../cli && npm ci > /dev/null 2>&1
cd ..

echo ""
echo "  Building production assets..."
npm run build > /dev/null 2>&1

echo ""
echo " Starting all services..."
echo ""

# Start services in background with proper logging
echo "Starting Frontend Dashboard (Port 3000)..."
npm start > logs/frontend.log 2>&1 &
FRONTEND_PID=$!

echo "Starting Integration APIs (Port 3004)..."  
npm run integrations > logs/integrations.log 2>&1 &
INTEGRATION_PID=$!

echo "Starting Demo Environment (Port 3005)..."
npm run demo > logs/demo.log 2>&1 &
DEMO_PID=$!

echo "Starting Health API (Port 3002)..."
cd api && npm start > ../logs/api.log 2>&1 &
API_PID=$!
cd ..

# Create logs directory if it doesn't exist
mkdir -p logs

# Wait for services to start
echo ""
echo "⏳ Waiting for services to initialize..."
sleep 10

echo ""
echo " Solana DevEx Platform is now running!"
echo "========================================"
echo ""
echo " Frontend Dashboard:    http://localhost:3000"
echo "🔗 Integration APIs:     http://localhost:3004/api/integrations/health"
echo " Demo Environment:      http://localhost:3005/api/demo/status"  
echo " Health Monitoring:     http://localhost:3002/api/health/protocols"
echo ""
echo " JUDGE QUICK ACCESS:"
echo "• Platform Overview:      http://localhost:3000"
echo "• Real-time Dashboard:    http://localhost:3000/dashboard"
echo "• Partnership Status:     http://localhost:3004/api/partnerships/health"
echo "• Demo Teams:             http://localhost:3005/api/demo/teams"
echo "• Protocol Health:        http://localhost:3002/api/health/protocols"
echo ""
echo " INTEGRATION DEMOS:"
echo "• SOLPRISM-Compatible:    curl http://localhost:3004/api/integrations/solprism/status"
echo "• AgentDEX-Compatible:    curl http://localhost:3004/api/integrations/agentdx/status"
echo "• SAID-Compatible:        curl http://localhost:3004/api/integrations/said/status"
echo ""
echo " DEMO SCENARIOS FOR JUDGES:"
echo "• High Load Test:         curl -X POST http://localhost:3005/api/demo/scenario/high-load"
echo "• Security Incident:      curl -X POST http://localhost:3005/api/demo/scenario/security-incident"
echo "• Protocol Issues:        curl -X POST http://localhost:3005/api/demo/scenario/protocol-degradation"
echo ""

# Store PIDs for cleanup
echo "$FRONTEND_PID $INTEGRATION_PID $DEMO_PID $API_PID" > .service_pids

echo " Service PIDs stored in .service_pids"
echo " To stop all services: ./scripts/stop-all-services.sh"
echo ""
echo " Platform ready for demonstration!"