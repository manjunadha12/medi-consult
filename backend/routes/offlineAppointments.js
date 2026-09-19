import express from 'express';
import {
  getHospitals,
  getHospitalDetails,
  getHospitalDoctors,
  createOfflineAppointment,
  getPatientOfflineAppointments,
  getOfflineAppointmentDetails,
  cancelOfflineAppointment,
  scanCheckInQR,
  updateAppointmentStatus,
  completeOfflineConsultation,
  getHospitalOfflineQueue,
  getAdminOfflineStats
} from '../controllers/offlineAppointmentController.js';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Public / Semi-public routes for discovery
router.get('/hospitals', getHospitals);
router.get('/hospitals/:id', getHospitalDetails);
router.get('/doctors', getHospitalDoctors);

// Protected routes
router.use(protect);

router.post('/book', upload.array('medicalReports', 5), createOfflineAppointment);
router.get('/patient-appointments', getPatientOfflineAppointments);
router.get('/appointment/:id', getOfflineAppointmentDetails);
router.post('/cancel/:id', cancelOfflineAppointment);
router.post('/scan-checkin', scanCheckInQR);
router.patch('/status/:id', updateAppointmentStatus);
router.post('/complete/:id', completeOfflineConsultation);
router.get('/doctor-queue', getHospitalOfflineQueue);
router.get('/admin-stats', getAdminOfflineStats);

export default router;
