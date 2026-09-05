import { Router } from 'express';
import {
  createTrainingModule,
  getCandidates,
  createCandidate,
  deleteCandidate,
  getTrainings,
  deleteTraining,
  getEnrollments,
  createEnrollment,
  updateEnrollment,
  deleteEnrollment,
  getReports,
  deleteReports,
  getNotifications,
} from '../controllers/admin.controller.js';
import { trainingUploadFields } from '../middlewares/upload.middleware.js';
import { validate, createTrainingSchema, candidateRegistrationSchema } from '../validators/schemas.js';
import { validateBody } from '../middlewares/validate.middleware.js';

const router = Router();

// Training Module Creation
router.post('/training/create', trainingUploadFields, validate(createTrainingSchema), createTrainingModule);
router.post('/training/create/', trainingUploadFields, validate(createTrainingSchema), createTrainingModule);

// Admin Candidates
router.get('/admin/candidates', getCandidates);
router.get('/admin/candidates/', getCandidates);
router.post('/admin/candidates', validateBody(candidateRegistrationSchema), createCandidate);
router.post('/admin/candidates/', validateBody(candidateRegistrationSchema), createCandidate);
router.delete('/admin/candidates', deleteCandidate);
router.delete('/admin/candidates/', deleteCandidate);
router.delete('/admin/candidates/:id', deleteCandidate);
router.delete('/admin/candidates/:id/', deleteCandidate);

// Admin Trainings
router.get('/admin/trainings', getTrainings);
router.get('/admin/trainings/', getTrainings);
router.delete('/admin/trainings/:id', deleteTraining);
router.delete('/admin/trainings/:id/', deleteTraining);

// Admin Enrollments
router.get('/admin/enrollments', getEnrollments);
router.get('/admin/enrollments/', getEnrollments);
router.post('/admin/enrollments', createEnrollment);
router.post('/admin/enrollments/', createEnrollment);
router.patch('/admin/enrollments', updateEnrollment);
router.patch('/admin/enrollments/', updateEnrollment);
router.delete('/admin/enrollments', deleteEnrollment);
router.delete('/admin/enrollments/', deleteEnrollment);
router.delete('/admin/enrollments/:id', deleteEnrollment);
router.delete('/admin/enrollments/:id/', deleteEnrollment);

// Admin Reports
router.get('/admin/reports', getReports);
router.get('/admin/reports/', getReports);
router.delete('/admin/reports', deleteReports);
router.delete('/admin/reports/', deleteReports);

// Admin Notifications
router.get('/admin/notifications', getNotifications);
router.get('/admin/notifications/', getNotifications);

export default router;
