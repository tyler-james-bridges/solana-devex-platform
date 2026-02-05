/**
 * Pyxis Oracle Safety Integration API Endpoints
 * Handles Oracle node validation and Safety Certificate management
 */

const { Connection } = require('@solana/web3.js');
const { PyxisOracleValidator } = require('../integrations/pyxis-oracle-safety/oracle-validator.ts');

// Initialize validator with Solana connection
const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com');
const oracleValidator = new PyxisOracleValidator(connection);

// In-memory certificate storage (in production, use a database)
const certificateStore = new Map();
const healthStore = new Map();

/**
 * POST /api/pyxis/validate
 * Submit Oracle logic for validation and certificate generation
 */
async function validateOracleNode(req, res) {
  try {
    const validationRequest = req.body;
    
    // Validate request format
    if (!validationRequest.nodeId || !validationRequest.oracleLogic) {
      return res.status(400).json({
        error: 'Missing required fields: nodeId, oracleLogic'
      });
    }

    console.log(`Starting validation for Oracle node: ${validationRequest.nodeId}`);
    
    // Run comprehensive validation suite
    const certificate = await oracleValidator.validateOracleNode(validationRequest);
    
    // Store certificate for retrieval
    certificateStore.set(validationRequest.nodeId, certificate);
    
    // Initialize health monitoring
    healthStore.set(validationRequest.nodeId, {
      status: 'healthy',
      lastCheck: new Date().toISOString(),
      uptime: 0,
      queriesProcessed: 0
    });

    res.json({
      success: true,
      certificate,
      message: `Oracle node ${validationRequest.nodeId} successfully validated`,
      nextSteps: [
        'Certificate valid for 7 days',
        'P2P swarm can verify certificate before allowing node joins',
        'Monitor node health via /api/pyxis/health/:nodeId'
      ]
    });

  } catch (error) {
    console.error('Oracle validation failed:', error);
    res.status(500).json({
      error: 'Validation failed',
      message: error.message
    });
  }
}

/**
 * GET /api/pyxis/certificate/:nodeId
 * Retrieve Safety Certificate for a specific node
 */
async function getCertificate(req, res) {
  try {
    const { nodeId } = req.params;
    const certificate = certificateStore.get(nodeId);

    if (!certificate) {
      return res.status(404).json({
        error: 'Certificate not found',
        message: `No certificate found for node: ${nodeId}`
      });
    }

    // Check if certificate has expired
    const expiresAt = new Date(certificate.certificate.expiresAt);
    const isExpired = expiresAt < new Date();

    res.json({
      certificate,
      status: isExpired ? 'expired' : 'valid',
      expiresAt: certificate.certificate.expiresAt
    });

  } catch (error) {
    console.error('Certificate retrieval failed:', error);
    res.status(500).json({
      error: 'Failed to retrieve certificate',
      message: error.message
    });
  }
}

/**
 * POST /api/pyxis/verify
 * Verify a Safety Certificate signature and validity
 */
async function verifyCertificate(req, res) {
  try {
    const { certificate } = req.body;

    if (!certificate) {
      return res.status(400).json({
        error: 'Missing certificate in request body'
      });
    }

    // Verify signature
    const signatureValid = PyxisOracleValidator.verifyCertificate(certificate);
    
    // Check expiration
    const expiresAt = new Date(certificate.certificate.expiresAt);
    const isExpired = expiresAt < new Date();
    
    // Check minimum safety requirements
    const riskScore = certificate.certificate.riskScore;
    const testsPassed = certificate.certificate.testsPassed;
    const meetsMinimumSafety = riskScore < 0.3 && testsPassed >= 30;

    const isValid = signatureValid && !isExpired && meetsMinimumSafety;

    res.json({
      valid: isValid,
      checks: {
        signatureValid,
        expired: isExpired,
        meetsMinimumSafety,
        riskScore,
        testsPassed
      },
      message: isValid 
        ? 'Certificate is valid and safe for P2P swarm joining'
        : 'Certificate validation failed - node should not join swarm'
    });

  } catch (error) {
    console.error('Certificate verification failed:', error);
    res.status(500).json({
      error: 'Verification failed',
      message: error.message
    });
  }
}

/**
 * GET /api/pyxis/health/:nodeId
 * Get runtime health status for Oracle node
 */
async function getNodeHealth(req, res) {
  try {
    const { nodeId } = req.params;
    const health = healthStore.get(nodeId);

    if (!health) {
      return res.status(404).json({
        error: 'Health data not found',
        message: `No health data found for node: ${nodeId}`
      });
    }

    // Simulate health check updates (in production, this would come from monitoring)
    health.lastCheck = new Date().toISOString();
    health.uptime += 1;
    health.queriesProcessed += Math.floor(Math.random() * 10);

    res.json({
      nodeId,
      health,
      status: health.status === 'healthy' ? 'operational' : 'degraded'
    });

  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      error: 'Health check failed',
      message: error.message
    });
  }
}

/**
 * POST /api/pyxis/health/:nodeId
 * Update runtime health status (called by monitoring systems)
 */
async function updateNodeHealth(req, res) {
  try {
    const { nodeId } = req.params;
    const { status, metrics } = req.body;

    const existingHealth = healthStore.get(nodeId);
    if (!existingHealth) {
      return res.status(404).json({
        error: 'Node not found',
        message: `Node ${nodeId} not registered for health monitoring`
      });
    }

    // Update health data
    const updatedHealth = {
      ...existingHealth,
      status: status || existingHealth.status,
      lastCheck: new Date().toISOString(),
      ...metrics
    };

    healthStore.set(nodeId, updatedHealth);

    res.json({
      success: true,
      nodeId,
      health: updatedHealth,
      message: 'Health status updated successfully'
    });

  } catch (error) {
    console.error('Health update failed:', error);
    res.status(500).json({
      error: 'Health update failed',
      message: error.message
    });
  }
}

/**
 * GET /api/pyxis/stats
 * Get overall statistics about Oracle validation
 */
async function getValidationStats(req, res) {
  try {
    const totalNodes = certificateStore.size;
    const healthyNodes = Array.from(healthStore.values()).filter(h => h.status === 'healthy').length;
    
    let totalTestsPassed = 0;
    let totalRiskScore = 0;
    let validCertificates = 0;

    for (const certificate of certificateStore.values()) {
      const expiresAt = new Date(certificate.certificate.expiresAt);
      const isValid = expiresAt > new Date();
      
      if (isValid) {
        validCertificates++;
        totalTestsPassed += certificate.certificate.testsPassed;
        totalRiskScore += certificate.certificate.riskScore;
      }
    }

    const averageTestsPassed = validCertificates > 0 ? totalTestsPassed / validCertificates : 0;
    const averageRiskScore = validCertificates > 0 ? totalRiskScore / validCertificates : 0;

    res.json({
      totalNodes,
      validCertificates,
      healthyNodes,
      averageTestsPassed: Math.round(averageTestsPassed),
      averageRiskScore: Math.round(averageRiskScore * 100) / 100,
      systemHealth: healthyNodes / totalNodes * 100,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Stats generation failed:', error);
    res.status(500).json({
      error: 'Failed to generate stats',
      message: error.message
    });
  }
}

module.exports = {
  validateOracleNode,
  getCertificate,
  verifyCertificate,
  getNodeHealth,
  updateNodeHealth,
  getValidationStats
};