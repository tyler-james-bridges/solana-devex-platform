#!/bin/bash

# Solana Test Validator Auto-Setup Script
# This script automates the initial setup and configuration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SOLANA_VERSION="stable"
INSTALL_DIR="$HOME/.solana-test-validator-ext"
LOG_FILE="$INSTALL_DIR/setup.log"

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

# Banner
echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║               SOLANA TEST VALIDATOR EXTENSION                 ║
║                       AUTO-SETUP SCRIPT                      ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Create directories
mkdir -p "$INSTALL_DIR"
touch "$LOG_FILE"

log "Starting Solana Test Validator Extension setup..."

# Check if running on macOS or Linux
OS="$(uname -s)"
case "${OS}" in
    Linux*)     MACHINE=Linux;;
    Darwin*)    MACHINE=Mac;;
    *)          MACHINE="UNKNOWN:${OS}"
esac
log "Detected operating system: $MACHINE"

# Check for Node.js
log "Checking for Node.js..."
if ! command -v node &> /dev/null; then
    error "Node.js is not installed. Please install Node.js 16+ and try again."
    exit 1
fi

NODE_VERSION=$(node -v)
log "Node.js version: $NODE_VERSION"

# Check for npm
log "Checking for npm..."
if ! command -v npm &> /dev/null; then
    error "npm is not installed. Please install npm and try again."
    exit 1
fi

NPM_VERSION=$(npm -v)
log "npm version: $NPM_VERSION"

# Check for Solana CLI
log "Checking for Solana CLI..."
if ! command -v solana &> /dev/null; then
    warning "Solana CLI not found. Installing..."
    
    if [[ "$MACHINE" == "Mac" ]]; then
        if command -v brew &> /dev/null; then
            log "Installing Solana CLI via Homebrew..."
            brew install solana
        else
            log "Installing Solana CLI via sh -c..."
            sh -c "$(curl -sSfL https://release.solana.com/v1.17.0/install)"
            export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
        fi
    else
        log "Installing Solana CLI via sh -c..."
        sh -c "$(curl -sSfL https://release.solana.com/v1.17.0/install)"
        export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
    fi
    
    # Verify installation
    if ! command -v solana &> /dev/null; then
        error "Failed to install Solana CLI. Please install manually."
        exit 1
    fi
fi

SOLANA_VERSION=$(solana --version)
log "Solana CLI version: $SOLANA_VERSION"

# Check for solana-test-validator
log "Checking for solana-test-validator..."
if ! command -v solana-test-validator &> /dev/null; then
    error "solana-test-validator not found. This should come with Solana CLI."
    exit 1
fi

log "solana-test-validator found and ready"

# Install extension dependencies
log "Installing extension dependencies..."
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_DIR="$( cd "$SCRIPT_DIR/.." &> /dev/null && pwd )"

cd "$PROJECT_DIR"
npm install

log "Dependencies installed successfully"

# Initialize configuration
log "Initializing configuration..."
node cli/index.js config init

log "Configuration initialized"

# Create default environments
log "Creating default environments..."

# Development environment
node cli/index.js env create development \
    --port 8899 \
    --description "Default development environment"

# Testing environment  
node cli/index.js env create testing \
    --port 8900 \
    --description "Testing environment with reset enabled" \
    --reset

# Local environment with some common accounts
node cli/index.js env create local \
    --port 8901 \
    --description "Local environment with common mainnet accounts"

log "Default environments created"

# Setup systemd service (Linux only)
if [[ "$MACHINE" == "Linux" ]]; then
    log "Setting up systemd service..."
    
    SERVICE_FILE="$HOME/.config/systemd/user/solana-test-validator-ext.service"
    mkdir -p "$(dirname "$SERVICE_FILE")"
    
    cat > "$SERVICE_FILE" << EOF
[Unit]
Description=Solana Test Validator Extension
After=network.target

[Service]
Type=simple
WorkingDirectory=$PROJECT_DIR
ExecStart=$PROJECT_DIR/cli/index.js validator start development --monitor
Restart=always
RestartSec=3
Environment=NODE_ENV=production

