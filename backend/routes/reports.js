import express from 'express';
const router = express.Router();
import {
  uploadReport,
  getPatientReports,
  deleteReport,
  getReportById,
  processReportLocally,
  verifyReportValues,
  clearAllPatientReports
} from '../controllers/reportController.js';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

router.post('/upload', protect, upload.single('report'), uploadReport);
router.get('/patient/:patientId', protect, getPatientReports);
router.delete('/patient/:patientId/clear-all', protect, clearAllPatientReports);
router.get('/:id', protect, getReportById);
router.post('/process-local', protect, processReportLocally);
router.post('/verify-values', protect, verifyReportValues);
router.delete('/:id', protect, deleteReport);

export default router;
