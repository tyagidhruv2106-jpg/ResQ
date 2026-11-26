const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from root .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database configuration (PostgreSQL + PostGIS)
  database: {
    connectionString: process.env.DATABASE_URL || null,
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
    user: process.env.POSTGRES_USER || 'resq_user',
    password: process.env.POSTGRES_PASSWORD || 'resq_dev_password',
    database: process.env.POSTGRES_DB || 'resq_db',
    ssl: process.env.NODE_ENV === 'production' || (process.env.DATABASE_URL && process.env.DB_SSL !== 'false')
      ? { rejectUnauthorized: false }
      : false,
    maxPoolSize: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  },

  // RabbitMQ configuration
  rabbitmq: {
    host: process.env.RABBITMQ_HOST || 'localhost',
    port: parseInt(process.env.RABBITMQ_PORT, 10) || 5672,
    user: process.env.RABBITMQ_USER || 'resq_rabbit',
    password: process.env.RABBITMQ_PASS || 'resq_rabbit_dev_password',
    exchange: 'resq.events',
    exchangeType: 'topic',
    get url() {
      return process.env.RABBITMQ_URL || `amqp://${this.user}:${this.password}@${this.host}:${this.port}`;
    }
  },

  // JWT Authentication
  jwt: {
    secret: process.env.JWT_SECRET || 'changeme_in_production_32char_min',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  // Service Ports
  ports: {
    gateway: parseInt(process.env.PORT || process.env.GATEWAY_PORT, 10) || 8000,
    auth: parseInt(process.env.AUTH_PORT, 10) || 8001,
    reports: parseInt(process.env.REPORT_PORT, 10) || 8002,
    organizations: parseInt(process.env.ORG_PORT, 10) || 8003,
    matching: parseInt(process.env.MATCHING_PORT, 10) || 8004,
    notifications: parseInt(process.env.NOTIFICATION_PORT, 10) || 8005,
    tracking: parseInt(process.env.TRACKING_PORT, 10) || 8006,
  }
};

module.exports = config;