[Install]
WantedBy=default.target
EOF

    systemctl --user daemon-reload
    log "Systemd service created (not enabled by default)"
fi

# Setup launchd service (macOS only)
if [[ "$MACHINE" == "Mac" ]]; then
    log "Setting up launchd service..."
    
    PLIST_FILE="$HOME/Library/LaunchAgents/com.solana.test-validator-ext.plist"
    
    cat > "$PLIST_FILE" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.solana.test-validator-ext</string>
    <key>ProgramArguments</key>
    <array>
        <string>node</string>
        <string>$PROJECT_DIR/cli/index.js</string>
        <string>validator</string>
        <string>start</string>
        <string>development</string>
        <string>--monitor</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$PROJECT_DIR</string>
    <key>RunAtLoad</key>
    <false/>
    <key>KeepAlive</key>
    <false/>
    <key>StandardOutPath</key>
    <string>$INSTALL_DIR/launchd.log</string>
    <key>StandardErrorPath</key>
    <string>$INSTALL_DIR/launchd.error.log</string>
</dict>
</plist>
EOF

    log "Launchd service created (not enabled by default)"
fi

# Create useful aliases
log "Creating shell aliases..."

ALIAS_FILE="$INSTALL_DIR/aliases.sh"
cat > "$ALIAS_FILE" << EOF
# Solana Test Validator Extension Aliases
alias stve='$PROJECT_DIR/cli/index.js'
alias solana-dev='$PROJECT_DIR/cli/index.js validator start development'
alias solana-test='$PROJECT_DIR/cli/index.js validator start testing --reset'
alias solana-monitor='$PROJECT_DIR/cli/index.js monitor start'
alias solana-status='$PROJECT_DIR/cli/index.js validator status'
alias solana-logs='tail -f $INSTALL_DIR/validator.log'
EOF

log "Aliases created at $ALIAS_FILE"
log "Add 'source $ALIAS_FILE' to your shell profile to use aliases"

# Create desktop shortcut (Linux with desktop environment)
if [[ "$MACHINE" == "Linux" ]] && [[ -n "$XDG_CURRENT_DESKTOP" ]]; then
    log "Creating desktop shortcut..."
    
    DESKTOP_FILE="$HOME/Desktop/Solana-Validator-Dashboard.desktop"
    cat > "$DESKTOP_FILE" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=Solana Validator Dashboard
Comment=Open Solana Test Validator monitoring dashboard
Exec=xdg-open http://localhost:3001
Icon=applications-development
Terminal=false
Categories=Development;
EOF
    
    chmod +x "$DESKTOP_FILE"
    log "Desktop shortcut created"
fi

# Performance tuning suggestions
log "Applying performance optimizations..."

# Increase file descriptor limits
if [[ "$MACHINE" == "Linux" ]]; then
    LIMITS_FILE="/etc/security/limits.conf"
    if [[ -w "$LIMITS_FILE" ]] || [[ "$(id -u)" == "0" ]]; then
        echo "* soft nofile 65536" | sudo tee -a "$LIMITS_FILE" > /dev/null
        echo "* hard nofile 65536" | sudo tee -a "$LIMITS_FILE" > /dev/null
        log "File descriptor limits increased"
    else
        warning "Could not modify $LIMITS_FILE. Run with sudo for system-wide limits."
    fi
fi

# Create maintenance script
log "Creating maintenance script..."
MAINTENANCE_SCRIPT="$INSTALL_DIR/maintenance.sh"
cat > "$MAINTENANCE_SCRIPT" << 'EOF'
#!/bin/bash

# Solana Test Validator Extension Maintenance Script

INSTALL_DIR="$HOME/.solana-test-validator-ext"
PROJECT_DIR="$(dirname "$(dirname "$(realpath "${BASH_SOURCE[0]}")")")"

echo "🧹 Running maintenance tasks..."

# Clean up old logs (keep last 7 days)
find "$INSTALL_DIR" -name "*.log" -type f -mtime +7 -delete 2>/dev/null || true
echo "✅ Cleaned up old log files"

