#!/bin/bash

# 🚀 Quick Start CI/CD Integration System
# Sets up the complete real CI/CD monitoring system in under 5 minutes

set -e

echo "🚀 Starting Solana DevEx Platform CI/CD Integration System..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the solana-devex-platform directory"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ $NODE_VERSION -lt 16 ]; then
    print_error "Node.js version 16 or higher required. Current version: $(node -v)"
    exit 1
fi

print_success "Node.js version $(node -v) detected"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing main dependencies..."
    npm install
fi

# Install API dependencies
if [ ! -d "api/node_modules" ]; then
    print_status "Installing API dependencies..."
    cd api
    npm install
    cd ..
fi

# Make scripts executable
chmod +x scripts/start-cicd-system.js
chmod +x integrations/project-cicd-setup.js
chmod +x webhooks/standalone-webhook.js

print_success "Dependencies installed and scripts made executable"

# Create environment files if they don't exist
if [ ! -f ".env.cicd" ]; then
    print_status "Creating default environment configuration..."
    cat > .env.cicd << EOF
# CI/CD Integration Configuration
# Edit these values for your setup

# GitHub Integration (Required for webhook management)
GITHUB_TOKEN=
GITHUB_WEBHOOK_SECRET=$(openssl rand -hex 32)

# Deployment Platform APIs (Optional - add as needed)
VERCEL_TOKEN=
RAILWAY_TOKEN=
HEROKU_TOKEN=

# Server Configuration
CICD_PORT=3001
PUBLIC_URL=http://localhost:3001
DASHBOARD_URL=http://localhost:3000

# Notifications (Optional)
DISCORD_WEBHOOK_URL=
SLACK_WEBHOOK_URL=

# Auto-generated
NODE_ENV=development
EOF
    print_warning "Created .env.cicd - Please edit with your API tokens"
else
    print_status "Using existing .env.cicd configuration"
fi

# Create directories
mkdir -p logs
mkdir -p temp/builds

print_success "Directory structure created"

# Function to start CI/CD system
start_cicd_system() {
    print_status "Starting CI/CD Integration System..."
    
    # Start the CI/CD server in the background
    print_status "Starting CI/CD API server on port 3001..."
    cd api
    nohup node real-cicd-integration.js > ../logs/cicd-server.log 2>&1 &
    CICD_PID=$!
    cd ..
    
    # Give server time to start
    sleep 3
    
    # Check if server started successfully
    if curl -s http://localhost:3001/api/health > /dev/null; then
        print_success "CI/CD API server started successfully (PID: $CICD_PID)"
    else
        print_error "Failed to start CI/CD server. Check logs/cicd-server.log"
        return 1
    fi
    
    # Start the dashboard in development mode
    print_status "Starting dashboard on port 3000..."
    nohup npm run dev > logs/dashboard.log 2>&1 &
    DASHBOARD_PID=$!
    
    # Give dashboard time to start
    sleep 5
    
    # Check if dashboard started
    if curl -s http://localhost:3000 > /dev/null; then
        print_success "Dashboard started successfully (PID: $DASHBOARD_PID)"
    else
        print_warning "Dashboard may still be starting. Check logs/dashboard.log"
    fi
    
    # Save PIDs for cleanup
    echo $CICD_PID > .cicd-server.pid
    echo $DASHBOARD_PID > .dashboard.pid
    
    return 0
}

