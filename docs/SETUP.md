# Setup Guide - Solana DevEx Platform

## Quick Start

1. **Clone and install:**
```bash
git clone https://github.com/[username]/solana-devex-platform.git
cd solana-devex-platform
npm install
```

2. **Install API dependencies:**
```bash
cd api
npm install
cd ..
```

3. **Environment setup:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start development servers:**
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: API Backend  
npm run api
```

5. **Access the platform:**
- Dashboard: http://localhost:3000
- API: http://localhost:3001
- WebSocket: ws://localhost:3001

## Architecture

### Frontend (Next.js)
- **Dashboard:** Real-time monitoring interface
- **Components:** Reusable UI components
- **Pages:** Route-based application structure
- **Styling:** Tailwind CSS for responsive design

### Backend API (Node.js)
- **Testing Framework:** Protocol integration testing
- **Real-time Updates:** WebSocket connections
- **CI/CD Simulation:** Pipeline monitoring
- **Health Checks:** Protocol status monitoring

### Protocol Integration
- **Jupiter:** DEX aggregation testing
- **Kamino:** Lending protocol validation
- **Drift:** Perpetuals platform monitoring
- **Raydium:** AMM liquidity checks

## Features

### Dashboard
- Live test result monitoring
- Protocol health visualization
- CI/CD pipeline tracking
- Performance metrics display

### Testing Framework
```javascript
// Example: Test Jupiter integration
const result = await protocolTester.testJupiterSwap(
  'SOL_MINT',
  'USDC_MINT', 
  1.0
);
```

### Real-time Monitoring
- WebSocket-based live updates
- Protocol latency tracking
- Success rate monitoring
- Automated health checks

### CI/CD Pipeline
- Automated deployment simulation
- Multi-stage pipeline tracking
- Environment management (devnet → mainnet)
- Deployment history and logs

## API Endpoints

### Testing
- `POST /api/tests/run` - Execute protocol tests
- `GET /api/tests` - Get test results
- `GET /api/protocols/health` - Protocol health status

### CI/CD
- `POST /api/pipelines/deploy` - Start deployment
- `GET /api/pipelines` - Get pipeline status

### Monitoring
- `GET /api/metrics` - Real-time metrics
- `GET /api/health` - System health

## Development

### Adding New Protocols
1. Add protocol tester class in `api/server.js`
2. Update test routes to include new protocol
3. Add UI components for protocol display
4. Update health monitoring

### Customizing Dashboard
1. Modify components in `/components`
2. Update dashboard layout in `/app/page.tsx`
3. Add new metrics to API endpoints
4. Style with Tailwind CSS classes

## Deployment

### Vercel (Frontend)
```bash
npm run build
vercel --prod
```

### Railway/Heroku (API)
```bash
cd api
npm start
```

### Environment Variables
See `.env.example` for required configuration.

## Troubleshooting

### Common Issues
- **Port conflicts:** Change ports in package.json
- **WebSocket connection:** Check firewall settings
- **Protocol timeouts:** Verify RPC endpoints
- **Build errors:** Clear node_modules and reinstall

### Debug Mode
```bash
NODE_ENV=development npm run dev
```

## Contributing

This project was built autonomously by the onchain-devex AI agent for the Colosseum Agent Hackathon. All development follows the hackathon's autonomous building requirements.