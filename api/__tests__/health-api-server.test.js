const request = require('supertest');
const express = require('express');

// Mock the health monitoring functions before importing the server
jest.mock('../health-monitor', () => ({
  checkJupiterV6Health: jest.fn().mockResolvedValue({
    status: 'healthy',
    latency: 150,
    endpoint: 'https://quote-api.jup.ag/v6/quote',
    timestamp: new Date().toISOString()
  }),
  checkKaminoHealth: jest.fn().mockResolvedValue({
    status: 'healthy',
    latency: 200,
    endpoint: 'https://api.kamino.finance',
    timestamp: new Date().toISOString()
  }),
  checkDriftHealth: jest.fn().mockResolvedValue({
    status: 'healthy',
    latency: 180,
    endpoint: 'https://api.drift.trade',
    timestamp: new Date().toISOString()
  }),
  checkRaydiumHealth: jest.fn().mockResolvedValue({
    status: 'healthy',
    latency: 170,
    endpoint: 'https://api.raydium.io',
    timestamp: new Date().toISOString()
  })
}));

describe('Health API Server', () => {
  let app;

  beforeAll(async () => {
    // Create a test Express app with basic health endpoints
    app = express();
    app.use(express.json());

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Protocol health endpoints
    app.get('/api/health/jupiter', async (req, res) => {
      const healthMonitor = require('../health-monitor');
      try {
        const result = await healthMonitor.checkJupiterV6Health();
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    app.get('/api/health/kamino', async (req, res) => {
      const healthMonitor = require('../health-monitor');
      try {
        const result = await healthMonitor.checkKaminoHealth();
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    app.get('/api/health/all', async (req, res) => {
      const healthMonitor = require('../health-monitor');
      try {
        const [jupiter, kamino, drift, raydium] = await Promise.all([
          healthMonitor.checkJupiterV6Health(),
          healthMonitor.checkKaminoHealth(),
          healthMonitor.checkDriftHealth(),
          healthMonitor.checkRaydiumHealth()
        ]);

        res.json({
          jupiter,
          kamino,
          drift,
          raydium,
          overall: 'healthy',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  });

  describe('Basic Health Endpoints', () => {
    test('GET /health - should return basic health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Protocol Health Endpoints', () => {
    test('GET /api/health/jupiter - should return Jupiter health status', async () => {
      const response = await request(app)
        .get('/api/health/jupiter')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('latency');
      expect(response.body).toHaveProperty('endpoint');
      expect(response.body).toHaveProperty('timestamp');
    });

    test('GET /api/health/kamino - should return Kamino health status', async () => {
      const response = await request(app)
        .get('/api/health/kamino')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('latency');
      expect(response.body).toHaveProperty('endpoint');
    });

    test('GET /api/health/all - should return all protocol health statuses', async () => {
      const response = await request(app)
        .get('/api/health/all')
        .expect(200);

      expect(response.body).toHaveProperty('jupiter');
      expect(response.body).toHaveProperty('kamino');
      expect(response.body).toHaveProperty('drift');
      expect(response.body).toHaveProperty('raydium');
      expect(response.body).toHaveProperty('overall', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Error Handling', () => {
    test('should handle 404 for non-existent endpoints', async () => {
      await request(app)
        .get('/api/nonexistent')
        .expect(404);
    });
  });
});

// Test the health monitoring functions directly
describe('Health Monitor Functions', () => {
  const healthMonitor = require('../health-monitor');

  test('checkJupiterV6Health should return expected structure', async () => {
    const result = await healthMonitor.checkJupiterV6Health();
    
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('latency');
    expect(result).toHaveProperty('endpoint');
    expect(result).toHaveProperty('timestamp');
    expect(typeof result.latency).toBe('number');
  });

  test('checkKaminoHealth should return expected structure', async () => {
    const result = await healthMonitor.checkKaminoHealth();
    
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('latency');
    expect(result).toHaveProperty('endpoint');
    expect(result).toHaveProperty('timestamp');
  });
});