# Function to display usage information
show_usage() {
    echo ""
    print_success "🎉 CI/CD Integration System is ready!"
    echo ""
    echo "📋 Available Commands:"
    echo ""
    echo "🚀 Start System:"
    echo "   npm run cicd:start          # Interactive setup"
    echo "   npm run cicd:server         # Start API server only"
    echo "   npm run cicd:dashboard      # Start dashboard only"
    echo "   npm run cicd:all            # Start both (requires concurrently)"
    echo ""
    echo "🔧 Project Integration:"
    echo "   npm run cicd:setup-project /path/to/your/project"
    echo "   npm run makora:setup        # Setup Makora specifically"
    echo "   npm run solprism:setup      # Setup SOLPRISM specifically"
    echo ""
    echo "🌐 Webhook Handler:"
    echo "   npm run cicd:webhook        # Start standalone webhook"
    echo ""
    echo "📊 Access Points:"
    echo "   Dashboard:    http://localhost:3000"
    echo "   API:          http://localhost:3001/api"
    echo "   Health:       http://localhost:3001/api/health"
    echo "   WebSocket:    ws://localhost:3001/ws/cicd"
    echo ""
    echo "📁 Important Files:"
    echo "   .env.cicd                   # Configuration"
    echo "   logs/                       # Log files"
    echo "   CICD_INTEGRATION_README.md  # Full documentation"
    echo ""
    echo "🔧 Next Steps:"
    echo "1. Edit .env.cicd with your GitHub token and other APIs"
    echo "2. Start the system: npm run cicd:start"
    echo "3. Integrate your projects: npm run cicd:setup-project /path/to/project"
    echo "4. Add webhook URLs to your GitHub repositories"
    echo ""
    echo "📚 Documentation:"
    echo "   cat CICD_INTEGRATION_README.md  # Full integration guide"
    echo ""
}

# Parse command line arguments
case "${1:-help}" in
    "start")
        start_cicd_system
        ;;
    "setup")
        print_status "Running interactive CI/CD setup..."
        node scripts/start-cicd-system.js
        ;;
    "demo")
        print_status "Starting CI/CD system in demo mode..."
        start_cicd_system
        if [ $? -eq 0 ]; then
            echo ""
            print_success "Demo system started!"
            print_status "Visit http://localhost:3000 to see the dashboard"
            print_status "Visit http://localhost:3001/api/health to check API status"
            echo ""
            print_warning "Press Ctrl+C to stop the demo"
            
            # Keep script running and handle cleanup on exit
            trap 'echo ""; print_status "Stopping demo..."; kill $(cat .cicd-server.pid) $(cat .dashboard.pid) 2>/dev/null; rm -f .cicd-server.pid .dashboard.pid; print_success "Demo stopped"' INT
            
            while true; do
                sleep 1
            done
        fi
        ;;
    "stop")
        print_status "Stopping CI/CD system..."
        if [ -f ".cicd-server.pid" ]; then
            kill $(cat .cicd-server.pid) 2>/dev/null
            rm -f .cicd-server.pid
            print_success "CI/CD server stopped"
        fi
        if [ -f ".dashboard.pid" ]; then
            kill $(cat .dashboard.pid) 2>/dev/null
            rm -f .dashboard.pid
            print_success "Dashboard stopped"
        fi
        ;;
    "logs")
        print_status "Showing recent logs..."
        echo ""
        echo "=== CI/CD Server Logs ==="
        tail -n 20 logs/cicd-server.log 2>/dev/null || echo "No server logs yet"
        echo ""
        echo "=== Dashboard Logs ==="
        tail -n 20 logs/dashboard.log 2>/dev/null || echo "No dashboard logs yet"
        ;;
    "status")
        print_status "Checking system status..."
        echo ""
        
        # Check CI/CD server
        if curl -s http://localhost:3001/api/health > /dev/null; then
            print_success "CI/CD API server: Running"
            curl -s http://localhost:3001/api/health | jq . 2>/dev/null || echo "API response available"
        else
            print_warning "CI/CD API server: Not running"
        fi
        
        # Check dashboard
        if curl -s http://localhost:3000 > /dev/null; then
            print_success "Dashboard: Running"
        else
            print_warning "Dashboard: Not running"
        fi
        
        # Check configuration
        if [ -f ".env.cicd" ]; then
            print_success "Configuration: Found (.env.cicd)"
            if grep -q "GITHUB_TOKEN=.\+" .env.cicd; then
                print_success "GitHub token: Configured"
            else
                print_warning "GitHub token: Not configured"
            fi
        else
            print_warning "Configuration: Missing (.env.cicd)"
        fi
        ;;
    "help"|*)
        show_usage
        ;;
esac

echo ""
print_status "For full documentation, read: CICD_INTEGRATION_README.md"
echo ""