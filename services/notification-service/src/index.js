const express = require('express');
const cors = require('cors');
const { config, errorHandler, db, messaging } = require('../../../shared');
const notificationRoutes = require('./routes/notifications');
const { startNotificationConsumer } = require('./consumer');

const app = express();
const PORT = config.ports.notifications;

app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[Notification Service] [${req.method}] ${req.url}`);
  next();
});

// Health check
app.get('/health', async (req, res) => {
  const dbHealth = await db.testConnection();
  res.json({
    service: 'notification-service',
    status: 'healthy',
    port: PORT,
    database: dbHealth,
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/v1/notifications', notificationRoutes);

// Centralized error handler
app.use(errorHandler);

// Start server and RabbitMQ consumer
const server = app.listen(PORT, async () => {
  console.log(`===============================================`);
  console.log(`🔔 ResQ Notification Service running on port ${PORT}`);
  console.log(`📡 Endpoints: GET /api/v1/notifications, PATCH /api/v1/notifications/:id/read`);
  console.log(`===============================================`);

  // Start RabbitMQ background consumer
  try {
    await startNotificationConsumer();
  } catch (err) {
    console.error(`[Notification Service] Could not start RabbitMQ consumer:`, err.message);
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Notification Service] SIGTERM received. Shutting down gracefully...');
  server.close(async () => {
    await db.closePool();
    await messaging.closeConnection();
    process.exit(0);
  });
});

module.exports = app;
