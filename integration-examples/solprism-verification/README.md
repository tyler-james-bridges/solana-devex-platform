# SOLPRISM Verification Integration

## 🎯 Problem Statement

**SOLPRISM** is a verifiable AI reasoning protocol with:
- Commit-reveal scheme for transparent AI decision-making
- On-chain verification of AI reasoning processes  
- Integration with various AI models and reasoning systems
- Complex verification workflows requiring development infrastructure

**Missing Infrastructure:**
- No development environment for reasoning verification
- No CI/CD pipeline for commit-reveal testing
- No automated verification of reasoning quality
- No monitoring of verification protocol health

## 🚀 Our Solution

Complete CI/CD integration that validates AI reasoning verification workflows and ensures the reliability of commit-reveal schemes.

### Key Features
- **Reasoning Verification Pipeline** - Automated testing of commit-reveal schemes
- **AI Quality Validation** - Monitor reasoning accuracy and consistency
- **Protocol Health Monitoring** - Track verification system performance
- **Automated Testing** - Comprehensive testing of reasoning workflows
- **Performance Analytics** - Monitor reasoning system efficiency

## 📦 What's Included

```
solprism-verification/
├── README.md                          # This file
├── package.json                       # Dependencies and scripts
├── setup.js                          # Automated setup script
├── config/
│   ├── verification-config.js        # Verification system configuration
│   ├── reasoning-config.js           # AI reasoning configuration
│   ├── commit-reveal-config.js       # Commit-reveal scheme config
│   └── monitoring-config.js          # Performance monitoring config
├── src/
│   ├── verification-engine/          # Core verification system
│   │   ├── ReasoningVerifier.js      # AI reasoning verification
│   │   ├── CommitRevealTester.js     # Commit-reveal testing
│   │   ├── ProofValidator.js         # Verification proof validation
│   │   └── ConsistencyChecker.js     # Reasoning consistency checks
│   ├── reasoning-analyzers/          # AI reasoning analysis
│   │   ├── LogicAnalyzer.js          # Logic consistency analysis
│   │   ├── BiasDetector.js           # Bias detection in reasoning
│   │   ├── AccuracyTracker.js        # Reasoning accuracy tracking
│   │   └── PerformanceAnalyzer.js    # Reasoning performance analysis
│   ├── protocol-monitors/            # Protocol health monitoring
│   │   ├── VerificationMonitor.js    # Verification system monitoring
│   │   ├── CommitMonitor.js          # Commit phase monitoring
│   │   ├── RevealMonitor.js          # Reveal phase monitoring
│   │   └── SystemHealthMonitor.js    # Overall system health
│   └── testing-framework/            # Testing infrastructure
│       ├── ScenarioTester.js         # Reasoning scenario testing
│       ├── LoadTester.js             # Performance load testing
│       ├── SecurityTester.js         # Security vulnerability testing
│       └── IntegrationTester.js      # Integration testing
├── templates/                        # CI/CD and deployment templates
│   ├── github-actions/               # GitHub Actions workflows
│   │   ├── solprism-verification.yml # Main verification workflow
│   │   ├── reasoning-validation.yml  # AI reasoning validation
│   │   └── protocol-monitoring.yml   # Protocol health monitoring
│   ├── docker/                       # Container configurations
│   │   ├── Dockerfile.verification   # Verification environment
│   │   ├── Dockerfile.reasoning      # AI reasoning environment
│   │   └── docker-compose.yml        # Multi-service setup
│   └── deployment/                   # Deployment scripts
│       ├── deploy-verification.sh    # Verification system deployment
│       ├── deploy-monitoring.sh      # Monitoring system deployment
│       └── health-check.sh           # Post-deployment health check
├── examples/
│   ├── reasoning-verification.js     # Example reasoning verification
│   ├── commit-reveal-test.js         # Commit-reveal testing example
│   ├── bias-detection.js             # Bias detection example
│   └── performance-monitoring.js     # Performance monitoring example
├── test-scenarios/                   # Pre-built test scenarios
│   ├── logic-puzzles/                # Logic reasoning tests
│   ├── bias-scenarios/               # Bias detection scenarios
│   ├── consistency-tests/            # Consistency checking tests
│   └── performance-benchmarks/       # Performance benchmark tests
├── docs/
│   ├── verification-guide.md         # Verification system guide
│   ├── reasoning-analysis.md         # AI reasoning analysis
│   ├── monitoring-setup.md           # Monitoring configuration
│   └── troubleshooting.md            # Common issues and solutions
└── scripts/
    ├── run-verification.js           # Start verification testing
    ├── analyze-reasoning.js          # Reasoning analysis tools
    ├── generate-reports.js           # Performance reporting
    └── monitor-protocol.js           # Protocol health monitoring
```

