const User = require('./user');

/**
 * Create a new user.
 * @param {{ name: string, email: string, password: string, role?: string }} data
 * @returns {Promise<object>} created user (no password field)
 */
async function createUser({ name, email, password, role = 'member' }) {
  const user = await User.create({ name, email, password, role });
  return user.toJSON();
}

/**
 * Find a user by email (includes hashed password for auth check).
 * @param {string} email
 * @returns {Promise<object|null>}
 */
async function findUserByEmail(email) {
  const user = await User.findOne({ email });
  if (!user) return null;
  
  // Return a plain object but preserve password for bcrypt match
  const userObj = user.toObject({ virtuals: true });
  userObj.password = user.password;
  userObj.id = user._id.toString();
  return userObj;
}

/**
 * Find a user by primary key (omits password).
 * @param {string} id
 * @returns {Promise<object|null>}
 */
async function findUserById(id) {
  // MongoDB uses string ObjectIds, verify first
  if (!id) return null;
  const user = await User.findById(id);
  return user ? user.toJSON() : null;
}

/**
 * Return all users (admin use). Omits passwords.
 * @returns {Promise<object[]>}
 */
async function getAllUsers() {
  const users = await User.find({}).sort({ createdAt: -1 });
  return users.map(u => u.toJSON());
}

/**
 * Update a user's role (admin only).
 * @param {string} id
 * @param {'admin'|'member'} role
 * @returns {Promise<object|null>}
 */
async function updateUserRole(id, role) {
  const user = await User.findByIdAndUpdate(id, { role }, { new: true });
  return user ? user.toJSON() : null;
}

/**
 * Delete a user by id.
 * @param {string} id
 * @returns {Promise<boolean>}
 */
async function deleteUser(id) {
  const result = await User.deleteOne({ _id: id });
  return result.deletedCount > 0;
}

module.exports = { createUser, findUserByEmail, findUserById, getAllUsers, updateUserRole, deleteUser };
