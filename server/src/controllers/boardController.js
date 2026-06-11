const Board = require('../models/board');
const Card = require('../models/card');

/**
 * POST /api/boards
 * Body: { name, description }
 */
async function createBoard(req, res, next) {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Board name is required' });
    }

    const board = await Board.create({
      name,
      description,
      creator: req.user.id,
    });

    return res.status(201).json({
      message: 'Board created successfully',
      board,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/boards
 */
async function listBoards(req, res, next) {
  try {
    const boards = await Board.find({})
      .populate('creator', 'name email')
      .sort({ createdAt: -1 });

    return res.json({ boards });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/boards/:id
 */
async function getBoardDetails(req, res, next) {
  try {
    const { id } = req.params;

    const board = await Board.findById(id).populate('creator', 'name email');
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Fetch all cards belonging to this board, populated with assignee and creator info
    const cards = await Card.find({ boardId: id })
      .populate('assignee', 'name email role')
      .populate('creator', 'name email role')
      .sort({ position: 1 });

    return res.json({
      board,
      cards,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createBoard,
  listBoards,
  getBoardDetails,
};
