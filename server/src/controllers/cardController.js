const Card = require('../models/card');

/**
 * POST /api/cards
 * Body: { boardId, title, description, assignee, priority, dueDate }
 */
async function createCard(req, res, next) {
  try {
    const { boardId, title, description, assignee, priority, dueDate } = req.body;

    if (!boardId || !title) {
      return res.status(400).json({ message: 'boardId and title are required' });
    }

    // Determine the next position in the To Do column
    const count = await Card.countDocuments({ boardId, status: 'To Do' });

    const card = await Card.create({
      boardId,
      title,
      description,
      assignee: assignee || null,
      priority: priority || 'medium',
      dueDate: dueDate || null,
      creator: req.user.id,
      status: 'To Do',
      position: count,
    });

    const populatedCard = await Card.findById(card._id)
      .populate('assignee', 'name email role')
      .populate('creator', 'name email role');

    // Broadcast real-time update
    if (req.io) {
      req.io.to(`board:${boardId}`).emit('card_created', populatedCard);
    }

    return res.status(201).json({
      message: 'Card created successfully',
      card: populatedCard,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/cards/:id
 * Body: { title, description, assignee, priority, dueDate }
 */
async function updateCard(req, res, next) {
  try {
    const { id } = req.params;
    const { title, description, assignee, priority, dueDate } = req.body;

    const card = await Card.findById(id);
    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }

    // Permission enforcement: Admin can manage all. Member can only manage their own (creator or assignee).
    const isCreator = card.creator.toString() === req.user.id;
    const isAssignee = card.assignee && card.assignee.toString() === req.user.id;
    if (req.user.role !== 'admin' && !isCreator && !isAssignee) {
      return res.status(403).json({ message: 'Forbidden: You can only edit cards you created or are assigned to' });
    }

    if (title !== undefined) card.title = title;
    if (description !== undefined) card.description = description;
    if (assignee !== undefined) card.assignee = assignee || null;
    if (priority !== undefined) card.priority = priority;
    if (dueDate !== undefined) card.dueDate = dueDate || null;

    await card.save();

    const populatedCard = await Card.findById(card._id)
      .populate('assignee', 'name email role')
      .populate('creator', 'name email role');

    // Broadcast real-time update
    if (req.io) {
      req.io.to(`board:${card.boardId.toString()}`).emit('card_updated', populatedCard);
    }

    return res.json({
      message: 'Card updated successfully',
      card: populatedCard,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/cards/:id
 */
async function deleteCard(req, res, next) {
  try {
    const { id } = req.params;

    const card = await Card.findById(id);
    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }

    // Permission enforcement: Admin can manage all. Member can only manage their own (creator or assignee).
    const isCreator = card.creator.toString() === req.user.id;
    const isAssignee = card.assignee && card.assignee.toString() === req.user.id;
    if (req.user.role !== 'admin' && !isCreator && !isAssignee) {
      return res.status(403).json({ message: 'Forbidden: You can only delete cards you created or are assigned to' });
    }

    const boardId = card.boardId.toString();
    const status = card.status;
    const position = card.position;

    await Card.deleteOne({ _id: id });

    // Shift down cards above the deleted card in the same column
    await Card.updateMany(
      { boardId, status, position: { $gt: position } },
      { $inc: { position: -1 } }
    );

    // Broadcast real-time update
    if (req.io) {
      req.io.to(`board:${boardId}`).emit('card_deleted', { id, boardId });
    }

    return res.json({ message: 'Card deleted successfully' });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/cards/:id/move
 * Body: { status, position }
 */
async function moveCard(req, res, next) {
  try {
    const { id } = req.params;
    const { status, position } = req.body;

    if (!status || position === undefined) {
      return res.status(400).json({ message: 'status and position are required' });
    }

    const card = await Card.findById(id);
    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }

    // Permission enforcement: Admin can manage all. Member can only manage their own (creator or assignee).
    const isCreator = card.creator.toString() === req.user.id;
    const isAssignee = card.assignee && card.assignee.toString() === req.user.id;
    if (req.user.role !== 'admin' && !isCreator && !isAssignee) {
      return res.status(403).json({ message: 'Forbidden: You can only move cards you created or are assigned to' });
    }

    const oldStatus = card.status;
    const oldPosition = card.position;
    const boardId = card.boardId.toString();

    if (oldStatus === status) {
      // Reordering in the same column
      if (oldPosition !== position) {
        if (position > oldPosition) {
          // Shift intermediate cards down
          await Card.updateMany(
            { boardId, status, position: { $gt: oldPosition, $lte: position } },
            { $inc: { position: -1 } }
          );
        } else {
          // Shift intermediate cards up
          await Card.updateMany(
            { boardId, status, position: { $gte: position, $lt: oldPosition } },
            { $inc: { position: 1 } }
          );
        }
        card.position = position;
        await card.save();
      }
    } else {
      // Moving to a different column
      // 1. Shift remaining cards in the old column down
      await Card.updateMany(
        { boardId, status: oldStatus, position: { $gt: oldPosition } },
        { $inc: { position: -1 } }
      );
      // 2. Shift target column cards up
      await Card.updateMany(
        { boardId, status, position: { $gte: position } },
        { $inc: { position: 1 } }
      );
      card.status = status;
      card.position = position;
      await card.save();
    }

    const populatedCard = await Card.findById(card._id)
      .populate('assignee', 'name email role')
      .populate('creator', 'name email role');

    // Broadcast real-time update
    if (req.io) {
      req.io.to(`board:${boardId}`).emit('card_moved', {
        card: populatedCard,
        boardId,
        fromStatus: oldStatus,
        toStatus: status,
        fromPosition: oldPosition,
        toPosition: position,
      });
    }

    return res.json({
      message: 'Card moved successfully',
      card: populatedCard,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createCard,
  updateCard,
  deleteCard,
  moveCard,
};
