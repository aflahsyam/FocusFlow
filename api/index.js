const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Task = require('../server/models/Task');
require('dotenv').config();

const app = express();

// Disable buffering globally to fail fast if disconnected
mongoose.set('bufferCommands', false);

// Database connection middleware (cached for serverless environment)
let cachedDb = null;
async function connectDb() {
  if (cachedDb && mongoose.connection.readyState >= 1) {
    return cachedDb;
  }
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI environment variable is missing on Vercel. Please configure it in your Vercel Project Settings.");
  }
  try {
    const db = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000 // Timeout connection after 5 seconds to prevent gateway timeout
    });
    cachedDb = db;
    console.log("✅ Database connected successfully");
    return db;
  } catch (err) {
    console.error("❌ Database connection error:", err);
    throw err;
  }
}

// Middleware to ensure DB is connected before processing requests
app.use(async (req, res, next) => {
  try {
    await connectDb();
    next();
  } catch (err) {
    res.status(500).json({ success: false, error: "Database connection failed: " + err.message });
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Gemini Schedule Generation Route
app.post('/api/tasks/generate', async (req, res) => {
  try {
    const { text, existingTasks, masterSchedule } = req.body; 
    if (!text) {
      return res.status(400).json({ error: "Text prompt is required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.warn("⚠️ GEMINI_API_KEY is not defined in environment variables.");
      return res.status(500).json({ error: "Gemini API key is not configured on the server." });
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
    
    res.status(201).json({
      message: "Successfully generated, adjusted, and saved tasks",
      tasks: savedTasks
    });

  } catch (error) {
    console.error("Gemini Generate Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Register other routes
app.use('/api/tasks', require('../server/routes/tasks'));
app.use('/api/streak', require('../server/routes/streak'));
app.use('/api/template', require('../server/routes/template'));
app.use('/api/review', require('../server/routes/review'));

// Global error handler to prevent HTML 500 error leak on Vercel
app.use((err, req, res, next) => {
  console.error("❌ Unhandled Express Error:", err);
  res.status(500).json({ success: false, error: "Internal Server Error: " + err.message, stack: err.stack });
});

// Default root response for verification
app.get('/api', (req, res) => {
  res.json({ message: "FocusFlow Serverless API is running" });
});

module.exports = app;
