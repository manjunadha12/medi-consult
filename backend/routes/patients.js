import express from 'express';
const router = express.Router();
import { getPatientProfile, updatePatientProfile, getPatientPrescriptions, deletePrescription, addDoctorReview } from '../controllers/patientController.js';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

router.get('/profile/:userId', protect, getPatientProfile);
router.put('/profile/:userId', protect, updatePatientProfile);
router.get('/prescriptions', protect, getPatientPrescriptions);
router.delete('/prescription/:id', protect, deletePrescription);
router.post('/review', protect, addDoctorReview);

router.get('/node-ping', (req, res) => res.json({ message: "Patient node active" }));

// Avatar Upload
router.post('/upload-avatar', protect, upload.single('avatar'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    console.log(`[AVATAR] File received: ${req.file.filename}`);
    res.json({ url: `/uploads/${req.file.filename}` });
  } catch (err) {
    console.error("[AVATAR_ROUTE_ERR]", err);
    res.status(500).json({ message: "Internal server error during upload" });
  }
});

export default router;
