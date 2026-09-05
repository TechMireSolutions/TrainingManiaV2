import { Router } from 'express';
import {
  generateQuestions,
  getChatHistory,
  postChatMessage,
} from '../controllers/ai.controller.js';
import { upload } from '../middlewares/upload.middleware.js';
import { aiGenerationLimiter, aiChatLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = Router();

// AI Question Generation from uploaded PDF
router.post('/generate-questions', aiGenerationLimiter, upload.single('pdf_file'), generateQuestions);
router.post('/generate-questions/', aiGenerationLimiter, upload.single('pdf_file'), generateQuestions);

// AI Tutor Chat
router.get('/chat', getChatHistory);
router.get('/chat/', getChatHistory);
router.post('/chat', aiChatLimiter, postChatMessage);
router.post('/chat/', aiChatLimiter, postChatMessage);

export default router;
