/**
 * Run this once to create the users table.
 * Usage:  node src/db/migrate.js
 */
const pool = require('./index');

const sql = `
  CREATE TABLE IF NOT EXISTS users (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(100)        NOT NULL,
    email      VARCHAR(255) UNIQUE NOT NULL,
    password   VARCHAR(255)        NOT NULL,
    role       VARCHAR(20)         NOT NULL DEFAULT 'member',  -- 'admin' | 'member'
    created_at TIMESTAMPTZ         NOT NULL DEFAULT NOW()
  );
`;

(async () => {
  try {
    await pool.query(sql);
    console.log('✅  users table ready');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await pool.end();
  }
})();
