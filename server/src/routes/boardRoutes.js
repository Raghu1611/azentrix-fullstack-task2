const { Router } = require('express');
const { createBoard, listBoards, getBoardDetails } = require('../controllers/boardController');
const { authenticate } = require('../middleware/auth');

const router = Router();

// All board routes require authentication
router.use(authenticate);

router.post('/', createBoard);
router.get('/', listBoards);
router.get('/:id', getBoardDetails);

module.exports = router;
