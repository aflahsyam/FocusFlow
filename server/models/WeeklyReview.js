const mongoose = require('mongoose');

const WeeklyReviewSchema = new mongoose.Schema({
  weekStartDate: {
    type: Date,
    required: true,
  },
  reflectionNotes: {
    type: String,
  },
  aiSummary: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.models.WeeklyReview || mongoose.model('WeeklyReview', WeeklyReviewSchema);
