/**
 * Central error handler — must be registered last in Express.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(err);

  // Postgres unique violation
  if (err.code === '23505') {
    return res.status(409).json({ message: 'Email already in use' });
  }

  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  res.status(status).json({ message });
}

module.exports = errorHandler;
