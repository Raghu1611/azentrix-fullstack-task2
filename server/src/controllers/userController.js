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

    const user = await updateUserRole(id, role);
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
    if (id === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const deleted = await deleteUser(id);
    if (!deleted) return res.status(404).json({ message: 'User not found' });

    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/users/assignees
 * Authenticated — list user directory for assignee dropdowns
 */
async function listAssignees(req, res, next) {
  try {
    const users = await getAllUsers();
    // Return safe data
    const safeUsers = users.map(u => ({ id: u.id, name: u.name, email: u.email }));
    return res.json({ users: safeUsers });
  } catch (err) {
    next(err);
  }
}

module.exports = { listUsers, changeRole, removeUser, listAssignees };
