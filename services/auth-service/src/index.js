const express = require('express');
const cors = require('cors');
const { config, errorHandler, db } = require('../../../shared');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = config.ports.auth;

// Middleware
app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[Auth Service] ${new Date().toISOString()} [${req.method}] ${req.url}`);
  next();
});

// Health check
app.get('/health', async (req, res) => {
  const dbStatus = await db.testConnection();
  res.json({
    service: 'auth-service',
    status: 'healthy',
    port: PORT,
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

// Auth API routes
app.use('/api/v1/auth', authRoutes);

// 404 fallback
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    statusCode: 404,
    message: `Route '${req.originalUrl}' not found on Auth Service.`,
    timestamp: new Date().toISOString(),
  });
});

// Centralized error handler
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  console.log('=======================================================');
  console.log(`🔐 ResQ Auth Service running on port ${PORT}`);
  console.log(`👉 Base URL: http://localhost:${PORT}/api/v1/auth`);
  console.log(`   - POST /         → Register`);
  console.log(`   - POST /login    → Login`);
  console.log(`   - GET  /me       → Get current user`);
  console.log('=======================================================');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Auth Service] SIGTERM received. Shutting down...');
  server.close(() => process.exit(0));
});

module.exports = app;
