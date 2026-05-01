const mongoose = require('mongoose');

const WeeklyTemplateSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  savedAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('WeeklyTemplate', WeeklyTemplateSchema);