## 🛠️ Quick Integration

### Step 1: Install and Setup

```bash
# Navigate to SOLPRISM project
cd /path/to/solprism

# Copy our verification framework
cp -r /path/to/devex-platform/integration-examples/solprism-verification ./verification

# Install dependencies
cd verification
npm install

# Run automated setup
node setup.js --solprism-path="../"
```

### Step 2: Configure for SOLPRISM

```javascript
// config/verification-config.js
export const verificationConfig = {
  // SOLPRISM protocol configuration
  protocol: {
    commitPhaseTimeout: 300000, // 5 minutes
    revealPhaseTimeout: 600000, // 10 minutes
    verificationTimeout: 120000, // 2 minutes
    maxReasoningSteps: 100,
    requiredConfidence: 0.8
  },
  
  // AI reasoning models to test
  reasoningModels: {
    'gpt-4': {
      apiKey: process.env.OPENAI_API_KEY,
      maxTokens: 2000,
      temperature: 0.1, // Low temperature for consistent reasoning
      systemPrompt: 'You are a precise logical reasoning system.'
    },
    
    'claude-3': {
      apiKey: process.env.ANTHROPIC_API_KEY,
      maxTokens: 2000,
      temperature: 0.1,
      systemPrompt: 'You are a careful and accurate reasoning system.'
    },
    
    'local-llm': {
      endpoint: 'http://localhost:8000/v1/chat/completions',
      model: 'local-reasoning-model',
      maxTokens: 2000
    }
  },
  
  // Verification criteria
  verification: {
    // Logic consistency checks
    logicConsistency: {
      enabled: true,
      tolerance: 0.05 // 5% tolerance for minor inconsistencies
    },
    
    // Bias detection
    biasDetection: {
      enabled: true,
      categories: ['gender', 'race', 'age', 'political', 'religious'],
      threshold: 0.1 // 10% bias threshold
    },
    
    // Accuracy tracking
    accuracyTracking: {
      enabled: true,
      benchmarkDataset: 'reasoning-benchmarks',
      minimumAccuracy: 0.85 // 85% minimum accuracy
    },
    
    // Performance requirements
    performance: {
      maxReasoningTime: 30000, // 30 seconds
      maxMemoryUsage: 1024, // 1GB
      minThroughput: 10 // 10 reasoning tasks per minute
    }
  },
  
  // Monitoring configuration
  monitoring: {
    commitPhaseMonitoring: true,
    revealPhaseMonitoring: true,
    verificationMonitoring: true,
    performanceMonitoring: true,
    healthCheckInterval: 60000 // 1 minute
  }
};
```

### Step 3: Start Verification Testing

```bash
# Run comprehensive verification tests
npm run verify:all

# Test specific components
npm run verify:commit-reveal
npm run verify:reasoning
npm run verify:consistency

# Start monitoring
npm run monitor:start

# Generate verification report
npm run report:verification
```

## 🧠 Verification Capabilities

### 1. Reasoning Verification Engine

Test the core reasoning verification system:

