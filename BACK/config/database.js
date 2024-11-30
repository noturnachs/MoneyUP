const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false, // Required for some hosted PostgreSQL services
  },
  // Additional PostgreSQL specific options
  max: 10, // Max number of clients in the pool
  idleTimeoutMillis: 30000,
});

// Export execute function to maintain compatibility with existing code
module.exports = {
  execute: (text, params) => pool.query(text, params),
  getConnection: () => pool.connect(),
  pool,
};
