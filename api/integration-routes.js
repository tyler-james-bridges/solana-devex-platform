/**
 * Integration API Routes
 * Handles routing for Pyxis Oracle Safety and Sipher Privacy integrations
 */

const express = require('express');
const router = express.Router();

// Import integration handlers
const pyxisIntegration = require('./pyxis-integration');
const sipherIntegration = require('./sipher-integration');

// Pyxis Oracle Safety Integration Routes
router.post('/pyxis/validate', pyxisIntegration.validateOracleNode);
router.get('/pyxis/certificate/:nodeId', pyxisIntegration.getCertificate);
router.post('/pyxis/verify', pyxisIntegration.verifyCertificate);
router.get('/pyxis/health/:nodeId', pyxisIntegration.getNodeHealth);
router.post('/pyxis/health/:nodeId', pyxisIntegration.updateNodeHealth);
router.get('/pyxis/stats', pyxisIntegration.getValidationStats);

// Sipher Privacy Layer Integration Routes
router.post('/sipher/deploy-shield', sipherIntegration.deployWithShield);
router.post('/sipher/fund-shield', sipherIntegration.shieldTestFunding);
router.post('/sipher/treasury-shield', sipherIntegration.shieldTreasuryOperations);
router.get('/sipher/privacy-status/:txId', sipherIntegration.getPrivacyStatus);
router.post('/sipher/batch-shield', sipherIntegration.batchShieldOperations);
router.get('/sipher/privacy-metrics', sipherIntegration.getPrivacyMetrics);

// Combined integration status endpoint
router.get('/status', async (req, res) => {
  try {
    res.json({
      integrations: {
        pyxis: {
          name: 'Pyxis Oracle Safety Pipeline',
          status: 'active',
          description: 'Safety certificates for Oracle nodes before P2P swarm joining',
          endpoints: [
            'POST /api/pyxis/validate',
            'GET /api/pyxis/certificate/:nodeId',
            'POST /api/pyxis/verify',
            'GET /api/pyxis/health/:nodeId',
            'GET /api/pyxis/stats'
          ]
        },
        sipher: {
          name: 'Sipher Privacy Layer',
          status: 'active',
          description: 'Privacy protection for autonomous deployments and treasury operations',
          endpoints: [
            'POST /api/sipher/deploy-shield',
            'POST /api/sipher/fund-shield', 
            'POST /api/sipher/treasury-shield',
            'GET /api/sipher/privacy-status/:txId',
            'POST /api/sipher/batch-shield',
            'GET /api/sipher/privacy-metrics'
          ]
        }
      },
      partnerships: {
        aceStrategist: {
          project: 'Pyxis Oracle',
          integration: 'Safety Certificate Pipeline',
          status: 'implementation_ready',
          benefits: 'Higher quality Oracle nodes, reduced rug risk'
        },
        sipher: {
          project: 'Sipher Privacy Protocol',
          integration: 'Privacy Layer for Autonomous Operations',
          status: 'implementation_ready',
          benefits: 'Front-running protection, MEV resistance, competitive advantage'
        },
        moltdev: {
          project: 'Framework-kit Integration',
          integration: 'Unified DevEx Layer',
          status: 'ongoing',
          benefits: 'Simplified Solana development, reduced complexity'
        }
      },
      platform: {
        name: 'Solana DevEx Platform',
        version: '1.0.0',
        url: 'https://onchain-devex.tools',
        repository: 'https://github.com/tyler-james-bridges/solana-devex-platform',
        status: 'production'
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Integration status failed',
      message: error.message
    });
  }
});

module.exports = router;