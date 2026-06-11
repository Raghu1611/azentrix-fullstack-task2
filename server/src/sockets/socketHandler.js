/**
 * Handles incoming socket connections and binds event listeners for board rooms.
 * @param {import('socket.io').Server} io
 */
function handleSockets(io) {
  io.on('connection', (socket) => {
    console.log(`🔌  New socket client connected: ${socket.id}`);

    // User joins a specific board room
    socket.on('join_board', (boardId) => {
      if (!boardId) return;
      const roomName = `board:${boardId}`;
      socket.join(roomName);
      console.log(`👥  Socket ${socket.id} joined room ${roomName}`);
    });

    // User leaves a specific board room
    socket.on('leave_board', (boardId) => {
      if (!boardId) return;
      const roomName = `board:${boardId}`;
      socket.leave(roomName);
      console.log(`👥  Socket ${socket.id} left room ${roomName}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌  Socket client disconnected: ${socket.id}`);
    });
  });
}

module.exports = { handleSockets };
