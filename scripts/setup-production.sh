#!/bin/bash

# PRODUCTION SETUP SCRIPT
# Sets up the Solana DevEx Platform for production deployment

set -e

echo "🚀 Setting up Solana DevEx Platform for Production"
echo "=================================================="

# Check if running as root (for system-level configurations)
if [[ $EUID -eq 0 ]]; then
   echo "⚠️  This script should not be run as root for security reasons"
   echo "   Run as a regular user with sudo access when needed"
   exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version 2>/dev/null || echo "not installed")
if [[ $NODE_VERSION == "not installed" ]]; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first"
    exit 1
fi

NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
if [[ $NODE_MAJOR -lt 18 ]]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please upgrade to Node.js 18+"
    exit 1
fi

echo "✅ Node.js version: $NODE_VERSION"

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL client not found. Installing PostgreSQL..."
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get update
        sudo apt-get install -y postgresql postgresql-contrib
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        if command -v brew &> /dev/null; then
            brew install postgresql
            brew services start postgresql
        else
            echo "❌ Homebrew not found. Please install PostgreSQL manually"
            exit 1
        fi
    else
        echo "❌ Unsupported OS. Please install PostgreSQL manually"
        exit 1
    fi
fi

echo "✅ PostgreSQL is available"

# Check Redis
if ! command -v redis-cli &> /dev/null; then
    echo "⚠️  Redis not found. Installing Redis..."
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get install -y redis-server
        sudo systemctl enable redis-server
        sudo systemctl start redis-server
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        if command -v brew &> /dev/null; then
            brew install redis
            brew services start redis
        else
            echo "❌ Homebrew not found. Please install Redis manually"
            exit 1
        fi
    else
        echo "❌ Unsupported OS. Please install Redis manually"
        exit 1
    fi
fi

echo "✅ Redis is available"

# Create production directories
echo "📁 Creating production directories..."
mkdir -p logs
mkdir -p data
mkdir -p backups
mkdir -p ssl
mkdir -p scripts
mkdir -p config

# Set up environment file
echo "⚙️  Setting up environment configuration..."
if [[ ! -f .env.production ]]; then
    cat > .env.production << EOF
# PRODUCTION ENVIRONMENT CONFIGURATION
NODE_ENV=production

# Server Configuration
PORT=3001
HOST=0.0.0.0
API_KEY=\${RANDOM_API_KEY:-$(openssl rand -hex 32)}

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=solana_devex_prod
DB_USER=solana_devex
DB_PASSWORD=\${DB_PASSWORD:-$(openssl rand -base64 32)}

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PREFIX=solana_devex:prod:

