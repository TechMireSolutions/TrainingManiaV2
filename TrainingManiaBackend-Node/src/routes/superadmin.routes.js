import { Router } from 'express';
import {
  getStats,
  getAdmins,
  createAdmin,
  deleteAdmin,
  resendAdminCredentials,
  getGlobalCandidates,
  deleteGlobalCandidate,
  getGlobalTrainings,
  deleteGlobalTraining,
  getTrainingEnrollments,
  checkEmailStatus,
} from '../controllers/superadmin.controller.js';

const router = Router();

// Stats
router.get('/superadmin/stats', getStats);
router.get('/superadmin/stats/', getStats);

// Admins
router.get('/superadmin/admins', getAdmins);
router.get('/superadmin/admins/', getAdmins);
router.post('/superadmin/admins', createAdmin);
router.post('/superadmin/admins/', createAdmin);
router.post('/superadmin/admins/:id/resend-code', resendAdminCredentials);
router.post('/superadmin/admins/:id/resend-code/', resendAdminCredentials);
router.delete('/superadmin/admins/:id', deleteAdmin);
router.delete('/superadmin/admins/:id/', deleteAdmin);

// Candidates
router.get('/superadmin/candidates', getGlobalCandidates);
router.get('/superadmin/candidates/', getGlobalCandidates);
router.delete('/superadmin/candidates/:id', deleteGlobalCandidate);
router.delete('/superadmin/candidates/:id/', deleteGlobalCandidate);

// Trainings
router.get('/superadmin/trainings', getGlobalTrainings);
router.get('/superadmin/trainings/', getGlobalTrainings);
router.delete('/superadmin/trainings/:id', deleteGlobalTraining);
router.delete('/superadmin/trainings/:id/', deleteGlobalTraining);
router.get('/superadmin/trainings/:training_id/candidates', getTrainingEnrollments);
router.get('/superadmin/trainings/:training_id/candidates/', getTrainingEnrollments);

// Check bounces
router.post('/superadmin/check-bounces', checkEmailStatus);
router.post('/superadmin/check-bounces/', checkEmailStatus);

export default router;
