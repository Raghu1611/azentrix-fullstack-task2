const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET;
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Sign a JWT containing { id, role }.
 * @param {{ id: number, role: string }} payload
 * @returns {string}
 */
function signToken(payload) {
  if (!SECRET) throw new Error('JWT_SECRET is not set');
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

/**
 * Verify and decode a JWT.
 * @param {string} token
 * @returns {{ id: number, role: string, iat: number, exp: number }}
 */
function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

module.exports = { signToken, verifyToken };
