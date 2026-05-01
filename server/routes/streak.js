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
    res.status(500).json({ error: error.message });
  }
});

// POST check & update streak today
router.post('/check', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    const q1Tasks = await Task.find({
      quadrant: 'Q1',
      date: { $gte: today, $lte: endOfToday }
    });

    let streak = await Streak.findOne();
    if (!streak) streak = new Streak();

    const allCompleted = q1Tasks.length > 0 && q1Tasks.every(t => t.isDone);

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
      // if tasks were unmarked as done
      streak.currentStreak = Math.max(0, streak.currentStreak - 1);
      streak.lastCompletedDate = null; // simplified logic
    } else if (!allCompleted && q1Tasks.length > 0) {
      // end of day logic should actually run via cron, but here we update on demand
    }

    await streak.save();
    res.json(streak);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
