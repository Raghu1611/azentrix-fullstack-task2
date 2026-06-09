const { Router } = require('express');
const { listUsers, changeRole, removeUser } = require('../controllers/userController');
const { authenticate, requireRole } = require('../middleware/auth');

const router = Router();

// All user management routes require auth + admin role
router.use(authenticate, requireRole('admin'));

router.get('/', listUsers);
router.patch('/:id/role', changeRole);
router.delete('/:id', removeUser);

module.exports = router;
