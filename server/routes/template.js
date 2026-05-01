const express = require('express');
const router = express.Router();
const WeeklyTemplate = require('../models/WeeklyTemplate');

// GET latest saved template
router.get('/latest', async (req, res) => {
  try {
    const template = await WeeklyTemplate.findOne().sort({ savedAt: -1 });
    res.json(template || { text: '' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST save new template
router.post('/', async (req, res) => {
  try {
    const { text } = req.body;
    const template = new WeeklyTemplate({ text });
    await template.save();
    res.status(201).json(template);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