# Solana Configuration
SOLANA_RPC_URL=\${SOLANA_RPC_URL:-https://api.mainnet-beta.solana.com}
SOLANA_WS_URL=\${SOLANA_WS_URL:-wss://api.mainnet-beta.solana.com}
MAINNET_RPC=\${MAINNET_RPC:-https://api.mainnet-beta.solana.com}
DEVNET_RPC=\${DEVNET_RPC:-https://api.devnet.solana.com}

# Premium RPC Providers (Optional - Add your API keys)
HELIUS_API_KEY=\${HELIUS_API_KEY:-}
QUICKNODE_API_KEY=\${QUICKNODE_API_KEY:-}
ALCHEMY_API_KEY=\${ALCHEMY_API_KEY:-}

# Security Configuration
CORS_ORIGIN=\${CORS_ORIGIN:-http://localhost:3000,https://yourdomain.com}
SESSION_SECRET=\${SESSION_SECRET:-$(openssl rand -base64 32)}

# Monitoring & Alerting
WEBHOOK_URL=\${WEBHOOK_URL:-}
EMAIL_HOST=\${EMAIL_HOST:-}
EMAIL_PORT=\${EMAIL_PORT:-587}
EMAIL_USER=\${EMAIL_USER:-}
EMAIL_PASS=\${EMAIL_PASS:-}

# Performance Tuning
MAX_CONNECTIONS=100
CACHE_SIZE=10000
BATCH_SIZE=1000
WORKER_PROCESSES=\${WORKER_PROCESSES:-$(nproc)}

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log
ERROR_LOG_FILE=logs/error.log

# Feature Flags
ENABLE_CLUSTERING=true
ENABLE_MONITORING=true
ENABLE_RATE_LIMITING=true
ENABLE_COMPRESSION=true
ENABLE_CACHING=true

EOF

    echo "✅ Created .env.production"
    echo "   🔐 Generated secure API key and database password"
    echo "   ⚠️  Please review and update the configuration as needed"
else
    echo "✅ .env.production already exists"
fi

# Set up database
echo "🗄️  Setting up production database..."
DB_NAME="solana_devex_prod"
DB_USER="solana_devex"
DB_PASSWORD=$(grep "DB_PASSWORD=" .env.production | cut -d'=' -f2 | sed 's/\${DB_PASSWORD:-\(.*\)}/\1/')

# Create database user and database
sudo -u postgres psql << EOF || echo "Database setup may have failed (this is normal if already exists)"
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
CREATE DATABASE $DB_NAME OWNER $DB_USER;
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
\q
EOF

echo "✅ Database setup completed"

# Install dependencies
echo "📦 Installing production dependencies..."
npm ci --only=production

# Install API dependencies
cd api
if [[ -f package.json ]]; then
    npm ci --only=production
fi
cd ..

# Build application
echo "🔨 Building application for production..."
npm run build

# Set up systemd service (Linux only)
if [[ "$OSTYPE" == "linux-gnu"* ]] && command -v systemctl &> /dev/null; then
    echo "📋 Setting up systemd service..."
    
    SERVICE_FILE="/etc/systemd/system/solana-devex-platform.service"
    sudo tee $SERVICE_FILE > /dev/null << EOF
[Unit]
Description=Solana DevEx Platform
After=network.target postgresql.service redis.service
Requires=postgresql.service redis.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
Environment=NODE_ENV=production
EnvironmentFile=$(pwd)/.env.production
ExecStart=$(which node) api/production-server.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=solana-devex

# Security
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=$(pwd)/logs $(pwd)/data $(pwd)/backups

# Performance
LimitNOFILE=65536
LimitNPROC=4096

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable solana-devex-platform
    
    echo "✅ Systemd service created and enabled"
    echo "   Use: sudo systemctl start solana-devex-platform"
    echo "        sudo systemctl stop solana-devex-platform"
    echo "        sudo systemctl status solana-devex-platform"
fi

# Set up log rotation
echo "📝 Setting up log rotation..."
sudo tee /etc/logrotate.d/solana-devex-platform > /dev/null << EOF
$(pwd)/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0644 $USER $USER
    postrotate
        systemctl reload solana-devex-platform || true
    endscript
}
EOF

echo "✅ Log rotation configured"

# Set up monitoring script
echo "📊 Setting up monitoring scripts..."
cat > scripts/health-check.sh << 'EOF'
#!/bin/bash
# Health check script for monitoring

API_URL="${API_URL:-http://localhost:3001}"
LOG_FILE="${LOG_FILE:-logs/health-check.log}"

timestamp=$(date '+%Y-%m-%d %H:%M:%S')

# Check API health
response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/health" --max-time 10)

if [[ $response == "200" ]]; then
    echo "[$timestamp] ✅ API health check passed (HTTP $response)" >> "$LOG_FILE"
    exit 0
else
    echo "[$timestamp] ❌ API health check failed (HTTP $response)" >> "$LOG_FILE"
    exit 1
fi
EOF

chmod +x scripts/health-check.sh

# Set up backup script
cat > scripts/backup.sh << 'EOF'
#!/bin/bash
# Backup script for production data

source .env.production

BACKUP_DIR="backups"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
DB_BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.sql"

echo "Starting backup at $(date)"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup database
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > "$DB_BACKUP_FILE"

if [[ $? -eq 0 ]]; then
    echo "✅ Database backup completed: $DB_BACKUP_FILE"
    gzip "$DB_BACKUP_FILE"
    echo "✅ Backup compressed: ${DB_BACKUP_FILE}.gz"
else
    echo "❌ Database backup failed"
    exit 1
fi

# Clean old backups (keep last 30 days)
find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed at $(date)"
EOF

chmod +x scripts/backup.sh

# Set up monitoring cron jobs
echo "⏰ Setting up cron jobs..."
(crontab -l 2>/dev/null; echo "*/5 * * * * $(pwd)/scripts/health-check.sh") | crontab -
(crontab -l 2>/dev/null; echo "0 2 * * * $(pwd)/scripts/backup.sh") | crontab -

echo "✅ Cron jobs configured (health checks every 5 minutes, backups daily at 2 AM)"

# Set up SSL/TLS (basic self-signed for development)
echo "🔒 Setting up SSL certificates (self-signed for development)..."
if [[ ! -f ssl/server.crt ]]; then
    openssl req -x509 -newkey rsa:4096 -keyout ssl/server.key -out ssl/server.crt -days 365 -nodes \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
    echo "✅ Self-signed SSL certificate created"
    echo "   🔐 For production, replace with proper SSL certificates"
fi

# Set proper permissions
echo "🔐 Setting file permissions..."
chmod 600 .env.production ssl/server.key
chmod 644 ssl/server.crt
chmod -R 755 scripts logs data backups

# Performance tuning
echo "⚡ Applying performance optimizations..."

# Increase file descriptor limits
echo "* soft nofile 65536" | sudo tee -a /etc/security/limits.conf > /dev/null
echo "* hard nofile 65536" | sudo tee -a /etc/security/limits.conf > /dev/null

# PostgreSQL optimization
sudo -u postgres psql << EOF || echo "PostgreSQL tuning may have failed"
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET work_mem = '4MB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
SELECT pg_reload_conf();
\q
EOF

# Redis optimization
if [[ -f /etc/redis/redis.conf ]]; then
    sudo sed -i 's/# maxmemory <bytes>/maxmemory 256mb/' /etc/redis/redis.conf
    sudo sed -i 's/# maxmemory-policy noeviction/maxmemory-policy allkeys-lru/' /etc/redis/redis.conf
    sudo systemctl restart redis || sudo systemctl restart redis-server
fi

echo "✅ Performance optimizations applied"

# Final verification
echo "🔍 Running verification checks..."

# Check Node.js
node --version > /dev/null && echo "✅ Node.js is working"

# Check database connection
PGPASSWORD="$DB_PASSWORD" psql -h localhost -U "$DB_USER" -d "$DB_NAME" -c "SELECT version();" > /dev/null 2>&1 && echo "✅ Database connection working"

# Check Redis connection
redis-cli ping > /dev/null 2>&1 && echo "✅ Redis connection working"

# Check if build was successful
[[ -d .next ]] && echo "✅ Application build successful"

echo ""
echo "🎉 PRODUCTION SETUP COMPLETE!"
echo "================================"
echo ""
echo "📋 Next Steps:"
echo "1. Review and update .env.production with your specific configuration"
echo "2. Add your RPC provider API keys for better performance"
echo "3. Set up proper SSL certificates for production"
echo "4. Configure firewall rules for security"
echo "5. Set up monitoring and alerting"
echo ""
echo "🚀 Start the application:"
echo "   Production mode: npm run production:start"
echo "   Cluster mode:    npm run production:cluster"
echo "   As service:      sudo systemctl start solana-devex-platform"
echo ""
echo "🔧 Useful commands:"
echo "   Health check:    scripts/health-check.sh"
echo "   Backup:          scripts/backup.sh"
echo "   Load test:       npm run load:test"
echo "   Logs:            tail -f logs/app.log"
echo "   Service status:  sudo systemctl status solana-devex-platform"
echo ""
echo "📚 Documentation: README.md"
echo "🐛 Issues: Check logs/error.log"
echo ""
echo "⚠️  IMPORTANT SECURITY NOTES:"
echo "- Change default passwords in .env.production"
echo "- Set up proper firewall rules"
echo "- Use proper SSL certificates in production"
echo "- Regularly update dependencies"
echo "- Monitor security logs"