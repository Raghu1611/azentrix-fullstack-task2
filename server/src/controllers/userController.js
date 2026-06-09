const { getAllUsers, updateUserRole, deleteUser, findUserById } = require('../models/userModel');

/**
 * GET /api/users
 * Admin only — list all users
 */
async function listUsers(req, res, next) {
  try {
    const users = await getAllUsers();
    return res.json({ users });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/users/:id/role
 * Admin only — change a user's role
 * Body: { role: 'admin' | 'member' }
 */
async function changeRole(req, res, next) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({ message: "role must be 'admin' or 'member'" });
    }

    const user = await updateUserRole(Number(id), role);
    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.json({ message: 'Role updated', user });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/users/:id
 * Admin only — delete a user
 */
async function removeUser(req, res, next) {
  try {
    const { id } = req.params;

    // Prevent admin deleting themselves
    if (Number(id) === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const deleted = await deleteUser(Number(id));
    if (!deleted) return res.status(404).json({ message: 'User not found' });

    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { listUsers, changeRole, removeUser };
