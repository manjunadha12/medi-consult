import express from 'express';
const router = express.Router();
import { 
  getDashboardSummary, 
  getDoctors, 
  getPatients, 
  verifyDoctor, 
  backupSystem,
  deleteDoctor,
  deletePatient,
  toggleDoctorStatus,
  togglePatientStatus,
  getPatientDetails,
  getDoctorDetails,
  updateDoctorDetails,
  updatePatientDetails,
  getProfileAuditHistory,
  getPayments,
  overridePaymentStatus
} from '../controllers/adminController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/roleCheck.js';

router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard-summary', getDashboardSummary);
router.get('/doctors', getDoctors);
router.get('/patients', getPatients);
router.get('/doctor/:doctorId', getDoctorDetails);
router.put('/doctor/:doctorId', updateDoctorDetails);
router.get('/patient/:patientId', getPatientDetails);
router.put('/patient/:patientId', updatePatientDetails);
router.get('/audit-history/:targetId', getProfileAuditHistory);
router.post('/doctor/:id/verify', verifyDoctor);
router.post('/doctor/:id/toggle-status', toggleDoctorStatus);
router.delete('/doctor/:id', deleteDoctor);
router.post('/patient/:id/toggle-status', togglePatientStatus);
router.delete('/patient/:id', deletePatient);
router.get('/payments', getPayments);
router.put('/payment-override/:id', overridePaymentStatus);
router.post('/backup', backupSystem);

export default router;
