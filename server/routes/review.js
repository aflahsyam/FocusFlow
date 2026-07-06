const express = require('express');
const router = express.Router();
const WeeklyReview = require('../models/WeeklyReview');
const Task = require('../models/Task');
const { generateWeeklySummary, parseWeeklyTasks } = require('../services/geminiService');

// POST AI Parse Weekly Template text
router.post('/parse', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ success: false, error: "Text is required" });
    const parsedTasks = await parseWeeklyTasks(text);
    res.json(parsedTasks);
  } catch (error) {
    const is503 = error?.status === 503 || error?.message?.includes('503') || error?.message?.includes('Service Unavailable');
    if (is503) {
      return res.status(503).json({ success: false, error: "AI is currently busy. Please try again in a moment." });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET review for a week
router.get('/', async (req, res) => {
  try {
    const { week } = req.query; // YYYY-MM-DD
    if (!week) return res.status(400).json({ success: false, error: "Week parameter is required" });
    
    const startOfWeek = new Date(week);
    startOfWeek.setHours(0, 0, 0, 0);

    const review = await WeeklyReview.findOne({ weekStartDate: startOfWeek });
    res.json(review || null);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST save reflection notes only (no AI generation)
router.post('/save', async (req, res) => {
  try {
    const { weekStartDate, reflectionNotes } = req.body;
    if (!weekStartDate) {
      return res.status(400).json({ success: false, error: "weekStartDate is required" });
    }
    const startOfWeek = new Date(weekStartDate);
    startOfWeek.setHours(0, 0, 0, 0);

    let review = await WeeklyReview.findOne({ weekStartDate: startOfWeek });
    if (review) {
      review.reflectionNotes = reflectionNotes;
    } else {
      review = new WeeklyReview({ 
        weekStartDate: startOfWeek, 
        reflectionNotes,
        aiSummary: null
      });
    }
    await review.save();
    
    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
