const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  quadrant: {
    type: String,
    enum: ['Q1', 'Q2', 'Q3', 'Q4'],
    required: true,
  },
  category: {
    type: String,
    enum: ['college', 'coding', 'other', 'general'],
    default: 'general',
  },
  date: {
    type: Date,
    required: true,
  },
  startTime: {
    type: String, // HH:MM
  },
  duration: {
    type: Number, // hours
    default: 1,
  },
  isDone: {
    type: Boolean,
    default: false,
  },
  notes: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Task', TaskSchema);
