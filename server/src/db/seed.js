const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const Board = require('../models/board');
const Card = require('../models/card');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://2200032009cseh_db_user:2200032009cseh_db_user@cluster0.azexups.mongodb.net/mini-trello';

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('🌱  Connected to MongoDB for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Board.deleteMany({});
    await Card.deleteMany({});
    console.log('🧹  Cleared existing users, boards, and cards.');

    // Create Admin User
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@minitrello.com',
      password: adminPassword,
      role: 'admin',
    });
    console.log('👤  Admin user created: admin@minitrello.com (password: admin123)');

    // Create Member User
    const memberPassword = await bcrypt.hash('member123', 12);
    const member = await User.create({
      name: 'Member User',
      email: 'member@minitrello.com',
      password: memberPassword,
      role: 'member',
    });
    console.log('👤  Member user created: member@minitrello.com (password: member123)');

    // Create another Member User for assigning tasks
    const john = await User.create({
      name: 'John Doe',
      email: 'john@minitrello.com',
      password: memberPassword,
      role: 'member',
    });
    console.log('👤  Member user created: john@minitrello.com (password: member123)');

    // Create a default Board
    const board = await Board.create({
      name: 'Development Sprint',
      description: 'Main board for managing client deliverables and sprints.',
      creator: admin._id,
    });
    console.log('📋  Default Board created: Development Sprint');

    // Create sample Cards
    const cards = [
      {
        boardId: board._id,
        title: 'Design high-fidelity UI mockup',
        description: 'Design dark mode and glassmorphism components in Figma.',
        status: 'To Do',
        position: 0,
        assignee: john._id,
        priority: 'high',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        creator: admin._id,
      },
      {
        boardId: board._id,
        title: 'Connect Socket.io real-time backend',
        description: 'Set up socket handlers and room joins for boards.',
        status: 'In Progress',
        position: 0,
        assignee: member._id,
        priority: 'medium',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        creator: member._id,
      },
      {
        boardId: board._id,
        title: 'Draft Project proposal',
        description: 'Create initial outline of goals, tasks, and deadlines.',
        status: 'Done',
        position: 0,
        assignee: admin._id,
        priority: 'low',
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        creator: admin._id,
      },
      {
        boardId: board._id,
        title: 'Integrate Tailwind styles',
        description: 'Set up custom config and colors for premium feel.',
        status: 'To Do',
        position: 1,
        assignee: member._id,
        priority: 'low',
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        creator: admin._id,
      },
    ];

    await Card.create(cards);
    console.log('🗂️  Sample cards seeded.');
    console.log('✅  Database seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌  Error during seeding:', error.message);
    process.exit(1);
  }
}

seed();
