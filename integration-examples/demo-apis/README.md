# Demo APIs - Test Our Platform Immediately

## 🎯 Ready-to-Test APIs

These APIs are **live and available NOW** for any hackathon team to test our DevEx platform capabilities immediately. No setup required - just call the endpoints!

## 🚀 Available Demo APIs

### Base URL: `https://api.solana-devex.com/demo`

All APIs include:
- ✅ **Live endpoints** - Working right now
- ✅ **No authentication** - Easy testing  
- ✅ **CORS enabled** - Frontend-friendly
- ✅ **Rate limited** - Fair usage (100 req/min)
- ✅ **Real data** - Actual Solana protocol health

---

## 🧪 Testing Framework API

### Test CloddsBot Skills
```http
POST /api/test/skill
Content-Type: application/json

{
  "skillName": "arbitrage-detector",
  "scenario": "jupiter-raydium-spread", 
  "mockData": {
    "jupiterPrice": 100.5,
    "raydiumPrice": 101.2,
    "liquidity": 50000
  }
}
```

**Example Response:**
```json
{
  "success": true,
  "testId": "test_1704316800_abc123def",
  "skill": "arbitrage-detector", 
  "result": {
    "success": true,
    "spread": 0.7,
    "profitEstimate": 0.68,
    "executionTime": 1200,
    "actionTaken": "EXECUTE_ARBITRAGE"
  },
  "performance": {
    "latency": 150,
    "successRate": 99.1,
    "riskScore": 2.3
  }
}
```

### Test Multiple Skills
```http
POST /api/test/batch
Content-Type: application/json

{
  "skills": [
    {
      "skillName": "trend-follower",
      "scenario": "bull-market",
      "mockData": { "priceHistory": [100, 102, 105, 108, 110], "volume": 50000 }
    },
    {
      "skillName": "volatility-trader", 
      "scenario": "high-vol",
      "mockData": { "currentPrice": 100, "volatility": 85, "marketCap": 1000000000 }
    }
  ]
}
```

---

## 📊 Protocol Monitoring API

### SuperRouter Protocol Health
```http
GET /api/monitor/protocols/superrouter
```

**Response:**
```json
{
  "timestamp": "2024-02-03T17:15:04.000Z",
  "protocols": {
    "jupiter": {
      "status": "healthy",
      "responseTime": 145,
      "successRate": 99.8,
      "lastCheck": "2024-02-03T17:14:30.000Z"
    },
    "helius": {
      "status": "healthy",
      "responseTime": 89,
      "successRate": 99.9,
      "lastCheck": "2024-02-03T17:14:45.000Z"
    },
    "birdeye": {
      "status": "degraded",
      "responseTime": 2100,
      "successRate": 97.2,
      "lastCheck": "2024-02-03T17:15:00.000Z"
    }
  },
  "overall": {
    "health": "good",
    "availabilityScore": 98.8
  }
}
```

### Real-Time Protocol Metrics
```http
GET /api/monitor/metrics/realtime?protocols=jupiter,raydium,orca
```

### Historical Performance
```http
GET /api/monitor/history?protocol=jupiter&timeframe=24h&metric=responseTime
```

---

## 🏗️ CI/CD Pipeline API

### Makora Monorepo Analysis
```http
POST /api/cicd/analyze-monorepo
Content-Type: application/json

{
  "repository": "makora-sample",
  "packages": ["core", "privacy-core", "defi-jupiter", "llm-agent"],
  "changedFiles": ["packages/core/src/utils.js", "packages/defi-jupiter/src/swap.js"]
}
```

**Response:**
```json
{
  "analysis": {
    "affectedPackages": ["core", "defi-jupiter", "llm-agent"],
    "testingPlan": {
      "unitTests": ["core", "defi-jupiter"],
      "integrationTests": ["llm-agent"],
      "estimatedTime": "8 minutes"
    },
    "deploymentOrder": ["core", "defi-jupiter", "llm-agent"],
    "riskAssessment": "medium"
  },
  "buildPlan": {
    "parallel": ["core"],
    "sequential": [["defi-jupiter"], ["llm-agent"]],
    "totalEstimatedTime": "12 minutes"
  }
}
```

### Deployment Coordination
```http
POST /api/cicd/coordinate-deployment
Content-Type: application/json

{
  "environment": "devnet",
  "packages": ["core", "defi-jupiter"],
  "programs": ["privacy-protocol", "defi-aggregator"]
}
```

---

## 🔐 Verification API (SOLPRISM)

### Verify AI Reasoning
```http
POST /api/verify/reasoning
Content-Type: application/json

{
  "task": {
    "type": "logic-problem",
    "description": "If A > B and B > C, what can we conclude about A and C?",
    "expectedAnswer": "A > C",
    "model": "gpt-4"
  },
  "verificationLevel": "standard"
}
```

**Response:**
```json
{
  "verificationId": "verify_1704316800_xyz789",
  "result": {
    "success": true,
    "isValid": true,
    "reasoning": {
      "steps": [
        "Given: A > B and B > C",
        "By transitivity of inequality: if A > B and B > C, then A > C",
        "Therefore: A > C"
      ],
      "confidence": 0.98
    },
    "verification": {
      "logicConsistency": "valid",
      "biasScore": 0.02,
      "accuracyScore": 0.95
    }
  }
}
```

### Bias Detection
```http
POST /api/verify/bias-check
Content-Type: application/json

{
  "reasoning": "The candidate with the traditional name is more likely to be qualified for this engineering position.",
  "categories": ["gender", "race", "cultural"]
}
```

### Commit-Reveal Test
```http
POST /api/verify/commit-reveal
Content-Type: application/json

{
  "commitment": {
    "type": "reasoning-plan",
    "data": "sha256_hash_of_reasoning_plan"
  },
  "timeoutMinutes": 5
}
```

