const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize dynamically so it doesn't crash on import if key is missing
let genAI;
try {
    if (process.env.GEMINI_API_KEY) {
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
} catch (e) {
    console.error("Failed to initialize Google Generative AI", e);
}

// Model priority: try flash first, fall back to pro
const MODEL_PRIORITY = ["gemini-1.5-flash", "gemini-1.5-pro"];

/**
 * Retry a function up to `retries` times with exponential backoff.
 */
async function withRetry(fn, retries = 2, delayMs = 1500) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const is503 = err?.status === 503 || err?.message?.includes('503');
      if (is503 && attempt < retries) {
        console.warn(`Gemini 503 – retrying in ${delayMs}ms... (attempt ${attempt + 1}/${retries})`);
        await new Promise(r => setTimeout(r, delayMs));
        delayMs *= 2; // exponential backoff
      } else {
        throw err;
      }
    }
  }
}

/**
 * Try each model in MODEL_PRIORITY until one succeeds.
 */
async function withModelFallback(promptFn) {
  if (!genAI) throw new Error("Gemini API key is not configured.");
  let lastError;
  for (const modelName of MODEL_PRIORITY) {
    const model = genAI.getGenerativeModel({ model: modelName });
    try {
      return await withRetry(() => promptFn(model));
    } catch (err) {
      console.warn(`Model ${modelName} failed:`, err?.status || err?.message);
      lastError = err;
    }
  }
  throw lastError;
}

async function parseWeeklyTasks(text) {
  const prompt = `
  You are an expert personal productivity assistant using the Eisenhower Matrix.
  Analyze the following text detailing a user's plan for the week.
  Extract the tasks and for each task, assign:
  - title (string, concise)
  - quadrant (string, must be one of: 'Q1', 'Q2', 'Q3', 'Q4')
  - suggestedDay (string, one of: 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')
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
    return await withModelFallback(async (model) => {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      return JSON.parse(cleanedText);
    });
  } catch (error) {
    console.error("Gemini parseWeeklyTasks Error:", error);
    throw error;
  }
}

async function generateWeeklySummary(stats) {
  const prompt = `
  You are a motivational productivity coach. The user just finished their week.
  Here are their stats:
  - Total Q1 tasks completed: ${stats.q1Completed} out of ${stats.q1Total}
  - Total tasks completed across all quadrants: ${stats.totalCompleted} out of ${stats.totalTasks}
  - Streak maintained this week: ${stats.streakDays} days
  - User's reflection notes: "${stats.reflectionNotes}"

  Write a short, powerful, motivational summary sentence (max 2 sentences) in English
  to encourage them for the next week based on these stats.
  Return ONLY the sentence, nothing else.
  `;

  try {
    return await withModelFallback(async (model) => {
      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    });
  } catch (error) {
    console.error("Gemini generateWeeklySummary Error:", error);
    throw error;
  }
}

module.exports = {
  parseWeeklyTasks,
  generateWeeklySummary
};
