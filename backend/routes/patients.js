import express from 'express';
const router = express.Router();
import { getPatientProfile, updatePatientProfile, getPatientPrescriptions, deletePrescription, addDoctorReview, raiseComplaint } from '../controllers/patientController.js';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

router.get('/profile/:userId', protect, getPatientProfile);
router.put('/profile/:userId', protect, updatePatientProfile);
router.get('/prescriptions', protect, getPatientPrescriptions);
router.delete('/prescription/:id', protect, deletePrescription);
router.post('/review', protect, addDoctorReview);
router.post('/raise-complaint', protect, raiseComplaint);

router.get('/node-ping', (req, res) => res.json({ message: "Patient node active" }));

// Avatar Upload
router.post('/upload-avatar', protect, upload.single('avatar'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    // Support nested folders in URL response
    const relativeUrl = req.file.path.replace(/\\/g, '/').split('/uploads/')[1];
    console.log(`[AVATAR] File received: ${relativeUrl}`);
    res.json({ url: `/uploads/${relativeUrl}` });
  } catch (err) {
    console.error("[AVATAR_ROUTE_ERR]", err);
    res.status(500).json({ message: "Internal server error during upload" });
  }
});

export default router;
