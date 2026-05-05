# FocusFlow AI - Testing & Troubleshooting Guide

Dokumen ini berisi panduan untuk melakukan testing aplikasi FocusFlow AI (Frontend, Backend, MongoDB, dan Gemini API) serta cara melakukan troubleshooting jika terjadi kendala (error).

## 1. Persiapan & Instalasi

Pastikan Anda sudah menginstal dependensi (node_modules) di kedua folder (root dan server).
Jika belum, jalankan perintah ini di terminal:

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
```

## 2. Testing Koneksi Backend (MongoDB & Gemini API)

Backend bertanggung jawab untuk berkomunikasi dengan database (MongoDB) dan AI (Gemini API).

### Cara Menjalankan Backend
1. Buka terminal baru dan masuk ke folder `server`:
   ```bash
   cd server
   ```
2. Pastikan file `.env` di dalam folder `server` sudah terisi dengan `MONGODB_URI` dan `GEMINI_API_KEY`.
3. Jalankan server:
   ```bash
   node server.js
   ```

### Indikator Keberhasilan:
- Anda akan melihat tulisan: `🚀 Server is running on port 5001`
- Jika koneksi database berhasil, akan muncul: `✅ Connected to MongoDB Atlas`

### Menguji Gemini API Secara Langsung (Opsional)
Anda dapat mengecek secara langsung apakah API key Gemini Anda valid dengan menjalankan script test yang sudah disediakan:
```bash
cd server
node test-models.js
```
Jika berhasil, script ini akan memunculkan daftar model Gemini yang tersedia.

## 3. Testing Frontend (Aplikasi Web)

Frontend dibangun menggunakan React (Vite).

### Cara Menjalankan Frontend
1. Buka terminal baru di folder utama aplikasi (`focusflow_ai`).
2. Jalankan perintah:
   ```bash
   npm run dev
   ```
3. Buka browser dan akses alamat lokal yang diberikan (biasanya `http://localhost:3000` atau `http://localhost:5173`).

### Indikator Keberhasilan / Cara Pengujian di Aplikasi:
- **Testing MongoDB (CRUD Task):** Coba tambahkan Task baru dari menu "Today". Jika task berhasil ditambahkan, diubah (dicentang), atau dihapus, maka koneksi frontend -> backend -> database sudah berjalan sempurna.
- **Testing Gemini API (AI Planner):** Masuk ke tab "Planner", lalu tulis rencana mingguan Anda di kolom teks dan klik "Generate Schedule". Jika AI memberikan jadwal task secara otomatis, maka Gemini API berfungsi dengan baik.
- **Testing Gemini API (Weekly Review):** Masuk ke tab "Review", tulis refleksi mingguan Anda, lalu klik "Get AI Feedback". Jika AI memberikan kalimat motivasi, maka fitur review AI berfungsi dengan baik.

---

## 4. Troubleshooting (Masalah yang Sering Terjadi)

### A. Error MongoDB Tidak Terkoneksi (`MongooseServerSelectionError`)
- **Penyebab:** Biasanya karena IP Address Anda tidak diizinkan (whitelisted) di konfigurasi Network Access MongoDB Atlas, atau salah memasukkan username/password/uri di `.env`.
- **Solusi:**
  1. Buka [MongoDB Atlas](https://cloud.mongodb.com/).
  2. Masuk ke menu **Network Access** di sebelah kiri.
  3. Klik **Add IP Address** -> Pilih **Allow Access From Anywhere** (`0.0.0.0/0`) -> Confirm.
  4. Pastikan `MONGODB_URI` di `server/.env` benar.

### B. Error Gemini API (`API_KEY_INVALID` atau Error Generate Content)
- **Penyebab:** API Key kadaluarsa, salah ketik, atau kuota habis.
- **Solusi:**
  1. Buka [Google AI Studio](https://aistudio.google.com/app/apikey).
  2. Buat API key baru.
  3. Update nilai `GEMINI_API_KEY` di `server/.env`.
  4. Restart terminal backend (`Ctrl + C` lalu `node server.js` lagi).

### C. Error Port Sudah Digunakan (`EADDRINUSE: address already in use :::5001`)
- **Penyebab:** Anda mencoba menjalankan backend dua kali sehingga port 5001 bentrok.
- **Solusi:**
  1. Cari terminal yang sedang menjalankan backend sebelumnya, lalu matikan dengan menekan `Ctrl + C`.
  2. Jika terminal tersebut hilang/tertutup tapi proses masih berjalan di background, Anda bisa mematikannya secara paksa (di Windows: Buka Task Manager -> End Task untuk `Node.js` process).

### D. Data Task Tidak Muncul di Frontend (Tiba-tiba Kosong)
- **Penyebab:** Server backend belum dinyalakan atau frontend mengakses API URL yang salah.
- **Solusi:**
  1. Pastikan Anda sudah menjalankan dua terminal (satu untuk `npm run dev` dan satu untuk `node server.js`).
  2. Coba periksa *Inspect Element* (F12) -> tab **Console** atau **Network** di browser untuk melihat apakah ada *CORS error* atau *Connection Refused*.