```javascript
// src/verification-engine/ReasoningVerifier.js
export class ReasoningVerifier {
  constructor(config) {
    this.config = config;
    this.logicAnalyzer = new LogicAnalyzer();
    this.biasDetector = new BiasDetector();
    this.accuracyTracker = new AccuracyTracker();
  }

  /**
   * Verify AI reasoning through commit-reveal scheme
   */
  async verifyReasoning(reasoningTask) {
    console.log('🧠 Starting reasoning verification...');
    
    const verificationId = this.generateVerificationId();
    const startTime = Date.now();
    
    try {
      // Phase 1: Commit phase
      console.log('📝 Phase 1: Commit phase...');
      const commitResult = await this.executeCommitPhase(reasoningTask);
      
      // Phase 2: Reasoning execution
      console.log('🤔 Phase 2: Executing reasoning...');
      const reasoningResult = await this.executeReasoning(reasoningTask, commitResult);
      
      // Phase 3: Reveal phase
      console.log('🔍 Phase 3: Reveal phase...');
      const revealResult = await this.executeRevealPhase(commitResult, reasoningResult);
      
      // Phase 4: Verification
      console.log('✅ Phase 4: Verification...');
      const verificationResult = await this.executeVerification(revealResult);
      
      // Phase 5: Quality analysis
      console.log('📊 Phase 5: Quality analysis...');
      const qualityAnalysis = await this.analyzeReasoningQuality(reasoningResult);
      
      const totalTime = Date.now() - startTime;
      
      const result = {
        verificationId,
        success: verificationResult.isValid,
        phases: {
          commit: commitResult,
          reasoning: reasoningResult,
          reveal: revealResult,
          verification: verificationResult
        },
        qualityAnalysis,
        performance: {
          totalTime,
          commitTime: commitResult.executionTime,
          reasoningTime: reasoningResult.executionTime,
          revealTime: revealResult.executionTime,
          verificationTime: verificationResult.executionTime
        },
        timestamp: new Date().toISOString()
      };
      
      console.log(`${result.success ? '✅' : '❌'} Verification completed: ${result.success ? 'VALID' : 'INVALID'}`);
      return result;
      
    } catch (error) {
      return {
        verificationId,
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Execute commit phase of verification
   */
  async executeCommitPhase(reasoningTask) {
    const startTime = Date.now();
    
    // Generate commitment hash
    const reasoningPlan = await this.generateReasoningPlan(reasoningTask);
    const commitment = await this.generateCommitment(reasoningPlan);
    
    // Store commitment on-chain (simulated)
    const commitmentHash = this.calculateHash(commitment);
    await this.storeCommitment(commitmentHash, commitment);
    
    return {
      success: true,
      commitment,
      commitmentHash,
      reasoningPlan,
      executionTime: Date.now() - startTime
    };
  }

  /**
   * Execute reasoning with AI model
   */
  async executeReasoning(reasoningTask, commitResult) {
    const startTime = Date.now();
    
    const modelName = reasoningTask.model || 'gpt-4';
    const modelConfig = this.config.reasoningModels[modelName];
    
    // Execute reasoning according to committed plan
    const reasoningSteps = [];
    let currentStep = reasoningTask.initialState;
    
    for (let i = 0; i < commitResult.reasoningPlan.steps.length; i++) {
      const step = commitResult.reasoningPlan.steps[i];
      
      const stepResult = await this.executeReasoningStep(step, currentStep, modelConfig);
      reasoningSteps.push(stepResult);
      
      currentStep = stepResult.outputState;
      
      // Check if reasoning is consistent with plan
      if (!this.isStepConsistentWithPlan(stepResult, step)) {
        throw new Error(`Reasoning step ${i} inconsistent with committed plan`);
      }
    }
    
    return {
      success: true,
      steps: reasoningSteps,
      finalResult: currentStep,
      model: modelName,
      executionTime: Date.now() - startTime
    };
  }

  /**
   * Execute individual reasoning step
   */
  async executeReasoningStep(step, inputState, modelConfig) {
    const prompt = this.constructReasoningPrompt(step, inputState);
    
    // Call AI model
    const aiResponse = await this.callAIModel(prompt, modelConfig);
    
    // Parse and validate response
    const parsedResponse = this.parseReasoningResponse(aiResponse);
    
    // Apply logic analysis
    const logicAnalysis = await this.logicAnalyzer.analyzeStep(step, parsedResponse);
    
    return {
      step: step.description,
      input: inputState,
      output: parsedResponse.result,
      reasoning: parsedResponse.reasoning,
      confidence: parsedResponse.confidence,
      logicAnalysis,
      outputState: parsedResponse.result
    };
  }

  /**
   * Execute reveal phase
   */
  async executeRevealPhase(commitResult, reasoningResult) {
    const startTime = Date.now();
    
    // Reveal the reasoning plan and compare with execution
    const revealedPlan = commitResult.reasoningPlan;
    const actualExecution = reasoningResult.steps;
    
    // Verify execution matches committed plan
    const planMatch = this.verifyPlanExecution(revealedPlan, actualExecution);
    
    // Calculate verification proofs
    const proofs = await this.generateVerificationProofs(commitResult, reasoningResult);
    
    return {
      success: planMatch,
      revealedPlan,
      executionMatch: planMatch,
      proofs,
      executionTime: Date.now() - startTime
    };
  }

  /**
   * Execute final verification
   */
  async executeVerification(revealResult) {
    const startTime = Date.now();
    
    // Verify cryptographic proofs
    const proofsValid = await this.verifyProofs(revealResult.proofs);
    
    // Verify plan-execution consistency
    const executionValid = revealResult.executionMatch;
    
    // Overall verification result
    const isValid = proofsValid && executionValid;
    
    return {
      isValid,
      proofsValid,
      executionValid,
      verificationProof: isValid ? await this.generateVerificationProof(revealResult) : null,
      executionTime: Date.now() - startTime
    };
  }

  /**
   * Analyze reasoning quality
   */
  async analyzeReasoningQuality(reasoningResult) {
    const analyses = await Promise.all([
      this.logicAnalyzer.analyzeFullReasoning(reasoningResult.steps),
      this.biasDetector.detectBias(reasoningResult.steps),
      this.accuracyTracker.evaluateAccuracy(reasoningResult)
    ]);
    
    return {
      logicConsistency: analyses[0],
      biasAnalysis: analyses[1],
      accuracyAssessment: analyses[2],
      overallQuality: this.calculateOverallQuality(analyses)
    };
  }
}
```

