const express = require('express');
const router = express.Router();
const Task = require('../models/Task');

// GET tasks (can be filtered by day)
router.get('/', async (req, res) => {
  try {
    const { day } = req.query;
    const query = day ? { day } : {};
    const tasks = await Task.find(query).sort({ startTime: 1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET all tasks for the week
router.get('/week', async (req, res) => {
  try {
    const tasks = await Task.find({}).sort({ startTime: 1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST a new task
router.post('/', async (req, res) => {
  try {
    const task = new Task(req.body);
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// PUT update task slot (used by drag and drop)
// Crucial: Must be placed BEFORE /:id route so it matches correctly!
router.put('/update-slot', async (req, res) => {
  try {
    const { taskId, day, startTime } = req.body;
    if (!taskId || !day || !startTime) {
      return res.status(400).json({ error: "taskId, day, and startTime are required" });
    }

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });

    // Calculate original duration in minutes
    const parseTimeToMinutes = (timeStr) => {
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    };
    
    const minutesToTime = (totalMin) => {
      const h = Math.floor(totalMin / 60) % 24;
      const m = totalMin % 60;
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    const startMin = parseTimeToMinutes(task.startTime);
    let endMin = parseTimeToMinutes(task.endTime);
    if (endMin < startMin) endMin += 24 * 60; // handle overnight tasks

    const duration = endMin - startMin;

    const newStartMin = parseTimeToMinutes(startTime);
    const newEndMin = newStartMin + duration;
    const endTime = minutesToTime(newEndMin);

    task.day = day;
    task.startTime = startTime;
    task.endTime = endTime;
    await task.save();

    res.json(task);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT update a task (general update, including marking as completed)
router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json(task);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// DELETE all tasks (clear week)
router.delete('/clear', async (req, res) => {
  try {
    await Task.deleteMany({});
    res.json({ message: "All tasks cleared successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE a task
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH swap two tasks' slots
router.patch('/swap', async (req, res) => {
  try {
    const { taskId1, taskId2 } = req.body;
    const task1 = await Task.findById(taskId1);
    const task2 = await Task.findById(taskId2);
    
    if (!task1 || !task2) return res.status(404).json({ error: "Tasks not found" });

    const tempDay = task1.day;
    const tempTime = task1.startTime;
    const tempEndTime = task1.endTime;

    task1.day = task2.day;
    task1.startTime = task2.startTime;
    task1.endTime = task2.endTime;

    task2.day = tempDay;
    task2.startTime = tempTime;
    task2.endTime = tempEndTime;

    await task1.save();
    await task2.save();

    res.json({ message: "Tasks swapped successfully", task1, task2 });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
