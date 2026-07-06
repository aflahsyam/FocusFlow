const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Task = require('./models/Task');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    'https://focusflow-production-a997.up.railway.app', // URL Produksi
    'http://localhost:3000',                            // Agar bisa testing dari lokal
    'http://localhost:5173'                            // Port default Vite
  ],
  credentials: true
}));
app.use(express.json());

// Gemini Schedule Generation Route
app.post('/api/tasks/generate', async (req, res) => {
  try {
    // Ambil input text, existingTasks, dan masterSchedule dari user
    const { text, existingTasks, masterSchedule } = req.body; 
    if (!text) {
      return res.status(400).json({ error: "Text prompt is required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.warn("⚠️ GEMINI_API_KEY is not defined in .env file.");
      return res.status(500).json({ error: "Gemini API key is not configured on the server." });
    }

    // 1. Ambil Tanggal dan Hari Real-time Secara Dinamis
    const opsi = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const tanggalSekarang = new Date().toLocaleDateString('id-ID', opsi); // Contoh: "Jumat, 22 Mei 2026"
        
    // 2. Definisi Instruksi Utama untuk System Instruction dengan Batasan Locked Slots & Reschedule
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

    // 3. Gabungkan Konteks Waktu, Master Schedule, dan Existing Tasks ke Prompt Akhir
    const promptLengkap = `Konteks Waktu Saat Ini: Waktu sekarang adalah hari ${tanggalSekarang}.

Jadwal Kuliah Tetap (Master Schedule):
${JSON.stringify(masterSchedule || [], null, 2)}

Jadwal Berjalan Saat Ini (Existing Tasks):
${JSON.stringify(existingTasks || [], null, 2)}

Perintah User / Aktivitas Baru yang Harus Dijadwalkan atau Disesuaikan:
"${text}"`;

    // 4. Inisialisasi Gemini SDK dengan model gemini-2.5-flash terbaru
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: "application/json" },
      systemInstruction: instruksiSistem
    });

    // 5. Generate Content dari Gemini
    const result = await model.generateContent(promptLengkap);
    const responseText = result.response.text();
    
    // Clean potential markdown formatting jika AI tidak sengaja menyertakannya
    const cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const tasksData = JSON.parse(cleanedText);

    // 6. Mapping Resilience dan Preservasi status isCompleted
    const formattedTasks = tasksData.map(t => {
      // Cari apakah tugas ini sudah ada sebelumnya untuk mempertahankan status selesainya
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

    // 7. Bersihkan semua task lama di DB lalu simpan daftar baru
    await Task.deleteMany({});
    const savedTasks = await Task.insertMany(formattedTasks);
    
    res.status(201).json({
      message: "Successfully generated, adjusted, and saved tasks",
      tasks: savedTasks
    });

  } catch (error) {
    console.error("Gemini Generate Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Routes Lainnya
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/streak', require('./routes/streak'));
app.use('/api/template', require('./routes/template'));
app.use('/api/review', require('./routes/review'));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.warn("⚠️ MONGODB_URI is not defined in .env file. Skipping database connection for now.");
} else {
  mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));
}

// Serve static assets jika di environment production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  app.get(/.*/, (req, res) => { 
    res.sendFile(path.resolve(__dirname, '../dist', 'index.html'));
  });
}

// Jalankan Server Port
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});