### 2. Commit-Reveal Testing Framework

Test the commit-reveal scheme thoroughly:

```javascript
// src/verification-engine/CommitRevealTester.js
export class CommitRevealTester {
  constructor(config) {
    this.config = config;
    this.testScenarios = [];
    this.testResults = [];
  }

  /**
   * Run comprehensive commit-reveal tests
   */
  async runComprehensiveTests() {
    console.log('🔐 Running commit-reveal comprehensive tests...');
    
    const testSuites = [
      this.testBasicCommitReveal(),
      this.testConcurrentCommits(),
      this.testInvalidReveal(),
      this.testTimeoutScenarios(),
      this.testSecurityVulnerabilities(),
      this.testPerformanceUnderLoad()
    ];
    
    const results = await Promise.all(testSuites);
    
    const summary = {
      totalTests: results.reduce((sum, suite) => sum + suite.testsRun, 0),
      passed: results.reduce((sum, suite) => sum + suite.passed, 0),
      failed: results.reduce((sum, suite) => sum + suite.failed, 0),
      successRate: 0
    };
    
    summary.successRate = (summary.passed / summary.totalTests) * 100;
    
    console.log(`📊 Test Summary: ${summary.passed}/${summary.totalTests} passed (${summary.successRate.toFixed(1)}%)`);
    
    return {
      summary,
      detailedResults: results
    };
  }

  /**
   * Test basic commit-reveal functionality
   */
  async testBasicCommitReveal() {
    console.log('🔹 Testing basic commit-reveal...');
    
    const tests = [];
    
    // Test 1: Simple reasoning commitment
    tests.push(await this.testSimpleCommitment());
    
    // Test 2: Valid reveal after commitment
    tests.push(await this.testValidReveal());
    
    // Test 3: Hash verification
    tests.push(await this.testHashVerification());
    
    // Test 4: Timing constraints
    tests.push(await this.testTimingConstraints());
    
    return this.summarizeTestSuite('Basic Commit-Reveal', tests);
  }

  /**
   * Test concurrent commit scenarios
   */
  async testConcurrentCommits() {
    console.log('🔹 Testing concurrent commits...');
    
    const tests = [];
    
    // Test multiple simultaneous commits
    const concurrentCommits = Array.from({ length: 10 }, (_, i) => 
      this.createTestCommitment(`concurrent-test-${i}`)
    );
    
    const commitResults = await Promise.all(concurrentCommits);
    
    tests.push({
      name: 'Concurrent Commits',
      success: commitResults.every(r => r.success),
      details: `${commitResults.filter(r => r.success).length}/10 commits successful`
    });
    
    // Test concurrent reveals
    const revealPromises = commitResults.map(r => this.revealCommitment(r));
    const revealResults = await Promise.all(revealPromises);
    
    tests.push({
      name: 'Concurrent Reveals',
      success: revealResults.every(r => r.success),
      details: `${revealResults.filter(r => r.success).length}/10 reveals successful`
    });
    
    return this.summarizeTestSuite('Concurrent Operations', tests);
  }

  /**
   * Test security vulnerabilities
   */
  async testSecurityVulnerabilities() {
    console.log('🔹 Testing security vulnerabilities...');
    
    const tests = [];
    
    // Test 1: Attempt to reveal without commit
    tests.push(await this.testRevealWithoutCommit());
    
    // Test 2: Attempt to modify committed value
    tests.push(await this.testCommitmentTampering());
    
    // Test 3: Replay attack prevention
    tests.push(await this.testReplayAttackPrevention());
    
    // Test 4: Hash collision resistance
    tests.push(await this.testHashCollisionResistance());
    
    return this.summarizeTestSuite('Security Tests', tests);
  }

  /**
   * Test performance under load
   */
  async testPerformanceUnderLoad() {
    console.log('🔹 Testing performance under load...');
    
    const loadTests = [
      { name: '10 commits/sec', rate: 10, duration: 30000 },
      { name: '50 commits/sec', rate: 50, duration: 10000 },
      { name: '100 commits/sec', rate: 100, duration: 5000 }
    ];
    
    const results = [];
    
    for (const loadTest of loadTests) {
      const result = await this.runLoadTest(loadTest);
      results.push({
        name: loadTest.name,
        success: result.successRate > 0.95, // 95% success rate required
        details: `Success rate: ${(result.successRate * 100).toFixed(1)}%, Avg latency: ${result.avgLatency}ms`
      });
    }
    
    return this.summarizeTestSuite('Performance Tests', results);
  }

  /**
   * Run load test for commit-reveal performance
   */
  async runLoadTest(testConfig) {
    const { rate, duration } = testConfig;
    const interval = 1000 / rate; // ms between requests
    const totalRequests = Math.floor(duration / interval);
    
    const results = [];
    const startTime = Date.now();
    
    for (let i = 0; i < totalRequests; i++) {
      const requestStart = Date.now();
      
      try {
        const commitment = await this.createTestCommitment(`load-test-${i}`);
        const reveal = await this.revealCommitment(commitment);
        
        results.push({
          success: commitment.success && reveal.success,
          latency: Date.now() - requestStart
        });
        
      } catch (error) {
        results.push({
          success: false,
          error: error.message,
          latency: Date.now() - requestStart
        });
      }
      
      // Wait for next interval
      const elapsed = Date.now() - startTime - (i * interval);
      if (elapsed < interval) {
        await new Promise(resolve => setTimeout(resolve, interval - elapsed));
      }
    }
    
    const successful = results.filter(r => r.success);
    const avgLatency = results.reduce((sum, r) => sum + r.latency, 0) / results.length;
    
    return {
      successRate: successful.length / results.length,
      avgLatency: Math.round(avgLatency),
      totalRequests: results.length,
      successfulRequests: successful.length
    };
  }
}
```

