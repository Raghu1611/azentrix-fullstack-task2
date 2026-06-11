const { Router } = require('express');
const { listUsers, changeRole, removeUser, listAssignees } = require('../controllers/userController');
const { authenticate, requireRole } = require('../middleware/auth');

const router = Router();

// Expose assignee lookup to all logged-in users
router.get('/assignees', authenticate, listAssignees);

// All user management routes require auth + admin role
router.use(authenticate, requireRole('admin'));

router.get('/', listUsers);
router.patch('/:id/role', changeRole);
router.delete('/:id', removeUser);

module.exports = router;
