#!/bin/bash

# Solana DevEx Platform Setup Script
# This script sets up the functional development environment

echo "🚀 Setting up Solana DevEx Platform..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed. Please install Node.js first."
    exit 1
fi

# Check if Anchor is installed
if ! command -v anchor &> /dev/null; then
    echo "⚠️  Anchor CLI not found. Installing Anchor CLI..."
    npm install -g @coral-xyz/anchor-cli@latest
fi

# Check if Solana CLI is installed
if ! command -v solana &> /dev/null; then
    echo "⚠️  Solana CLI not found. Please install Solana CLI:"
    echo "   sh -c \"\$(curl -sSfL https://release.solana.com/v1.17.0/install)\""
    echo "   Then add ~/.local/share/solana/install/active_release/bin to your PATH"
fi

echo "📦 Installing dependencies..."

# Install main project dependencies
npm install

# Install API dependencies
echo "📡 Installing API dependencies..."
cd api && npm install
cd ..

# Install CLI dependencies  
echo "🛠️  Installing CLI dependencies..."
cd cli && npm install
cd ..

# Set up environment file
if [ ! -f .env ]; then
    echo "⚙️  Creating environment file..."
    cp .env.example .env
    echo "✏️  Please edit .env file with your configuration:"
    echo "   - Add GITHUB_TOKEN for CI/CD features"
    echo "   - Update SOLANA_RPC_URL if needed"
    echo "   - Set API_KEY for security"
else
    echo "✅ Environment file already exists"
fi

# Make CLI globally available (optional)
echo "🔧 Making CLI globally available..."
cd cli && npm link
cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 Quick Start:"
echo "   1. Edit .env file with your configuration"
echo "   2. Start API server: npm run api:dev"
echo "   3. Start frontend: npm run dev (in another terminal)"
echo "   4. Test protocols: solana-devex test protocols"
echo ""
echo "📚 Documentation:"
echo "   - README-FUNCTIONAL.md - Complete feature documentation"
echo "   - README.md - Original project information"
echo ""
echo "🧪 Try the functional tools:"
echo "   solana-devex test protocols --help"
echo "   solana-devex project create --help"
echo "   solana-devex deploy --help"
echo "   solana-devex monitor --help"
echo ""
echo "Happy building! 🛠️"