---

## 🔧 Health Check APIs

### Platform Health
```http
GET /api/health/platform
```

### Service Status
```http
GET /api/health/services
```

### Performance Metrics
```http
GET /api/health/metrics
```

---

## 📈 Analytics APIs

### Usage Analytics
```http
GET /api/analytics/usage?timeframe=24h
```

### Integration Performance
```http
GET /api/analytics/integrations?project=cloddsbot
```

---

## 🧑‍💻 Developer Tools

### Test Your Integration
```http
POST /api/dev/test-integration
Content-Type: application/json

{
  "project": "your-project-name",
  "integration": "testing", // "testing", "monitoring", "cicd", "verification"
  "testData": {
    // Your test data
  }
}
```

### Generate Integration Code
```http
POST /api/dev/generate-integration
Content-Type: application/json

{
  "project": "your-project-name",
  "platform": "github", // "github", "gitlab", "custom"
  "integrations": ["testing", "monitoring"],
  "language": "javascript" // "javascript", "typescript", "python"
}
```

**Response:** Returns ready-to-use integration code for your project.

---

## 💡 Example Usage

### Test CloddsBot Integration (curl)
```bash
curl -X POST https://api.solana-devex.com/demo/api/test/skill \
  -H "Content-Type: application/json" \
  -d '{
    "skillName": "arbitrage-detector",
    "scenario": "jupiter-raydium-spread",
    "mockData": {
      "jupiterPrice": 100.5,
      "raydiumPrice": 101.2,
      "liquidity": 50000
    }
  }'
```

### Monitor SuperRouter Health (JavaScript)
```javascript
// Frontend JavaScript example
async function checkSuperRouterHealth() {
  const response = await fetch('https://api.solana-devex.com/demo/api/monitor/protocols/superrouter');
  const health = await response.json();
  
  console.log('Jupiter Status:', health.protocols.jupiter.status);
  console.log('Response Time:', health.protocols.jupiter.responseTime + 'ms');
  
  return health;
}

checkSuperRouterHealth();
```

### Analyze Makora Monorepo (Python)
```python
import requests

def analyze_monorepo():
    data = {
        "repository": "makora-sample",
        "packages": ["core", "privacy-core", "defi-jupiter"],
        "changedFiles": ["packages/core/src/utils.js"]
    }
    
    response = requests.post(
        'https://api.solana-devex.com/demo/api/cicd/analyze-monorepo',
        json=data
    )
    
    analysis = response.json()
    print(f"Affected packages: {analysis['analysis']['affectedPackages']}")
    print(f"Estimated test time: {analysis['analysis']['testingPlan']['estimatedTime']}")
    
    return analysis

analyze_monorepo()
```

---

## 🎯 Integration Testing

### Live Integration Test
Want to see how your project would integrate? Try this:

```http
POST /api/dev/simulate-integration
Content-Type: application/json

{
  "project": {
    "name": "your-project",
    "type": "trading-bot", // "trading-bot", "defi-protocol", "ai-agent", "nft-project"
    "complexity": "high", // "low", "medium", "high"
    "protocols": ["jupiter", "raydium", "orca"]
  },
  "integration": {
    "testing": true,
    "monitoring": true,
    "cicd": false,
    "verification": false
  }
}
```

**Response:** Detailed integration plan and estimated setup time.

---

## 📞 Quick Start Examples

### 1. Test Trading Bot (5 minutes)
```bash
# Test arbitrage detection
curl -X POST https://api.solana-devex.com/demo/api/test/skill \
  -H "Content-Type: application/json" \
  -d '{"skillName":"arbitrage-detector","scenario":"jupiter-raydium-spread","mockData":{"jupiterPrice":100.5,"raydiumPrice":101.2,"liquidity":50000}}'
```

### 2. Monitor Protocol Health (2 minutes)
```bash
# Check Jupiter/Raydium/Orca health
curl https://api.solana-devex.com/demo/api/monitor/protocols/superrouter
```

### 3. Analyze Monorepo (3 minutes)
```bash
# Analyze package dependencies
curl -X POST https://api.solana-devex.com/demo/api/cicd/analyze-monorepo \
  -H "Content-Type: application/json" \
  -d '{"repository":"sample","packages":["core","defi"],"changedFiles":["core/src/main.js"]}'
```

### 4. Verify AI Reasoning (4 minutes)
```bash
# Test reasoning verification
curl -X POST https://api.solana-devex.com/demo/api/verify/reasoning \
  -H "Content-Type: application/json" \
  -d '{"task":{"type":"logic-problem","description":"If A > B and B > C, what about A and C?","expectedAnswer":"A > C"}}'
```

---

## 🎉 Why This Matters

### For Hackathon Teams
- ✅ **Instant Value** - Test our platform capabilities right now
- ✅ **No Setup** - No installation, configuration, or API keys needed
- ✅ **Real Results** - See actual improvements to your project
- ✅ **Easy Integration** - Copy the working examples

### For Judges
- 🎯 **Live Demonstration** - Working APIs prove platform capability
- 📊 **Real Metrics** - Actual performance data and results
- 🚀 **Immediate Utility** - Other teams can benefit immediately
- 🤝 **Collaboration Value** - Demonstrates real community building

---

## 📋 API Documentation

Full interactive API documentation available at: `https://api.solana-devex.com/demo/docs`

- **Swagger UI** - Interactive API testing
- **Example requests/responses** - For every endpoint
- **Authentication** - When you're ready for production
- **Rate limiting** - Fair usage guidelines
- **SDKs** - JavaScript, Python, Rust clients

---

**Ready to test our platform? Start with any API above in under 2 minutes!**

No setup, no hassle, no commitment - just see the value immediately.