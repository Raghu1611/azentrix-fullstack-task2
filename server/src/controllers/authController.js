const bcrypt = require('bcryptjs');
const { createUser, findUserByEmail } = require('../models/userModel');
const { signToken } = require('../utils/jwt');

const SALT_ROUNDS = 12;

/**
 * POST /api/auth/register
 * Body: { name, email, password }
 */
async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    // --- validation ---
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // --- hash & persist ---
    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await createUser({ name, email: email.toLowerCase(), password: hashed });

    const token = signToken({ id: user.id, role: user.role });

    return res.status(201).json({
      message: 'Registration successful',
      token,
      user,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const user = await findUserByEmail(email.toLowerCase());

    if (!user) {
      // Keep error generic to avoid user enumeration
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = signToken({ id: user.id, role: user.role });

    // Strip password before sending
    const { password: _pw, ...safeUser } = user;

    return res.json({
      message: 'Login successful',
      token,
      user: safeUser,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me
 * Protected — requires authenticate middleware
 */
async function getMe(req, res) {
  // req.user is already attached by authenticate middleware
  return res.json({ user: req.user });
}

module.exports = { register, login, getMe };
