import { Router } from 'express';
import {
  candidateLogin,
  candidateSetPassword,
  candidateForgotPassword,
  adminRegister,
  adminLogin,
  adminForgotPassword,
} from '../controllers/auth.controller.js';
import { authLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = Router();

// Candidate Auth
router.post('/auth/login', authLimiter, candidateLogin);
router.post('/auth/login/', authLimiter, candidateLogin);

router.post('/auth/set-password', authLimiter, candidateSetPassword);
router.post('/auth/set-password/', authLimiter, candidateSetPassword);

router.post('/auth/forgot-password', authLimiter, candidateForgotPassword);
router.post('/auth/forgot-password/', authLimiter, candidateForgotPassword);

// Admin Auth
router.post('/admin/register', authLimiter, adminRegister);
router.post('/admin/register/', authLimiter, adminRegister);

router.post('/admin/login', authLimiter, adminLogin);
router.post('/admin/login/', authLimiter, adminLogin);

router.post('/admin/forgot-password', authLimiter, adminForgotPassword);
router.post('/admin/forgot-password/', authLimiter, adminForgotPassword);

export default router;
