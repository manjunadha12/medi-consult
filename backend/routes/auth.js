import express from 'express';
const router = express.Router();
import { 
  registerPatient, 
  registerDoctor, 
  login, 
  getMe,
  registerPatientOtp,
  verifyPatientOtp,
  resendPatientOtp,
  loginRequestOtp,
  loginVerifyOtp,
  forgotPasswordRequestOtp,
  forgotPasswordResendOtp,
  forgotPasswordVerifyAndReset,
  updateSecuritySettings,
  googleLogin
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import { authLimiter } from '../middleware/rateLimit.js';

router.post('/register/patient', authLimiter, registerPatient);
router.post('/register/patient-otp', authLimiter, registerPatientOtp);
router.post('/register/verify-patient', authLimiter, verifyPatientOtp);
router.post('/register/resend-otp', authLimiter, resendPatientOtp);
router.post('/register/doctor', authLimiter, upload.array('documents', 10), registerDoctor);
router.post('/login', authLimiter, login);
router.post('/google', authLimiter, googleLogin);
router.post('/logout', (req, res) => res.json({ success: true, message: 'Logged out successfully' }));
router.post('/login/request-otp', authLimiter, loginRequestOtp);
router.post('/login/verify-otp', authLimiter, loginVerifyOtp);
router.post('/forgot-password/request-otp', authLimiter, forgotPasswordRequestOtp);
router.post('/forgot-password/resend-otp', authLimiter, forgotPasswordResendOtp);
router.post('/forgot-password/reset', authLimiter, forgotPasswordVerifyAndReset);
router.get('/me', protect, getMe);
router.get('/profile', protect, getMe);
router.put('/security-settings', protect, updateSecuritySettings);

export default router;
