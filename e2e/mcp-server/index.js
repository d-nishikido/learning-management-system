const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Test data endpoints
app.post('/test-data', (req, res) => {
  const { entity, action, data } = req.body;
  console.log(`MCP: ${action} ${entity}`, data);
  
  // Mock response for test data creation
  res.json({ 
    success: true, 
    entity, 
    action, 
    id: Math.floor(Math.random() * 1000),
    data 
  });
});

app.post('/test-data/reset', (req, res) => {
  console.log('MCP: Resetting all test data');
  res.json({ success: true, message: 'Test data reset' });
});

app.get('/test-data/state', (req, res) => {
  res.json({ 
    state: 'initialized',
    users: 3,
    courses: 2,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`MCP Server running on port ${PORT}`);
});

module.exports = app;