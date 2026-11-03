import express from 'express';
const router = express.Router();
import {
  getDoctorProfile,
  updateDoctorProfile,
  getDashboardSummary,
  getPatientQueue,
  updateAvailability,
  searchPatient,
  getPatientDetails,
  addPrescription,
  getPrescriptionTemplates,
  createPrescriptionTemplate,
  getDoctorPrescriptions,
  deletePrescription,
  markCompleted,
  getDoctorReviews
} from '../controllers/doctorController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/roleCheck.js';

router.use(protect);
router.use(authorize('doctor'));

router.get('/profile', getDoctorProfile);
router.put('/profile', updateDoctorProfile);
router.get('/dashboard-summary', getDashboardSummary);
router.get('/patient-queue', getPatientQueue);
router.post('/update-availability', updateAvailability);
router.get('/search-patient', searchPatient);
router.get('/patient/:patientId', getPatientDetails);
router.post('/prescription', addPrescription);
router.get('/prescriptions', getDoctorPrescriptions);
router.delete('/prescription/:id', deletePrescription);
router.get('/prescription-templates', getPrescriptionTemplates);
router.post('/prescription-templates', createPrescriptionTemplate);
router.post('/mark-completed', markCompleted);
router.get('/reviews', getDoctorReviews);

export default router;
