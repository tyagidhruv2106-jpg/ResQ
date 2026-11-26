const { Pool } = require('pg');
const config = require('../config');

// Singleton connection pool instance
let pool = null;

function getPool() {
  if (!pool) {
    pool = new Pool({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.database,
      max: config.database.maxPoolSize,
      idleTimeoutMillis: config.database.idleTimeoutMillis,
      connectionTimeoutMillis: config.database.connectionTimeoutMillis,
    });

    pool.on('error', (err) => {
      console.error('[DB Pool] Unexpected error on idle client:', err.message);
    });
  }
  return pool;
}

/**
 * Execute parameterized SQL query
 * @param {string} text - SQL statement
 * @param {Array} params - Query parameters
 */
async function query(text, params = []) {
  const start = Date.now();
  const client = getPool();
  try {
    const res = await client.query(text, params);
    const duration = Date.now() - start;
    if (config.nodeEnv === 'development' && duration > 100) {
      console.log(`[DB Query slow] ${duration}ms: ${text.slice(0, 80)}...`);
    }
    return res;
  } catch (error) {
    console.error(`[DB Query Error]: ${error.message} | Query: ${text.slice(0, 100)}`);
    throw error;
  }
}

/**
 * Health check verification for PostgreSQL + PostGIS
 */
async function testConnection() {
  try {
    const result = await query('SELECT PostGIS_Version() AS postgis, current_database() AS db;');
    return {
      connected: true,
      database: result.rows[0].db,
      postgis: result.rows[0].postgis,
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message,
    };
  }
}

/**
 * Close connection pool during graceful shutdown
 */
async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('[DB Pool] Connection pool closed.');
  }
}

module.exports = {
  getPool,
  query,
  testConnection,
  closePool,
};