# Clean up old metrics (keep last 30 days)
find "$INSTALL_DIR/metrics" -name "*.jsonl" -type f -mtime +30 -delete 2>/dev/null || true
echo "✅ Cleaned up old metrics"

# Update Solana CLI if needed
echo "🔄 Checking for Solana CLI updates..."
solana-install update || echo "⚠️  Solana update check failed"

# Update extension dependencies
echo "🔄 Updating extension dependencies..."
cd "$PROJECT_DIR" && npm update

echo "✅ Maintenance completed"
EOF

chmod +x "$MAINTENANCE_SCRIPT"
log "Maintenance script created at $MAINTENANCE_SCRIPT"

# Setup cron job for maintenance
if command -v crontab &> /dev/null; then
    log "Setting up weekly maintenance cron job..."
    
    # Add cron job (runs every Sunday at 2 AM)
    (crontab -l 2>/dev/null; echo "0 2 * * 0 $MAINTENANCE_SCRIPT") | crontab -
    
    log "Weekly maintenance scheduled"
fi

# Final verification
log "Running final verification..."

# Test CLI command
if "$PROJECT_DIR/cli/index.js" --version &>/dev/null; then
    log "✅ CLI command working"
else
    warning "❌ CLI command test failed"
fi

# Test configuration
if "$PROJECT_DIR/cli/index.js" config show &>/dev/null; then
    log "✅ Configuration accessible"
else
    warning "❌ Configuration test failed"
fi

# Create quick start guide
QUICK_START="$INSTALL_DIR/QUICK_START.md"
cat > "$QUICK_START" << EOF
# Quick Start Guide

## Basic Commands

Start validator with monitoring:
\`\`\`bash
$PROJECT_DIR/cli/index.js validator start development --monitor
\`\`\`

Open dashboard:
http://localhost:3001

Check status:
\`\`\`bash
$PROJECT_DIR/cli/index.js validator status
\`\`\`

Stop validator:
\`\`\`bash
$PROJECT_DIR/cli/index.js validator stop
\`\`\`

## Useful Aliases (run: source $ALIAS_FILE)
- \`stve\` - Main CLI command
- \`solana-dev\` - Start development environment
- \`solana-test\` - Start testing environment with reset
- \`solana-monitor\` - Start monitoring dashboard
- \`solana-status\` - Show validator status

## Environments
- development (port 8899) - Default environment
- testing (port 8900) - Auto-reset environment  
- local (port 8901) - Local development with mainnet accounts

## Next Steps
1. Source aliases: \`source $ALIAS_FILE\`
2. Start validator: \`solana-dev --monitor\`
3. Open dashboard: http://localhost:3001
4. Read full documentation in the project directory

## Support
- Logs: \`tail -f $INSTALL_DIR/validator.log\`
- Config: \`$INSTALL_DIR/config.yaml\`
- Maintenance: \`$MAINTENANCE_SCRIPT\`
EOF

log "Quick start guide created at $QUICK_START"

# Success message
echo
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗"
echo -e "║                                                              ║"
echo -e "║                    🎉 SETUP COMPLETE! 🎉                      ║"
echo -e "║                                                              ║"
echo -e "║  Solana Test Validator Extension is ready to use!           ║"
echo -e "║                                                              ║"
echo -e "╚══════════════════════════════════════════════════════════════╝${NC}"
echo
echo -e "${BLUE}📚 Quick Start:${NC}"
echo -e "   1. Source aliases: ${YELLOW}source $ALIAS_FILE${NC}"
echo -e "   2. Start validator: ${YELLOW}solana-dev --monitor${NC}"
echo -e "   3. Open dashboard: ${YELLOW}http://localhost:3001${NC}"
echo
echo -e "${BLUE}📖 Documentation:${NC} $QUICK_START"
echo -e "${BLUE}🔧 Maintenance:${NC} $MAINTENANCE_SCRIPT"
echo -e "${BLUE}📋 Configuration:${NC} $INSTALL_DIR/config.yaml"
echo
echo -e "${GREEN}Happy coding! 🚀${NC}"