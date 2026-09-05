import { Router } from 'express';
import {
  getCandidateDashboard,
  getTrainingDetail,
  updateTrainingDetail,
  submitTest,
} from '../controllers/candidate.controller.js';
import { submitTestUploadFields } from '../middlewares/upload.middleware.js';
import { validate, submitTestSchema } from '../validators/schemas.js';

const router = Router();

// Candidate Dashboard
router.get('/candidate/:candidate_id/dashboard', getCandidateDashboard);
router.get('/candidate/:candidate_id/dashboard/', getCandidateDashboard);

// Training Detail
router.get('/training/:id', getTrainingDetail);
router.get('/training/:id/', getTrainingDetail);
router.put('/training/:id', updateTrainingDetail);
router.put('/training/:id/', updateTrainingDetail);

// Submit Test (supports multipart and json)
router.post('/test/submit', submitTestUploadFields, validate(submitTestSchema), submitTest);
router.post('/test/submit/', submitTestUploadFields, validate(submitTestSchema), submitTest);

export default router;
