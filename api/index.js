import mongoose from 'mongoose';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Task from '../server/models/Task.js';
import Streak from '../server/models/Streak.js';
import WeeklyTemplate from '../server/models/WeeklyTemplate.js';
import WeeklyReview from '../server/models/WeeklyReview.js';
import geminiService from '../server/services/geminiService.js';

// Disable buffering globally to fail fast if disconnected
mongoose.set('bufferCommands', false);

// Global connection caching for MongoDB Atlas
let cachedConnection = null;

async function connectDB() {
  if (cachedConnection && mongoose.connection.readyState >= 1) {
    return cachedConnection;
  }
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI environment variable is missing on Vercel. Please configure it in your Vercel Project Settings.");
  }
  try {
    cachedConnection = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000 // 5 seconds timeout
    });
    console.log("✅ Database connected successfully");
    return cachedConnection;
  } catch (err) {
    console.error("❌ Database connection error:", err);
    throw err;
  }
}

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 1. Connect to database
    await connectDB();

    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = url.pathname;
    
    // Map URL search params to req.query for compatibility
    req.query = Object.fromEntries(url.searchParams);

    // Route: /api/tasks
    if (pathname.startsWith('/api/tasks')) {
      return await handleTasksRoute(req, res, pathname);
    }
    // Route: /api/streak
    if (pathname.startsWith('/api/streak')) {
      return await handleStreakRoute(req, res, pathname);
    }
    // Route: /api/template
    if (pathname.startsWith('/api/template')) {
      return await handleTemplateRoute(req, res, pathname);
    }
    // Route: /api/review
    if (pathname.startsWith('/api/review')) {
      return await handleReviewRoute(req, res, pathname);
    }

    return res.status(404).json({ success: false, error: `Route not found: ${req.method} ${pathname}` });
  } catch (err) {
    console.error("❌ Serverless Handler Crash:", err);
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
}

// --- Route Handlers ---

