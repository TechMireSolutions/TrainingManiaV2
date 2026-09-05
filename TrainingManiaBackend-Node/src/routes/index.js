import { Router } from 'express';
import authRoutes from './auth.routes.js';
import superadminRoutes from './superadmin.routes.js';
import adminRoutes from './admin.routes.js';
import candidateRoutes from './candidate.routes.js';
import aiRoutes from './ai.routes.js';

const router = Router();

router.use(authRoutes);
router.use(superadminRoutes);
router.use(adminRoutes);
router.use(candidateRoutes);
router.use(aiRoutes);

export default router;
