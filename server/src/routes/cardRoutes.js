const { Router } = require('express');
const { createCard, updateCard, deleteCard, moveCard } = require('../controllers/cardController');
const { authenticate } = require('../middleware/auth');

const router = Router();

// All card routes require authentication
router.use(authenticate);

router.post('/', createCard);
router.patch('/:id', updateCard);
router.delete('/:id', deleteCard);
router.patch('/:id/move', moveCard);

module.exports = router;
