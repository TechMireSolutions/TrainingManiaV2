import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  return new GoogleGenerativeAI(apiKey);
}

/**
 * Generate assessment questions using Gemini
 * @param {string} textContent - Extracted course text
 * @param {Object} counts - Question counts
 * @param {number} counts.mcqCount
 * @param {number} counts.fibCount
 * @param {number} counts.shortCount
 * @returns {Promise<Array>} Array of question objects
 */
export async function generateQuestionsFromText(textContent, { mcqCount = 0, fibCount = 0, shortCount = 0 }) {
  const genAI = getGenAI();
  const truncatedText = textContent.slice(0, 30000);

  const prompt = `
You are an expert examiner. Generate assessment questions strictly based on the following training content:

--- CONTENT START ---
${truncatedText}
--- CONTENT END ---

TASK:
Generate exactly:
- ${mcqCount} Multiple Choice Questions (type: 'mcq')
- ${fibCount} Fill in the Blank Questions (type: 'fib')
- ${shortCount} Short Answer Questions (type: 'short_answer')

TOTAL QUESTIONS: ${mcqCount + fibCount + shortCount}

OUTPUT FORMAT:
Return ONLY a valid JSON array of objects. Do not include any markdown formatting like \`\`\`json or explanations.

Each object must follow this structure:
- For 'mcq': {"question": "...", "type": "mcq", "options": ["Option 1", "Option 2", "Option 3", "Option 4"], "correctAnswer": "Exact matching option from options"}
- For 'fib': {"question": "Sentences with a ____ represent a blank.", "type": "fib", "answer": "word"}
- For 'short_answer': {"question": "Explain the concept of X.", "type": "short_answer", "answer": "A concise model answer."}

Ensure questions are professional, accurate, and directly derived from the provided content.
`;

  const candidateModels = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-pro'];
  let lastError = null;

  for (const modelName of candidateModels) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      let rawText = response.text().trim();

      // Clean markdown if present
      const match = rawText.match(/\[.*\]/s);
      if (match) {
        rawText = match[0];
      } else {
        rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      }

      const questions = JSON.parse(rawText);
      if (!Array.isArray(questions)) {
        throw new Error('AI did not return a list of questions');
      }

      return questions;
    } catch (err) {
      console.warn(`[AIService] Model ${modelName} question generation attempt failed:`, err.message);
      lastError = err;
    }
  }

  throw new Error(`AI Generation Failed: ${lastError ? lastError.message : 'Unknown error'}`);
}

/**
 * Ask the AI Tutor a question with context grounding
 * @param {string} trainingTitle - Title of the course
 * @param {string|null} contextText - Extracted text of course (PDF / transcript)
 * @param {string} userMessage - Learner's query
 * @returns {Promise<string>} AI answer
 */
export async function askAiTutor(trainingTitle, contextText, userMessage) {
  const genAI = getGenAI();
  let prompt = '';

  if (contextText && contextText.trim().length > 0) {
    const limit = 50000;
    const truncatedContext = contextText.slice(0, limit);
    prompt = `You are an intelligent AI Tutor for the training module: "${trainingTitle}".
    
YOUR TASK:
Answer based strictly on the provided 'Training Content' below.

--- TRAINING CONTENT START ---
${truncatedContext}
--- TRAINING CONTENT END ---

STUDENT QUESTION: ${userMessage}

ANSWER:`;
  } else {
    prompt = `You are an intelligent AI Tutor for "${trainingTitle}".
Currently, the specific content is not processed.
Answer using general knowledge.

STUDENT QUESTION: ${userMessage}

ANSWER:`;
  }

  const candidateModels = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-pro'];
  let lastError = null;

  for (const modelName of candidateModels) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const aiText = response.text();
      return aiText || 'AI Response was empty or blocked by safety filters.';
    } catch (err) {
      console.warn(`[AIService] Model ${modelName} tutor chat attempt failed:`, err.message);
      lastError = err;
    }
  }

  throw new Error(`AI Error: All models failed. Details: ${lastError ? lastError.message : 'Unknown error'}`);
}

export default {
  generateQuestionsFromText,
  askAiTutor,
};
