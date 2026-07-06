require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function run() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: "application/json" },
      systemInstruction: "Kamu adalah asisten penjadwalan. Kembalikan array JSON berisi objek dengan properti taskName, category, day, startTime, endTime, priority, isCompleted."
    });

    const result = await model.generateContent("Buatkan jadwal belajar React di hari Senin jam 9 pagi.");
    console.log("SUCCESS!");
    console.log(result.response.text());
  } catch (e) {
    console.error("FAILED:", e);
  }
}
run();
