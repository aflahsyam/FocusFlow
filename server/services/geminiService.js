const { GoogleGenerativeAI } = require("@google/generative-ai");

// We'll initialize it dynamically so it doesn't crash on import if key is missing initially
let genAI;
try {
    if (process.env.GEMINI_API_KEY) {
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
} catch (e) {
    console.error("Failed to initialize Google Generative AI", e);
}

async function parseWeeklyTasks(text) {
  if (!genAI) throw new Error("Gemini API key is not configured.");
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  
  const prompt = `
  You are an expert personal productivity assistant using the Eisenhower Matrix.
  Analyze the following text detailing a user's plan for the week.
  Extract the tasks and for each task, assign:
  - title (string, concise)
  - quadrant (string, must be one of: 'Q1', 'Q2', 'Q3', 'Q4')
  - suggestedDay (string, one of: 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu')
  - suggestedTime (string, format 'HH:MM')
  - duration (number, estimated hours, default to 1)

  Rules for Quadrants:
  Q1: Important & Urgent
  Q2: Important & Not Urgent
  Q3: Not Important & Urgent
  Q4: Not Important & Not Urgent

  Return ONLY a valid JSON array of objects with these properties. No markdown formatting, no backticks.
  Text:
  ${text}
  `;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    // remove markdown code block backticks if present
    const cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Gemini parseWeeklyTasks Error:", error);
    throw error;
  }
}

async function generateWeeklySummary(stats) {
  if (!genAI) throw new Error("Gemini API key is not configured.");
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  
  const prompt = `
  You are a motivational productivity coach. The user just finished their week.
  Here are their stats:
  - Total Q1 tasks completed: ${stats.q1Completed} out of ${stats.q1Total}
  - Total tasks completed across all quadrants: ${stats.totalCompleted} out of ${stats.totalTasks}
  - Streak maintained this week: ${stats.streakDays} days
  - User's reflection notes: "${stats.reflectionNotes}"

  Write a short, powerful, motivational summary sentence (max 2 sentences) in Bahasa Indonesia 
  to encourage them for the next week based on these stats.
  Return ONLY the sentence, nothing else.
  `;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error("Gemini generateWeeklySummary Error:", error);
    throw error;
  }
}

module.exports = {
  parseWeeklyTasks,
  generateWeeklySummary
};
