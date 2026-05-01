const mongoose = require('mongoose');

const StreakSchema = new mongoose.Schema({
  currentStreak: {
    type: Number,
    default: 0,
  },
  lastCompletedDate: {
    type: Date,
  },
  longestStreak: {
    type: Number,
    default: 0,
  }
});

module.exports = mongoose.model('Streak', StreakSchema);
