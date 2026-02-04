// Simple test server to verify functionality
const express = require('express');
const app = express();
const port = 3002;

app.use(express.json());

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Test route working!' });
});

// Quick setup route
app.post('/api/integrate/quick-setup', (req, res) => {
  const { projectName, template = 'basic-solana' } = req.body;
  
  if (!projectName) {
    return res.status(400).json({ error: 'Project name is required' });
  }

  const projectId = require('crypto').randomUUID();
  const apiKey = require('crypto').randomUUID();

  res.json({
    success: true,
    projectId,
    apiKey,
    message: 'Integration created successfully!',
    quickStartGuide: {
      steps: [
        'Install SDK: npm install @solana-devex/integration-sdk',
        `Initialize: const client = new SolanaDevExClient({ projectId: '${projectId}', apiKey: '${apiKey}' })`,
        'Start coding!'
      ]
    }
  });
});

// Templates route
app.get('/api/integrate/templates', (req, res) => {
  res.json({
    templates: [
      { id: 'basic-solana', name: 'Basic Solana', setupTime: '2-3 min' },
      { id: 'nft-platform', name: 'NFT Platform', setupTime: '3-4 min' },
      { id: 'trading-bot', name: 'Trading Bot', setupTime: '4-5 min' }
    ]
  });
});

app.listen(port, () => {
  console.log(`🚀 Simple test server running on port ${port}`);
  console.log(`Test: http://localhost:${port}/test`);
  console.log(`Quick setup: POST http://localhost:${port}/api/integrate/quick-setup`);
});