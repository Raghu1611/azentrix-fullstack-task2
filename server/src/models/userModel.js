const pool = require('../db');

/**
 * Create a new user row.
 * @param {{ name: string, email: string, password: string, role?: string }} data
 * @returns {Promise<object>} created user (no password field)
 */
async function createUser({ name, email, password, role = 'member' }) {
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role, created_at`,
    [name, email, password, role]
  );
  return rows[0];
}

/**
 * Find a user by email (includes hashed password for auth check).
 * @param {string} email
 * @returns {Promise<object|null>}
 */
async function findUserByEmail(email) {
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return rows[0] || null;
}

/**
 * Find a user by primary key (omits password).
 * @param {number} id
 * @returns {Promise<object|null>}
 */
async function findUserById(id) {
  const { rows } = await pool.query(
    'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
    [id]
  );
  return rows[0] || null;
}

/**
 * Return all users (admin use). Omits passwords.
 * @returns {Promise<object[]>}
 */
async function getAllUsers() {
  const { rows } = await pool.query(
    'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
  );
  return rows;
}

/**
 * Update a user's role (admin only).
 * @param {number} id
 * @param {'admin'|'member'} role
 * @returns {Promise<object|null>}
 */
async function updateUserRole(id, role) {
  const { rows } = await pool.query(
    `UPDATE users SET role = $1 WHERE id = $2
     RETURNING id, name, email, role, created_at`,
    [role, id]
  );
  return rows[0] || null;
}

/**
 * Delete a user by id.
 * @param {number} id
 * @returns {Promise<boolean>}
 */
async function deleteUser(id) {
  const { rowCount } = await pool.query('DELETE FROM users WHERE id = $1', [id]);
  return rowCount > 0;
}

module.exports = { createUser, findUserByEmail, findUserById, getAllUsers, updateUserRole, deleteUser };
