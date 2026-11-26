
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { config, errorHandler, response } = require('../../../shared');
const { errorResponse } = response;

const app = express();
const PORT = config.ports.gateway;

// Enable CORS for frontend clients / testing
app.use(cors());

// Request logger
app.use((req, res, next) => {
  console.log(
    `[API Gateway] ${new Date().toISOString()} [${req.method}] ${req.url}`
  );
  next();
});

// Gateway System Health & Service Registry Check
app.get('/health', (req, res) => {
  res.json({
    service: 'api-gateway',
    status: 'healthy',
    port: PORT,
    routes: {
      auth: `http://localhost:${config.ports.auth}/api/v1/auth`,
      reports: `http://localhost:${config.ports.reports}/api/v1/reports`,
      organizations: `http://localhost:${config.ports.organizations}/api/v1/organizations`,
      notifications: `http://localhost:${config.ports.notifications}/api/v1/notifications`,
      admin: `http://localhost:${config.ports.organizations}/api/v1/admin`,
    },
    timestamp: new Date().toISOString(),
  });
});

// Proxy Error Handler
const onProxyError = (err, req, res) => {
  console.error(
    `[API Gateway Proxy Error] [${req.method}] ${req.url} -> Downstream service unavailable:`,
    err.message
  );

  if (!res.headersSent) {
    return errorResponse(
      res,
      `Downstream service unavailable: ${err.message}`,
      503
    );
  }
};

// 0. Auth Service Proxy
app.use(
  createProxyMiddleware({
    target: `http://localhost:${config.ports.auth}`,
    changeOrigin: true,
    pathFilter: '/api/v1/auth',
    on: {
      error: onProxyError,
    },
  })
);

// 1. Report Service Proxy
app.use(
  createProxyMiddleware({
    target: `http://localhost:${config.ports.reports}`,
    changeOrigin: true,
    pathFilter: '/api/v1/reports',
    on: {
      error: onProxyError,
    },
  })
);

// 2. Organization Service Proxy
app.use(
  createProxyMiddleware({
    target: `http://localhost:${config.ports.organizations}`,
    changeOrigin: true,
    pathFilter: '/api/v1/organizations',
    on: {
      error: onProxyError,
    },
  })
);

// 3. Notification Service Proxy
app.use(
  createProxyMiddleware({
    target: `http://localhost:${config.ports.notifications}`,
    changeOrigin: true,
    pathFilter: '/api/v1/notifications',
    on: {
      error: onProxyError,
    },
  })
);

// 4. Admin Proxy (hosted on Organization Service)
app.use(
  createProxyMiddleware({
    target: `http://localhost:${config.ports.organizations}`,
    changeOrigin: true,
    pathFilter: '/api/v1/admin',
    on: {
      error: onProxyError,
    },
  })
);

// Fallback 404 handler
app.use((req, res) => {
  return errorResponse(
    res,
    `Route '${req.originalUrl}' not found on API Gateway.`,
    404
  );
});

// Centralized error handler
app.use(errorHandler);

// Start Gateway
const server = app.listen(PORT, () => {
  console.log('=======================================================');
  console.log(`🌐 ResQ API Gateway running on port ${PORT}`);
  console.log(`👉 Ingress URL: http://localhost:${PORT}`);
  console.log(`   - Auth:           http://localhost:${PORT}/api/v1/auth`);
  console.log(`   - Reports:        http://localhost:${PORT}/api/v1/reports`);
  console.log(`   - Organizations:  http://localhost:${PORT}/api/v1/organizations`);
  console.log(`   - Notifications:  http://localhost:${PORT}/api/v1/notifications`);
  console.log(`   - Admin:          http://localhost:${PORT}/api/v1/admin`);
  console.log('=======================================================');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[API Gateway] SIGTERM received. Closing Gateway server...');
  server.close(() => process.exit(0));
});

module.exports = app;
