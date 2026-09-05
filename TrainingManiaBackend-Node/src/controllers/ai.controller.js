import fs from 'fs';
import prisma from '../config/db.js';
import { extractTextFromPdf } from '../services/extractor.service.js';
import { generateQuestionsFromText, askAiTutor } from '../services/ai.service.js';

export async function generateQuestions(req, res, next) {
  let tempFilePath = null;
  try {
    const pdfFile = req.file;

    const mcqCount = parseInt(req.body.mcq_count || 0, 10) || 0;
    const fibCount = parseInt(req.body.fib_count || 0, 10) || 0;
    const shortCount = parseInt(req.body.short_count || 0, 10) || 0;

    if (!pdfFile) {
      return res.status(400).json({ error: 'PDF file is required' });
    }

    tempFilePath = pdfFile.path;

    // 1. Extract Text from PDF
    const textContent = await extractTextFromPdf(tempFilePath);

    if (!textContent || textContent.trim().length < 50) {
      return res.status(400).json({ error: 'Could not extract sufficient text from PDF' });
    }

    // 2. Call Gemini
    const questions = await generateQuestionsFromText(textContent, {
      mcqCount,
      fibCount,
      shortCount,
    });

    return res.status(200).json({ questions });
  } catch (error) {
    console.error('[AIController] Question generation error:', error.message);
    return res.status(500).json({ error: `AI Generation Failed: ${error.message}` });
  } finally {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (e) {
        // ignore cleanup error
      }
    }
  }
}

export async function getChatHistory(req, res, next) {
  try {
    const candidateId = req.query.candidate_id ? parseInt(req.query.candidate_id, 10) : null;
    const trainingId = req.query.training_id ? parseInt(req.query.training_id, 10) : null;

    if (!candidateId || !trainingId) {
      return res.status(400).json({ error: 'Missing candidate_id or training_id' });
    }

    const messages = await prisma.chatMessage.findMany({
      where: {
        candidate_id: candidateId,
        training_module_id: trainingId,
      },
      orderBy: { timestamp: 'asc' },
    });

    const data = messages.map((m) => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      text: m.message,
    }));

    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}

export async function postChatMessage(req, res, next) {
  try {
    const { training_id, candidate_id, message } = req.body;

    if (!training_id || !message) {
      return res.status(400).json({ error: 'Missing training_id or message' });
    }

    const trainingIdInt = parseInt(training_id, 10);
    const candidateIdInt = candidate_id ? parseInt(candidate_id, 10) : null;

    const training = await prisma.trainingModule.findUnique({
      where: { id: trainingIdInt },
    });

    if (!training) {
      return res.status(404).json({ error: 'Training module not found' });
    }

    // Call AI Tutor
    let aiText = '';
    try {
      aiText = await askAiTutor(training.title, training.extracted_text, message);
    } catch (aiErr) {
      console.error('[AIController] Tutor chat error:', aiErr.message);
      aiText = `AI Error: ${aiErr.message}`;
    }

    // Persist messages if candidate provided
    if (candidateIdInt) {
      try {
        const candidate = await prisma.candidate.findUnique({
          where: { id: candidateIdInt },
        });

        if (candidate) {
          await prisma.chatMessage.create({
            data: {
              candidate_id: candidateIdInt,
              training_module_id: trainingIdInt,
              sender: 'user',
              message,
            },
          });

          await prisma.chatMessage.create({
            data: {
              candidate_id: candidateIdInt,
              training_module_id: trainingIdInt,
              sender: 'ai',
              message: aiText,
            },
          });
        }
      } catch (dbErr) {
        console.error('[AIController] Error saving chat history:', dbErr.message);
      }
    }

    return res.status(200).json({ response: aiText });
  } catch (error) {
    next(error);
  }
}

export default {
  generateQuestions,
  getChatHistory,
  postChatMessage,
};
