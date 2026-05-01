const express = require('express');
const router = express.Router();
const Task = require('../models/Task');

// GET tasks for a specific day
router.get('/', async (req, res) => {
  try {
    const { date } = req.query; // YYYY-MM-DD
    if (!date) return res.status(400).json({ error: "Date parameter is required" });
    
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const tasks = await Task.find({
      date: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ startTime: 1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET tasks for a week
router.get('/week', async (req, res) => {
  try {
    const { start } = req.query; // YYYY-MM-DD
    if (!start) return res.status(400).json({ error: "Start date parameter is required" });
    
    const startOfWeek = new Date(start);
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const tasks = await Task.find({
      date: { $gte: startOfWeek, $lte: endOfWeek }
    });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST a new task
router.post('/', async (req, res) => {
  try {
    const task = new Task(req.body);
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT update a task (or mark done)
router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE a task
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH swap two tasks' time slots
router.patch('/swap', async (req, res) => {
  try {
    const { taskId1, taskId2 } = req.body;
    const task1 = await Task.findById(taskId1);
    const task2 = await Task.findById(taskId2);
    
    if (!task1 || !task2) return res.status(404).json({ error: "Tasks not found" });

    // Swap startTime and date if they are on different days
    const tempTime = task1.startTime;
    const tempDate = task1.date;

    task1.startTime = task2.startTime;
    task1.date = task2.date;

    task2.startTime = tempTime;
    task2.date = tempDate;

    await task1.save();
    await task2.save();

    res.json({ message: "Tasks swapped successfully", task1, task2 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
