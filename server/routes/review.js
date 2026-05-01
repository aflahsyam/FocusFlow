const express = require('express');
const router = express.Router();
const WeeklyReview = require('../models/WeeklyReview');
const Task = require('../models/Task');
const { generateWeeklySummary, parseWeeklyTasks } = require('../services/geminiService');

// POST AI Parse Weekly Template text
router.post('/parse', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });
    const parsedTasks = await parseWeeklyTasks(text);
    res.json(parsedTasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET review for a week
router.get('/', async (req, res) => {
  try {
    const { week } = req.query; // YYYY-MM-DD
    if (!week) return res.status(400).json({ error: "Week parameter is required" });
    
    const startOfWeek = new Date(week);
    startOfWeek.setHours(0, 0, 0, 0);

    const review = await WeeklyReview.findOne({ weekStartDate: startOfWeek });
    res.json(review || null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST save reflection notes and generate summary
router.post('/', async (req, res) => {
  try {
    const { weekStartDate, reflectionNotes, q1Total, q1Completed, totalTasks, totalCompleted, streakDays } = req.body;
    
    const startOfWeek = new Date(weekStartDate);
    startOfWeek.setHours(0, 0, 0, 0);

    // Generate AI Summary
    const stats = { q1Total, q1Completed, totalTasks, totalCompleted, streakDays, reflectionNotes };
    const aiSummary = await generateWeeklySummary(stats);

    let review = await WeeklyReview.findOne({ weekStartDate: startOfWeek });
    if (review) {
      review.reflectionNotes = reflectionNotes;
      review.aiSummary = aiSummary;
    } else {
      review = new WeeklyReview({ weekStartDate: startOfWeek, reflectionNotes, aiSummary });
    }
    await review.save();
    
    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
