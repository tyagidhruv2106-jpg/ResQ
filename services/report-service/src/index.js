const express = require('express');
const cors = require('cors');
const { config, errorHandler, db, messaging } = require('../../../shared');
const reportRoutes = require('./routes/reports');

const app = express();
const PORT = config.ports.reports;

app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[Report Service] [${req.method}] ${req.url}`);
  next();
});

// Health check
app.get('/health', async (req, res) => {
  const dbHealth = await db.testConnection();
  res.json({
    service: 'report-service',
    status: 'healthy',
    port: PORT,
    database: dbHealth,
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/v1/reports', reportRoutes);

// Centralized error handler
app.use(errorHandler);

// Start server
const server = app.listen(PORT, async () => {
  console.log(`===============================================`);
  console.log(`🚀 ResQ Report Service running on port ${PORT}`);
  console.log(`📡 Endpoints: POST /api/v1/reports, GET /api/v1/reports`);
  console.log(`===============================================`);
  
  // Eagerly connect RabbitMQ
  try {
    await messaging.getChannel();
  } catch (err) {
    console.warn(`[Report Service] RabbitMQ startup notice: ${err.message}`);
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Report Service] SIGTERM received. Shutting down gracefully...');
  server.close(async () => {
    await db.closePool();
    await messaging.closeConnection();
    process.exit(0);
  });
});

module.exports = app;
