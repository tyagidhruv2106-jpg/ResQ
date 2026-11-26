const express = require('express');
const cors = require('cors');
const { config, errorHandler, db } = require('../../../shared');
const orgRoutes = require('./routes/organizations');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = config.ports.organizations;

app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[Organization Service] [${req.method}] ${req.url}`);
  next();
});

// Health check
app.get('/health', async (req, res) => {
  const dbHealth = await db.testConnection();
  res.json({
    service: 'organization-service',
    status: 'healthy',
    port: PORT,
    database: dbHealth,
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/v1/organizations', orgRoutes);
app.use('/api/v1/admin', adminRoutes);

// Centralized error handler
app.use(errorHandler);

// Start server
const server = app.listen(PORT, async () => {
  console.log(`===============================================`);
  console.log(`🏢 ResQ Organization Service running on port ${PORT}`);
  console.log(`📡 Endpoints: POST /api/v1/organizations, GET /api/v1/organizations`);
  console.log(`📡 Admin:     GET /api/v1/admin/stats, /users, /reports`);
  console.log(`===============================================`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Organization Service] SIGTERM received. Shutting down gracefully...');
  server.close(async () => {
    await db.closePool();
    process.exit(0);
  });
});

module.exports = app;