### 3. AI Bias Detection

Monitor AI reasoning for bias and fairness:

```javascript
// src/reasoning-analyzers/BiasDetector.js
export class BiasDetector {
  constructor(config) {
    this.config = config;
    this.biasCategories = config.verification.biasDetection.categories;
    this.threshold = config.verification.biasDetection.threshold;
  }

  /**
   * Detect bias in AI reasoning steps
   */
  async detectBias(reasoningSteps) {
    console.log('🔍 Detecting bias in reasoning...');
    
    const biasAnalysis = {
      overallBiasScore: 0,
      categoryBiases: {},
      biasedSteps: [],
      recommendations: []
    };
    
    // Analyze each bias category
    for (const category of this.biasCategories) {
      const categoryAnalysis = await this.analyzeCategoryBias(reasoningSteps, category);
      biasAnalysis.categoryBiases[category] = categoryAnalysis;
    }
    
    // Calculate overall bias score
    const categoryScores = Object.values(biasAnalysis.categoryBiases)
      .map(analysis => analysis.biasScore);
    biasAnalysis.overallBiasScore = Math.max(...categoryScores);
    
    // Identify biased steps
    biasAnalysis.biasedSteps = this.identifyBiasedSteps(reasoningSteps, biasAnalysis.categoryBiases);
    
    // Generate recommendations
    biasAnalysis.recommendations = this.generateBiasRecommendations(biasAnalysis);
    
    return biasAnalysis;
  }

  /**
   * Analyze bias for specific category
   */
  async analyzeCategoryBias(reasoningSteps, category) {
    const biasIndicators = this.getBiasIndicators(category);
    const stepBiases = [];
    
    for (const step of reasoningSteps) {
      const stepBias = await this.analyzeStepBias(step, biasIndicators);
      stepBiases.push(stepBias);
    }
    
    const maxBias = Math.max(...stepBiases.map(sb => sb.score));
    const avgBias = stepBiases.reduce((sum, sb) => sum + sb.score, 0) / stepBiases.length;
    
    return {
      category,
      biasScore: maxBias,
      averageBias: avgBias,
      stepBiases,
      isProblematic: maxBias > this.threshold
    };
  }
}
```

