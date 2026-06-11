const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://2200032009cseh_db_user:2200032009cseh_db_user@cluster0.azexups.mongodb.net/mini-trello';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('🔌  Connected to MongoDB successfully');
  } catch (error) {
    console.error('  Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
}

module.exports = { connectDB, connection: mongoose.connection };