async function handleTasksRoute(req, res, pathname) {
  const relativePath = pathname.replace(/^\/api\/tasks/, '') || '/';

  if (req.method === 'GET') {
    if (relativePath === '/week') {
      const tasks = await Task.find({}).sort({ startTime: 1 });
      return res.status(200).json(tasks);
    }
    if (relativePath === '/' || relativePath === '') {
      const { day } = req.query;
      const query = day ? { day } : {};
      const tasks = await Task.find(query).sort({ startTime: 1 });
      return res.status(200).json(tasks);
    }
  }

  if (req.method === 'POST') {
    if (relativePath === '/generate') {
      const { text, existingTasks, masterSchedule } = req.body;
      if (!text) {
        return res.status(400).json({ success: false, error: "Text prompt is required" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ success: false, error: "Gemini API key is not configured on the server." });
      }

      const opsi = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      const tanggalSekarang = new Date().toLocaleDateString('id-ID', opsi);
          
      const instruksiSistem = `Kamu adalah Weekly Strategist untuk aplikasi FocusFlow.
Tugasmu adalah menyusun dan menyesuaikan jadwal mingguan terstruktur dari hari Senin (MON) sampai Minggu (SUN) di rentang jam 04:00 hingga 24:00.

BATASAN ATURAN (CONSTRAINTS):
1. JADWAL KULIAH TETAP (Master Schedule) adalah jadwal yang dikunci (Locked Time Slots). Kamu TIDAK BOLEH menjadwalkan tugas atau aktivitas lain di waktu yang bertabrakan dengan jadwal ini.
2. PENYESUAIAN JADWAL DOSEN: Jika user memberikan instruksi pemindahan/reschedule jadwal kuliah (misal: "geser kuliah PBO hari Jumat ke jam 13:00"), kamu harus mengubah hari, startTime, dan endTime untuk kuliah tersebut di daftar akhir.
3. KATEGORI & PRIORITAS:
   - "College Tasks" (Prioritas tertinggi, default 'Do First')
   - "Coding & Dev Skills" (Prioritas kedua, default 'Schedule')
   - "Others" (Prioritas terakhir, default 'Delegate')
   - "Create Schedule" (Kategori khusus jadwal kuliah tetap, default 'Do First')
4. OUTPUT: Kamu harus mengembalikan daftar LENGKAP semua tugas untuk minggu ini setelah digabung dengan aktivitas baru dan pemindahan jadwal kuliah. Format output WAJIB berupa JSON Array berisi objek Task. Jangan kembalikan teks lain selain JSON Array tersebut.`;

      const promptLengkap = `Konteks Waktu Saat Ini: Waktu sekarang adalah hari ${tanggalSekarang}.

Jadwal Kuliah Tetap (Master Schedule):
${JSON.stringify(masterSchedule || [], null, 2)}

Jadwal Berjalan Saat Ini (Existing Tasks):
${JSON.stringify(existingTasks || [], null, 2)}

Perintah User / Aktivitas Baru yang Harus Dijadwalkan atau Disesuaikan:
"${text}"`;

      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: { responseMimeType: "application/json" },
        systemInstruction: instruksiSistem
      });

      const result = await model.generateContent(promptLengkap);
      const responseText = result.response.text();
      
      const cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const tasksData = JSON.parse(cleanedText);

      const formattedTasks = tasksData.map(t => {
        const existing = existingTasks && existingTasks.find(et => et.taskName.toLowerCase() === (t.taskName || t.title || "").toLowerCase());
        return {
          taskName: t.taskName || t.title || "Untitled Task",
          category: t.category || "Others",
          day: t.day || "MON",
          startTime: t.startTime || "09:00",
          endTime: t.endTime || "10:00",
          priority: t.priority || t.quadrant || "Schedule",
          isCompleted: existing ? existing.isCompleted : (t.isCompleted || false)
        };
      });

      await Task.deleteMany({});
      const savedTasks = await Task.insertMany(formattedTasks);
      
      return res.status(201).json({
        message: "Successfully generated, adjusted, and saved tasks",
        tasks: savedTasks
      });
    }

    if (relativePath === '/' || relativePath === '') {
      const task = new Task(req.body);
      await task.save();
      return res.status(201).json(task);
    }
  }

  if (req.method === 'PUT') {
    if (relativePath === '/update-slot') {
      const { taskId, day, startTime } = req.body;
      if (!taskId || !day || !startTime) {
        return res.status(400).json({ success: false, error: "taskId, day, and startTime are required" });
      }

      const task = await Task.findById(taskId);
      if (!task) return res.status(404).json({ success: false, error: "Task not found" });

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
      if (endMin < startMin) endMin += 24 * 60;

      const duration = endMin - startMin;
      const newStartMin = parseTimeToMinutes(startTime);
      const newEndMin = newStartMin + duration;
      const endTime = minutesToTime(newEndMin);

      task.day = day;
      task.startTime = startTime;
      task.endTime = endTime;
      await task.save();

      return res.status(200).json(task);
    }

    const match = relativePath.match(/^\/([a-fA-F0-9]{24})/);
    if (match) {
      const id = match[1];
      const task = await Task.findByIdAndUpdate(id, req.body, { new: true });
      if (!task) return res.status(404).json({ success: false, error: "Task not found" });
      return res.status(200).json(task);
    }
  }

  if (req.method === 'PATCH') {
    if (relativePath === '/swap') {
      const { taskId1, taskId2 } = req.body;
      const task1 = await Task.findById(taskId1);
      const task2 = await Task.findById(taskId2);
      
      if (!task1 || !task2) return res.status(404).json({ success: false, error: "Tasks not found" });

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

      return res.status(200).json({ message: "Tasks swapped successfully", task1, task2 });
    }
  }

  if (req.method === 'DELETE') {
    if (relativePath === '/clear') {
      await Task.deleteMany({});
      return res.status(200).json({ message: "All tasks cleared successfully" });
    }

    const match = relativePath.match(/^\/([a-fA-F0-9]{24})/);
    if (match) {
      const id = match[1];
      const task = await Task.findByIdAndDelete(id);
      if (!task) return res.status(404).json({ success: false, error: "Task not found" });
      return res.status(200).json({ message: "Task deleted successfully" });
    }
  }

  return res.status(404).json({ success: false, error: `Route not found: ${req.method} ${pathname}` });
}

