/**
 * Consolidated Solana DevEx Platform API
 * Combines all functionality into single endpoint to stay under Vercel function limits
 */

const express = require('express');
const cors = require('cors');
const { Server } = require('ws');
const http = require('http');

// Import consolidated server functionality
const setupMainRoutes = require('./server');
const setupFunctionalRoutes = require('./server-functional');
const setupRealTimeRoutes = require('./real-time-server');

const app = express();

// CORS configuration for cross-origin requests
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://solana-devex-platform.vercel.app', 'https://solana-devex-platform-git-master-tjb-projects.vercel.app']
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// For Vercel serverless deployment, export the Express app
module.exports = app;

// For local development, start the server
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  
  const server = http.createServer(app);
  
  // WebSocket server for real-time features
  const wss = new Server({ server });
  
  wss.on('connection', (ws) => {
    console.log('WebSocket connection established');
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        // Handle WebSocket messages
        ws.send(JSON.stringify({ 
          type: 'response', 
          data: 'Message received' 
        }));
      } catch (error) {
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'Invalid message format' 
        }));
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });
  });
  
  server.listen(PORT, () => {
    console.log(`Solana DevEx Platform API running on port ${PORT}`);
  });
}