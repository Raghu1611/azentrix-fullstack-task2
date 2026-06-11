const express = require('express');
const http = require('http');
const cors = require('cors');
const socketIo = require('socket.io');
require('dotenv').config();

const { connectDB } = require('./db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const boardRoutes = require('./routes/boardRoutes');
const cardRoutes = require('./routes/cardRoutes');
const errorHandler = require('./middleware/errorHandler');
const { handleSockets } = require('./sockets/socketHandler');

const app = express();
const server = http.createServer(app);

// ── Database Connection ──────────────────────────────────────────────────────
connectDB();

// ── Socket.io Setup ─────────────────────────────────────────────────────────
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
  },
});

// Attach socket server to requests for controller access
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Run socket listener logic
handleSockets(io);

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

// ── Routes ──────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', database: 'mongodb' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/cards', cardRoutes);

// ── 404 catch-all ────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ message: 'Route not found' }));

// ── Central error handler (must be last) ────────────────────────────────────
app.use(errorHandler);

// ── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀  Server running on port ${PORT}`));