async function handleStreakRoute(req, res, pathname) {
  const relativePath = pathname.replace(/^\/api\/streak/, '') || '/';

  if (req.method === 'GET') {
    if (relativePath === '/' || relativePath === '') {
      let streak = await Streak.findOne();
      if (!streak) {
        streak = new Streak();
        await streak.save();
      }
      return res.status(200).json(streak);
    }
  }

  if (req.method === 'POST') {
    if (relativePath === '/check') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endOfToday = new Date(today);
      endOfToday.setHours(23, 59, 59, 999);

      const daysMap = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      const todayDayStr = daysMap[today.getDay()];

      const q1Tasks = await Task.find({
        priority: 'Do First',
        day: todayDayStr
      });

      let streak = await Streak.findOne();
      if (!streak) streak = new Streak();

      const allCompleted = q1Tasks.length > 0 && q1Tasks.every(t => t.isCompleted);
      let lastCompleted = streak.lastCompletedDate;
      let alreadyCompletedToday = lastCompleted && 
        lastCompleted.getTime() >= today.getTime() && 
        lastCompleted.getTime() <= endOfToday.getTime();

      if (allCompleted && !alreadyCompletedToday) {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        let wasCompletedYesterday = lastCompleted && 
          lastCompleted.getTime() >= yesterday.getTime() &&
          lastCompleted.getTime() < today.getTime();

        if (wasCompletedYesterday || streak.currentStreak === 0) {
          streak.currentStreak += 1;
        } else {
          streak.currentStreak = 1;
        }
        
        streak.lastCompletedDate = new Date();
        if (streak.currentStreak > streak.longestStreak) {
          streak.longestStreak = streak.currentStreak;
        }
      } else if (!allCompleted && alreadyCompletedToday) {
        streak.currentStreak = Math.max(0, streak.currentStreak - 1);
        streak.lastCompletedDate = null;
      }

      await streak.save();
      return res.status(200).json(streak);
    }
  }

  return res.status(404).json({ success: false, error: `Route not found: ${req.method} ${pathname}` });
}

async function handleTemplateRoute(req, res, pathname) {
  const relativePath = pathname.replace(/^\/api\/template/, '') || '/';

  if (req.method === 'GET') {
    if (relativePath === '/latest') {
      const template = await WeeklyTemplate.findOne().sort({ savedAt: -1 });
      return res.status(200).json(template || { text: '' });
    }
  }

  if (req.method === 'POST') {
    if (relativePath === '/' || relativePath === '') {
      const { text } = req.body;
      const template = new WeeklyTemplate({ text });
      await template.save();
      return res.status(201).json(template);
    }
  }

  return res.status(404).json({ success: false, error: `Route not found: ${req.method} ${pathname}` });
}

async function handleReviewRoute(req, res, pathname) {
  const relativePath = pathname.replace(/^\/api\/review/, '') || '/';

  if (req.method === 'POST') {
    if (relativePath === '/parse') {
      const { text } = req.body;
      if (!text) return res.status(400).json({ success: false, error: "Text is required" });
      const parsedTasks = await geminiService.parseWeeklyTasks(text);
      return res.status(200).json(parsedTasks);
    }

    if (relativePath === '/save') {
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
      return res.status(201).json(review);
    }

    if (relativePath === '/' || relativePath === '') {
      const { weekStartDate, reflectionNotes, q1Total, q1Completed, totalTasks, totalCompleted, streakDays } = req.body;
      const startOfWeek = new Date(weekStartDate);
      startOfWeek.setHours(0, 0, 0, 0);

      const stats = { q1Total, q1Completed, totalTasks, totalCompleted, streakDays, reflectionNotes };
      const aiSummary = await geminiService.generateWeeklySummary(stats);

      let review = await WeeklyReview.findOne({ weekStartDate: startOfWeek });
      if (review) {
        review.reflectionNotes = reflectionNotes;
        review.aiSummary = aiSummary;
      } else {
        review = new WeeklyReview({ weekStartDate: startOfWeek, reflectionNotes, aiSummary });
      }
      await review.save();
      return res.status(201).json(review);
    }
  }

  if (req.method === 'GET') {
    if (relativePath === '/' || relativePath === '') {
      const { week } = req.query;
      if (!week) return res.status(400).json({ success: false, error: "Week parameter is required" });
      
      const startOfWeek = new Date(week);
      startOfWeek.setHours(0, 0, 0, 0);

      const review = await WeeklyReview.findOne({ weekStartDate: startOfWeek });
      return res.status(200).json(review || null);
    }
  }

  return res.status(404).json({ success: false, error: `Route not found: ${req.method} ${pathname}` });
}
