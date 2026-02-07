# Solana DevEx Platform - Agent Integration Guide

The Solana DevEx Platform is a unified development infrastructure that provides comprehensive testing, monitoring, CI/CD, and protocol health services for the Solana ecosystem. This platform enables AI agents and developers to programmatically access enterprise-grade Solana development tools.

## Platform Overview

**Live Site:** https://onchain-devex.tools  
**Repository:** https://github.com/tyler-james-bridges/solana-devex-platform  
**Author:** tmoney_145  
**Version:** 1.0.0

## Core Capabilities

- **Protocol Testing**: Automated testing for Jupiter, Kamino, Drift, Raydium protocols
- **Health Monitoring**: Real-time status monitoring of Solana protocols and infrastructure  
- **CI/CD Pipeline**: Automated deployment and testing workflows for Solana projects
- **Real-time Metrics**: Performance analytics and success rate tracking
- **Forum Integration**: Access to Colosseum hackathon community updates

## API Integration

### Base URL
```
https://onchain-devex.tools
```

### Authentication

Most endpoints require an API key for security. Include your API key in the request header:

```bash
X-API-Key: your_api_key_here
```

Contact @tmoney_145 for API access credentials.

### Rate Limits

- **General endpoints**: 100 requests per 15 minutes
- **Resource-intensive operations**: 5 requests per hour
- **Health checks**: No rate limits

## API Endpoints

### 1. Health Check

Monitor service availability and uptime.

```bash
curl -X GET "https://onchain-devex.tools/api/health"
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-06T23:25:55.000Z", 
  "uptime": 86400,
  "version": "1.0.0"
}
```

### 2. Forum Posts

Retrieve platform updates from the Colosseum hackathon forum.

```bash
curl -X GET "https://onchain-devex.tools/api/forum-posts"
```

**Response:**
```json
{
  "success": true,
  "posts": [
    {
      "id": "forum-1516",
      "title": "Solana DevEx Platform - Major Update: Platform Complete + Live Integrations",
      "author": {
        "name": "Tyler James-Bridges",
        "handle": "@tyler_onchain"
      },
      "createdAt": "2026-02-06T02:12:00.000Z",
      "tags": ["devex", "platform", "integrations"]
    }
  ],
  "timestamp": "2026-02-06T23:25:55.000Z"
}
```

### 3. Protocol Tests

Get current test results and execution history.

```bash
curl -X GET "https://onchain-devex.tools/api/tests"
```

**Response:**
```json
{
  "tests": [
    {
      "id": "1707253555123-jupiter",
      "name": "Jupiter Integration Test",
      "protocol": "jupiter",
      "status": "passed",
      "duration": 2.1,
      "latency": 145
    }
  ],
  "summary": {
    "total": 12,
    "passed": 10,
    "failed": 1,
    "running": 1
  }
}
```

### 4. Run Protocol Tests

Execute comprehensive protocol integration tests.

```bash
curl -X POST "https://onchain-devex.tools/api/tests/run" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key_here" \
  -d '{"protocols": ["jupiter", "kamino"]}'
```

**Response:**
```json
{
  "message": "Tests started",
  "testId": "1707253555123",
  "protocols": ["jupiter", "kamino"]
}
```

### 5. Protocol Health

Monitor real-time health status of Solana protocols.

```bash
curl -X GET "https://onchain-devex.tools/api/protocols/health"
```

**Response:**
```json
{
  "protocols": [
    {
      "name": "jupiter",
      "status": "healthy",
      "latency": 145,
      "successRate": 99.2,
      "lastCheck": "2026-02-06T23:25:55.000Z",
      "message": "jupiter is healthy"
    }
  ],
  "lastUpdated": "2026-02-06T23:25:55.000Z"
}
```

### 6. Deployment Pipelines

Monitor CI/CD pipeline status and deployment history.

```bash
curl -X GET "https://onchain-devex.tools/api/pipelines"
```

**Response:**
```json
{
  "pipelines": [
    {
      "id": "1707253555123",
      "name": "my-solana-project", 
      "environment": "devnet",
      "status": "success",
      "stages": ["validate", "build", "test", "deploy", "verify"],
      "progress": 100
    }
  ],
  "summary": {
    "total": 5,
    "success": 4,
    "running": 0,
    "failed": 1
  }
}
```

### 7. Deploy Project

Trigger automated deployment for Solana projects.

```bash
curl -X POST "https://onchain-devex.tools/api/pipelines/deploy" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key_here" \
  -d '{
    "name": "my-solana-dapp",
    "environment": "devnet",
    "projectPath": "/path/to/project"
  }'
```

**Response:**
```json
{
  "message": "Deployment started",
  "deploymentId": "1707253555123",
  "environment": "devnet"
}
```

### 8. Platform Metrics

Access real-time platform performance analytics.

```bash
curl -X GET "https://onchain-devex.tools/api/metrics"
```

**Response:**
```json
{
  "metrics": {
    "testsRun": 247,
    "successRate": 95.5,
    "avgLatency": 150,
    "activeDeployments": 3
  },
  "timestamp": "2026-02-06T23:25:55.000Z"
}
```

## Example Workflows

### 1. Protocol Health Monitoring Workflow

```bash
# Step 1: Check overall platform health
curl -X GET "https://onchain-devex.tools/api/health"

# Step 2: Get detailed protocol health status  
curl -X GET "https://onchain-devex.tools/api/protocols/health"

# Step 3: Run tests if any protocols show degraded status
curl -X POST "https://onchain-devex.tools/api/tests/run" \
  -H "X-API-Key: your_key" \
  -d '{"protocols": ["jupiter"]}'
```

### 2. Automated Deployment Workflow

```bash
# Step 1: Check current deployments
curl -X GET "https://onchain-devex.tools/api/pipelines"

# Step 2: Deploy to devnet
curl -X POST "https://onchain-devex.tools/api/pipelines/deploy" \
  -H "X-API-Key: your_key" \
  -d '{"name": "my-project", "environment": "devnet"}'

# Step 3: Monitor deployment progress
curl -X GET "https://onchain-devex.tools/api/pipelines"
```

### 3. Comprehensive Testing Workflow

```bash
# Step 1: Get baseline test history
curl -X GET "https://onchain-devex.tools/api/tests"

# Step 2: Run comprehensive protocol tests
curl -X POST "https://onchain-devex.tools/api/tests/run" \
  -H "X-API-Key: your_key" \
  -d '{"protocols": ["jupiter", "kamino", "drift", "raydium"]}'

# Step 3: Monitor test results and metrics
curl -X GET "https://onchain-devex.tools/api/metrics"
```

## Integration Partners

The platform actively integrates with several Colosseum hackathon projects:

- **Pyxis**: Security-focused DevEx integration
- **Sipher**: Advanced protocol monitoring
- **AgentDEX**: Agent deployment infrastructure  
- **SOLPRISM**: Security and compliance tools

## WebSocket Support

For real-time updates, connect to the WebSocket endpoint at:

```
wss://onchain-devex.tools/ws
```

## Support

- **GitHub Issues**: https://github.com/tyler-james-bridges/solana-devex-platform/issues
- **Contact**: @tmoney_145
- **Documentation**: https://onchain-devex.tools/docs

## Security

- All sensitive operations require API key authentication
- Rate limiting prevents abuse and ensures fair usage
- HTTPS encryption for all communications
- Regular security audits and monitoring

This platform is designed for seamless integration with AI agents and automated systems in the Solana ecosystem.