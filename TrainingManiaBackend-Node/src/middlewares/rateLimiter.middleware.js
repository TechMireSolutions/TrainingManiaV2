import rateLimit from 'express-rate-limit';

// Standard response payload matching DRF error structure
const rateLimitHandler = (message) => (req, res) => {
  res.status(429).json({
    error: 'Too Many Requests',
    message,
  });
};

// 1. Auth Limiter: Prevents credential stuffing / brute force
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 attempts per IP per window to allow smooth admin/candidate tests
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler('Too many login attempts. Please try again after 15 minutes.'),
});

// 2. AI Generation Limiter: Protects Gemini API quota and expensive processing
export const aiGenerationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 generation requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler('AI generation quota exceeded for this minute. Please wait before generating more questions.'),
});

// 3. AI Chatbot Limiter: Balances interactive conversation with API costs
export const aiChatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 messages per minute
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler('You are sending messages too quickly. Please pause for a moment.'),
});

export default {
  authLimiter,
  aiGenerationLimiter,
  aiChatLimiter,
};
