const express = require('express');
const router = express.Router();
const Streak = require('../models/Streak');
const Task = require('../models/Task');

// GET current streak data
router.get('/', async (req, res) => {
  try {
    let streak = await Streak.findOne();
    if (!streak) {
      streak = new Streak();
      await streak.save();
    }
    res.json(streak);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST check & update streak today
router.post('/check', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    const daysMap = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const todayDayStr = daysMap[today.getDay()];

    // Find all priority 'Do First' tasks for today
    const q1Tasks = await Task.find({
      priority: 'Do First',
      day: todayDayStr
    });

    let streak = await Streak.findOne();
    if (!streak) streak = new Streak();

    const allCompleted = q1Tasks.length > 0 && q1Tasks.every(t => t.isCompleted);

    // If already checked today, do not increment again
    let lastCompleted = streak.lastCompletedDate;
    let alreadyCompletedToday = lastCompleted && 
      lastCompleted.getTime() >= today.getTime() && 
      lastCompleted.getTime() <= endOfToday.getTime();

    if (allCompleted && !alreadyCompletedToday) {
      // Check if it's consecutive
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let wasCompletedYesterday = lastCompleted && 
        lastCompleted.getTime() >= yesterday.getTime() &&
        lastCompleted.getTime() < today.getTime();

      if (wasCompletedYesterday || streak.currentStreak === 0) {
        streak.currentStreak += 1;
      } else {
        // missed a day
        streak.currentStreak = 1;
      }
      
      streak.lastCompletedDate = new Date();
      if (streak.currentStreak > streak.longestStreak) {
        streak.longestStreak = streak.currentStreak;
      }
    } else if (!allCompleted && alreadyCompletedToday) {
      // if tasks were unmarked as completed
      streak.currentStreak = Math.max(0, streak.currentStreak - 1);
      streak.lastCompletedDate = null; // simplified logic
    }

    await streak.save();
    res.json(streak);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
