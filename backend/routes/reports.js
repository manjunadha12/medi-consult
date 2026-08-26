import express from 'express';
const router = express.Router();
import { uploadReport, getPatientReports, deleteReport, getReportById } from '../controllers/reportController.js';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

router.post('/upload', protect, upload.single('report'), uploadReport);
router.get('/patient/:patientId', protect, getPatientReports);
router.get('/:id', protect, getReportById);
router.delete('/:id', protect, deleteReport);

export default router;
