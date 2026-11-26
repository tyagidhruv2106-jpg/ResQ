const express = require('express');
const cors = require('cors');
const { errorHandler, db } = require('../shared');

const authRoutes = require('../services/auth-service/src/routes/auth');
const reportRoutes = require('../services/report-service/src/routes/reports');
const orgRoutes = require('../services/organization-service/src/routes/organizations');
const adminRoutes = require('../services/organization-service/src/routes/admin');
const notificationRoutes = require('../services/notification-service/src/routes/notifications');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', async (req, res) => {
  const dbHealth = await db.testConnection();
  res.json({
    service: 'resq-vercel-api',
    status: dbHealth.connected ? 'healthy' : 'degraded',
    database: dbHealth,
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/organizations', orgRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/notifications', notificationRoutes);

app.use(errorHandler);

module.exports = app;
