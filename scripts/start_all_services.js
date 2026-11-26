/**
 * ResQ All-in-One Services Launcher
 * Starts Report Service, Organization Service, Notification Service, and API Gateway.
 */

const { fork } = require('child_process');
const path = require('path');

const services = [
  { name: 'Auth Service', script: path.join(__dirname, '../services/auth-service/src/index.js'), port: 8001 },
  { name: 'Report Service', script: path.join(__dirname, '../services/report-service/src/index.js'), port: 8002 },
  { name: 'Organization Service', script: path.join(__dirname, '../services/organization-service/src/index.js'), port: 8003 },
  { name: 'Notification Service', script: path.join(__dirname, '../services/notification-service/src/index.js'), port: 8005 },
  { name: 'API Gateway', script: path.join(__dirname, '../services/api-gateway/src/index.js'), port: 8000 },
];

const children = [];

console.log('====================================================');
console.log('🚀 Starting ResQ Microservices Ecosystem...');
console.log('====================================================');

services.forEach((svc) => {
  const child = fork(svc.script, [], {
    stdio: 'inherit',
    env: { ...process.env },
  });

  child.on('exit', (code, signal) => {
    console.log(`[Launcher] Service '${svc.name}' exited (code: ${code}, signal: ${signal})`);
  });

  children.push(child);
});

// Handle termination signals
function shutdown() {
  console.log('\n[Launcher] Stopping all services...');
  children.forEach((child) => {
    try {
      child.kill('SIGTERM');
    } catch (e) {}
  });
  setTimeout(() => process.exit(0), 1000);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