## 📊 GitHub Actions Workflow

```yaml
# templates/github-actions/solprism-verification.yml
name: SOLPRISM Verification

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  NODE_VERSION: '18'

jobs:
  # Reasoning verification tests
  verify-reasoning:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
      
      - name: Install dependencies
        run: |
          cd verification
          npm install
      
      - name: Test reasoning verification
        run: |
          cd verification
          npm run verify:reasoning
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
      
      - name: Test commit-reveal scheme
        run: |
          cd verification
          npm run verify:commit-reveal
      
      - name: Analyze bias detection
        run: |
          cd verification
          npm run analyze:bias
      
      - name: Generate verification report
        run: |
          cd verification
          npm run report:verification
      
      - name: Upload verification results
        uses: actions/upload-artifact@v3
        with:
          name: verification-results
          path: verification/reports/

  # Performance testing
  performance-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
      
      - name: Install dependencies
        run: |
          cd verification
          npm install
      
      - name: Run performance tests
        run: |
          cd verification
          npm run test:performance
      
      - name: Load testing
        run: |
          cd verification
          npm run test:load
```

## 🚀 Business Value

### For SOLPRISM Team
- ✅ **Verification Reliability** - Comprehensive testing of reasoning verification
- ✅ **Quality Assurance** - Automated bias detection and quality monitoring
- ✅ **Performance Optimization** - Load testing and performance analysis
- ✅ **Security Validation** - Thorough testing of commit-reveal schemes
- ✅ **Development Acceleration** - Automated testing infrastructure

### For DevEx Platform
- 🧠 **AI Verification Expertise** - Unique capability for AI reasoning validation
- 🔬 **Advanced Testing** - Sophisticated verification testing framework
- 🎯 **Innovation Showcase** - Cutting-edge AI verification integration
- 🤝 **Research Collaboration** - Supporting advanced AI research project

## 📞 Next Steps

### Immediate Actions (Today)
1. **Copy this verification integration** to your SOLPRISM project
2. **Configure AI models** - set up API keys and model configurations
3. **Run first verification tests** - see reasoning verification in action
4. **Analyze bias detection** - understand AI reasoning quality

### Advanced Integration (This Week)
1. **Custom reasoning tests** - develop domain-specific verification tests
2. **Performance optimization** - tune verification system performance
3. **Advanced bias detection** - enhance bias detection capabilities
4. **Community showcase** - demonstrate verifiable AI reasoning

---

**Ready to verify AI reasoning like never before? Start comprehensive verification in 10 minutes!**

```bash
cd /path/to/solprism
git clone <devex-platform-repo>
cp -r devex-platform/integration-examples/solprism-verification ./
cd solprism-verification && npm install && node setup.js
```