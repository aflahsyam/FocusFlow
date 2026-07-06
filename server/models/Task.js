const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  taskName: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['College Tasks', 'Coding & Dev Skills', 'Others', 'Create Schedule'],
    required: true,
  },
  day: {
    type: String,
    enum: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
    required: true,
  },
  startTime: {
    type: String, // format 'HH:MM', contoh '09:00'
    required: true,
  },
  endTime: {
    type: String, // format 'HH:MM'
    required: true,
  },
  priority: {
    type: String,
    enum: ['Do First', 'Schedule', 'Delegate', 'Eliminate'],
    required: true,
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  isStarred: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.models.Task || mongoose.model('Task', TaskSchema);
