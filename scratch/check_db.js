const mongoose = require('mongoose');
const Task = require('./server/models/Task');
require('dotenv').config({ path: './server/.env' });

async function checkTasks() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to DB");
    const tasks = await Task.find({});
    console.log("Tasks in DB:", JSON.stringify(tasks, null, 2));
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

checkTasks();
