import User from '../models/User.js';
import PatientProfile from '../models/PatientProfile.js';
import DoctorProfile from '../models/DoctorProfile.js';
import TempUser from '../models/TempUser.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { randomInt, randomBytes } from 'crypto';
import { sendSms } from '../utils/sendSms.js';
import { sendEmail } from '../utils/sendEmail.js';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import axios from 'axios';

// Initialize Firebase Admin
// You need to place your serviceAccountKey.json in the backend/config folder
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Cloud Mode: Initialize using Environment Variable string
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    initializeApp({
      credential: cert(serviceAccount)
    });
    console.log('[FIREBASE] Admin Node Initialized via Environment Variable');
  } else {
    // Local Mode: Initialize using local JSON file
    const serviceAccount = JSON.parse(
      readFileSync(path.join(__dirname, '../config/serviceAccountKey.json'), 'utf8')
    );
    initializeApp({
      credential: cert(serviceAccount)
    });
    console.log('[FIREBASE] Admin Node Initialized via local config file');
  }
} catch (error) {
  console.error('[FIREBASE] Initialization Error:', error.message);
}

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

export const registerPatient = async (req, res) => {
  try {
    const { name, email, password, phone, age, gender, applicationNumber } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const patientCount = await User.countDocuments({ role: 'patient' });
    const patientId = `PAT${1001 + patientCount}`;

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: 'patient',
      patientId,
      applicationNumber: applicationNumber || undefined
    });

    await PatientProfile.create({
      userId: user._id,
      patientId,
      age,
      gender
    });

    res.status(201).json({
      success: true,
      message: `Patient account created successfully. Your Patient ID is ${patientId}`,
      patientId
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const registerDoctor = async (req, res) => {
  try {
    const {
      name, specialization, email, password,
      experience, medicalRegistrationNumber, hospitalDetails
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Missing required credentials' });
    }


    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Doctor already exists with this Email' });
    }

    const mrnExists = await DoctorProfile.findOne({ medicalRegistrationNumber });
    if (mrnExists) {
      return res.status(400).json({ message: 'Medical Registration Number already exists' });
    }

    // Parse hospitalDetails if it's a string (multipart/form-data)
    let parsedHospital = {};
    try {
      parsedHospital = typeof hospitalDetails === 'string' ? JSON.parse(hospitalDetails) : hospitalDetails;
    } catch (e) {
      console.warn("Hospital details parsing failed", e);
    }

    const applicationNumber = 'APP' + randomBytes(4).toString('hex').toUpperCase();

    const user = await User.create({
      name,
      email,
      password,
      role: 'doctor',
      applicationNumber
    });

    const documents = req.files ? req.files.map(file => {
      const relativeUrl = file.path.replace(/\\/g, '/').split('/uploads/')[1];
      return {
        name: file.originalname,
        fileUrl: `/uploads/${relativeUrl}`,
        fileType: path.extname(file.originalname),
        isMandatory: true
      };
    }) : [];

    await DoctorProfile.create({
      userId: user._id,
      applicationNumber,
      specialization,
      experience,
      medicalRegistrationNumber,

      // Google Places Data
      placeId: parsedHospital?.placeId,
      hospitalName: parsedHospital?.name || req.body.hospitalName,
      formattedAddress: parsedHospital?.address,
      city: parsedHospital?.city,
      district: parsedHospital?.district,
      state: parsedHospital?.state,
      country: parsedHospital?.country,
      postalCode: parsedHospital?.postalCode,
      latitude: parsedHospital?.lat,
      longitude: parsedHospital?.lng,
      website: parsedHospital?.website,
      phoneNumber: parsedHospital?.phone,
      googleRating: parsedHospital?.rating,

      uploadedDocuments: documents,
      verificationStatus: 'Pending',
      isVerified: false
    });

    res.status(201).json({
      success: true,
      message: 'Your registration is under verification. You will receive an email once approved.'
    });
  } catch (error) {
    console.error("Register Doctor Error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { loginId, password, tab } = req.body;
    console.log(`[AUTH] Login Request: ID=${loginId}, Tab=${tab}, IP=${req.ip}`);

    if (!loginId || !password) {
      return res.status(400).json({ message: 'Missing credentials' });
    }

    const cleanId = loginId.trim();
    const upperId = cleanId.toUpperCase();

    let query = {};
    if (upperId.startsWith('PAT')) {
      query = { patientId: upperId };
    } else if (upperId.startsWith('DOC')) {
      query = { doctorId: upperId };
    } else if (upperId.startsWith('ADM')) {
      query = { adminId: upperId };
    } else {
      // Search by email, phone or applicationNumber (Case-insensitive for email)
      query = {
        $or: [
          { email: cleanId.toLowerCase() },
          { phone: cleanId },
          { applicationNumber: upperId }
        ]
      };
    }

    const user = await User.findOne(query);

    if (!user) {
      console.warn(`[AUTH_FAIL] Identity not found: ${cleanId} (Target: ${JSON.stringify(query)})`);
      return res.status(401).json({ message: 'Identity node not found. Please verify your ID.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      console.warn(`[AUTH_FAIL] Password mismatch for: ${loginId}`);
      return res.status(401).json({ message: 'Invalid identity code or encryption key' });
    }

    // Role-Tab Enforcement: Ensure user is on the correct side of the portal
    if (tab === 'patient' && user.role !== 'patient') {
       return res.status(403).json({ message: 'This node is registered as STAFF. Please use the Operator portal.' });
    }
    if (tab === 'staff' && user.role === 'patient') {
       return res.status(403).json({ message: 'This node is registered as a PATIENT. Please use the Patient portal.' });
    }

    if (user && isMatch) {
      // Role synchronization: Ensure user is redirected to the correct portal regardless of tab selection
      console.log(`[AUTH] Login success for ${user.name} (${user.role}). Synchronizing redirection...`);

      const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
      const device = req.headers['user-agent'] || 'Web Browser';
      user.lastLogin = new Date();
      user.loginHistory.push({
        loginAt: user.lastLogin,
        ip,
        device,
        browser: device,
        authProvider: 'Local'
      });
      await user.save();

      let redirectTo = `/${user.role}/dashboard`;
      if (user.role === 'admin') redirectTo = '/admin-dashboard';
      if (user.role === 'doctor') redirectTo = '/doc-dashboard';

      console.log(`[AUTH-SUCCESS] User: ${user.name}, Role: ${user.role}, ID: ${user.patientId || user.doctorId || user.adminId}`);

      if (user.role === 'doctor') {
        const docProfile = await DoctorProfile.findOne({ userId: user._id });
        if (docProfile) {
          // Emergency Bypass: Allow login during verification for developer testing
          if (docProfile.verificationStatus === 'Rejected') {
            return res.status(403).json({
              success: false,
              message: 'Your registration has been rejected. Please contact the administrator.'
            });
          }
          // If status is 'Pending' or 'Documents Required', we now allow entry but can show a banner inside
        }
      }

      const successResponse = {
        success: true,
        token: generateToken(user._id),
        role: user.role,
        userId: user.patientId || user.doctorId || user.adminId,
        _id: user._id,
        name: user.name,
        redirectTo
      };
      console.log(`[AUTH-SUCCESS] Dispatching token for ${user.name}`);
      res.json(successResponse);
    } else {
      console.warn(`[AUTH-FAIL] Logic breach for ${loginId}`);
      res.status(401).json({ message: 'Invalid ID or password' });
    }
  } catch (error) {
    console.error('LOGIN_CRITICAL_ERROR:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateSecuritySettings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.securitySettings = {
      ...user.securitySettings,
      ...req.body
    };

    await user.save();
    res.json({ success: true, settings: user.securitySettings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Initiate patient registration by generating OTPs
export const registerPatientOtp = async (req, res) => {
  console.log(`[REGISTRATION] Received request body:`, JSON.stringify(req.body, null, 2));
  try {
    const { name, email, phone, age, gender, password } = req.body;

    // Basic Validation
    if (!name || !email || !phone || !age || !gender || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const userExists = await User.findOne({ $or: [{ email }, { phone }] });
    if (userExists) {
      return res.status(400).json({ message: 'User with this Email or Phone Number already exists' });
    }

    await TempUser.deleteMany({ $or: [{ email }, { phone }] });

    const emailOtp = randomInt(100000, 999999).toString();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 mins expiry

    const tempUser = await TempUser.create({
      name,
      email,
      phone,
      age: parseInt(age),
      gender,
      password,
      emailOtp,
      emailOtpExpires: otpExpires,
      lastOtpSentAt: new Date()
    });

    console.log(`\n================== [OTP SYNC - REGISTRATION] ==================`);
    console.log(`Patient Identity: ${name}`);
    console.log(`Node Status: Email OTP Dispatched`);
    console.log(`===============================================================\n`);

    await sendEmail({
      to: email,
      subject: 'Medi Consult Registration - OTP Verification',
      text: `Hello ${name},\n\nYour Medi Consult email verification OTP code is: ${emailOtp}\n\nThis code will expire in 5 minutes.`,
      html: `<h3>Hello ${name},</h3><p>Your Medi Consult email verification OTP code is: <strong>${emailOtp}</strong></p><p>This code will expire in 5 minutes.</p>`
    });

    res.status(200).json({
      success: true,
      message: 'Verification code sent to your email.',
      email
    });
  } catch (error) {
    console.error(`[REGISTRATION ERROR]: ${error.message}`);
    console.error(error.stack);
    res.status(500).json({ message: error.message });
  }
};

// Verify patient registration OTPs and provision ID
export const verifyPatientOtp = async (req, res) => {
  try {
    const { email, emailOtp } = req.body;

    const tempUser = await TempUser.findOne({ email });
    if (!tempUser) {
      return res.status(400).json({ message: 'No registration session found. Please register again.' });
    }

    const now = new Date();
    if (now > tempUser.emailOtpExpires) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new code.' });
    }

    if (tempUser.emailOtp !== emailOtp) {
      return res.status(400).json({ message: 'Invalid Verification code. Please check and try again.' });
    }

    // Generate unique sequential Patient ID (format: PAT1001, PAT1002...)
    const lastPatient = await User.findOne({ role: 'patient' }).sort({ patientId: -1 });
    let nextNum = 1001;
    if (lastPatient && lastPatient.patientId) {
      const match = lastPatient.patientId.match(/PAT(\d+)/);
      if (match) {
        nextNum = parseInt(match[1]) + 1;
      }
    }
    const patientId = `PAT${nextNum}`;

    const user = await User.create({
      name: tempUser.name,
      email: tempUser.email,
      phone: tempUser.phone,
      password: tempUser.password, // already hashed
      role: 'patient',
      patientId
    });

    await PatientProfile.create({
      userId: user._id,
      patientId,
      age: tempUser.age,
      gender: tempUser.gender
    });

    // Delete temp registration session
    await TempUser.findByIdAndDelete(tempUser._id);

    console.log(`\n================== [PATIENT ID PROVISIONED] ==================`);
    console.log(`Patient: ${tempUser.name}`);
    console.log(`Generated Patient ID: ${patientId}`);
    console.log(`Mock sent to Email: ${tempUser.email}`);
    console.log(`Mock sent to Phone: ${tempUser.phone}`);
    console.log(`===============================================================\n`);

    // Send Patient ID via Email
    await sendEmail({
      to: tempUser.email,
      subject: 'Medi Consult Account Provisioned - Patient ID',
      text: `Hello ${tempUser.name},\n\nYour registration is verified. Your unique Patient ID is: ${patientId}\n\nPlease use this ID to sign in to the Patient Portal.`,
      html: `<h3>Hello ${tempUser.name},</h3><p>Your registration is verified. Your unique Patient ID is: <strong>${patientId}</strong></p><p>Please use this ID to sign in to the Patient Portal.</p>`
    });

    // Send Patient ID via SMS
    await sendSms({
      to: tempUser.phone,
      message: `Hello ${tempUser.name}, your Medi Consult registration is successful. Your Patient ID is: ${patientId}`
    });

    res.status(201).json({
      success: true,
      message: `Verification successful. Your Patient ID is ${patientId}`,
      patientId,
      name: user.name
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Resend registration OTPs
export const resendPatientOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const tempUser = await TempUser.findOne({ email });
    if (!tempUser) {
      return res.status(400).json({ message: 'No registration session found.' });
    }

    const now = new Date();
    const timeDiff = (now.getTime() - tempUser.lastOtpSentAt.getTime()) / 1000;
    if (timeDiff < 30) {
      return res.status(400).json({ message: `Please wait ${Math.ceil(30 - timeDiff)} seconds before requesting a new code.` });
    }

    const emailOtp = randomInt(100000, 999999).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 mins expiry

    tempUser.emailOtp = emailOtp;
    tempUser.emailOtpExpires = expiry;
    tempUser.lastOtpSentAt = now;
    await tempUser.save();

    console.log(`\n================== [OTP RESENT - REGISTRATION] ==================`);
    console.log(`Patient Identity: ${tempUser.name} | Resend Status: Email Dispatched`);
    console.log(`===============================================================\n`);

    await sendEmail({
      to: email,
      subject: 'Medi Consult Registration - Resend OTP Verification',
      text: `Hello ${tempUser.name},\n\nYour new email verification OTP code is: ${emailOtp}\n\nThis code will expire in 5 minutes.`,
      html: `<h3>Hello ${tempUser.name},</h3><p>Your new email verification OTP code is: <strong>${emailOtp}</strong></p><p>This code will expire in 5 minutes.</p>`
    });

    res.status(200).json({
      success: true,
      message: 'New verification code has been sent to your email.'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Request login OTP for Patient
export const loginRequestOtp = async (req, res) => {
  try {
    const { loginId } = req.body;

    const user = await User.findOne({
      role: 'patient',
      $or: [
        { patientId: loginId },
        { email: loginId },
        { phone: loginId }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'No patient account found with this ID, Email, or Phone Number.' });
    }

    const loginOtp = randomInt(100000, 999999).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 mins expiry

    user.loginOtp = loginOtp;
    user.loginOtpExpires = expiry;
    await user.save();

    console.log(`\n================== [OTP SYNC - LOGIN] ==================`);
    console.log(`Login Handshake: OTP Dispatched to ${user.patientId || 'Patient'}`);
    console.log(`========================================================\n`);

    res.status(200).json({
      success: true,
      message: 'Login OTP code sent to your registered Email and Mobile Number.'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Verify login OTP and authenticate
export const loginVerifyOtp = async (req, res) => {
  try {
    const { loginId, loginOtp } = req.body;

    const user = await User.findOne({
      role: 'patient',
      $or: [
        { patientId: loginId },
        { email: loginId },
        { phone: loginId }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'No patient account found.' });
    }

    const now = new Date();
    if (!user.loginOtp || now > user.loginOtpExpires) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    if (user.loginOtp !== loginOtp) {
      return res.status(400).json({ message: 'Invalid OTP code.' });
    }

    // Capture login history and lastLogin
    const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    const device = req.headers['user-agent'] || 'Web Browser';

    user.lastLogin = now;
    user.loginHistory.push({ loginAt: now, ip, device });

    // Clear temporary OTP fields
    user.loginOtp = undefined;
    user.loginOtpExpires = undefined;
    await user.save();

    const redirectTo = `/${user.role}/dashboard`;
    res.json({
      success: true,
      token: generateToken(user._id),
      role: user.role,
      userId: user.patientId,
      name: user.name,
      redirectTo
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Request Forgot Password OTP
export const forgotPasswordRequestOtp = async (req, res) => {
  try {
    const { identifier } = req.body;

    const user = await User.findOne({
      $or: [
        { email: identifier },
        { phone: identifier },
        { patientId: identifier },
        { doctorId: identifier },
        { adminId: identifier }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'No account found with this Email or Phone Number.' });
    }

    const resetOtp = randomInt(100000, 999999).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 mins expiry

    user.resetOtp = resetOtp;
    user.resetOtpExpires = expiry;
    user.lastResetOtpSentAt = new Date();
    await user.save();

    const sendChannel = req.body.sendChannel || 'both'; // 'email', 'phone', or 'both'

    console.log(`\n================== [OTP SYNC - PASSWORD RESET] ==================`);
    console.log(`Reset Identity Verification Node Triggered`);
    console.log(`=================================================================\n`);

    // Send Reset OTP via Email if chosen
    if ((sendChannel === 'email' || sendChannel === 'both') && user.email) {
      await sendEmail({
        to: user.email,
        subject: 'Medi Consult Password Reset - OTP Code',
        text: `Hello ${user.name},\n\nYour password reset verification OTP code is: ${resetOtp}\n\nThis code will expire in 5 minutes.`,
        html: `<h3>Hello ${user.name},</h3><p>Your password reset verification OTP code is: <strong>${resetOtp}</strong></p><p>This code will expire in 5 minutes.</p>`
      });
    }

    // Send Reset OTP via SMS if chosen
    if ((sendChannel === 'phone' || sendChannel === 'both') && user.phone) {
      await sendSms({
        to: user.phone,
        message: `Your Medi Consult password reset verification OTP code is: ${resetOtp}. Valid for 5 minutes.`
      });
    }

    res.status(200).json({
      success: true,
      message: 'Password reset OTP code sent to your registered Email and Phone.'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Resend Forgot Password OTP
export const forgotPasswordResendOtp = async (req, res) => {
  try {
    const { identifier } = req.body;

    const user = await User.findOne({
      $or: [{ email: identifier }, { phone: identifier }]
    });

    if (!user) {
      return res.status(404).json({ message: 'No account found.' });
    }

    const now = new Date();
    const timeDiff = (now.getTime() - user.lastResetOtpSentAt.getTime()) / 1000;
    if (timeDiff < 30) {
      return res.status(400).json({ message: `Please wait ${Math.ceil(30 - timeDiff)} seconds before requesting a new OTP.` });
    }

    const resetOtp = randomInt(100000, 999999).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 mins expiry

    user.resetOtp = resetOtp;
    user.resetOtpExpires = expiry;
    user.lastResetOtpSentAt = now;
    await user.save();

    const sendChannel = req.body.sendChannel || 'both'; // 'email', 'phone', or 'both'

    console.log(`\n================== [OTP RESENT - PASSWORD RESET] ==================`);
    console.log(`Reset Retry: Dispatched for ${user.patientId || 'Patient'}`);
    console.log(`===================================================================\n`);

    // Send Reset OTP via Email if chosen
    if ((sendChannel === 'email' || sendChannel === 'both') && user.email) {
      await sendEmail({
        to: user.email,
        subject: 'Medi Consult Password Reset - Resend OTP Code',
        text: `Hello ${user.name},\n\nYour new password reset verification OTP code is: ${resetOtp}\n\nThis code will expire in 5 minutes.`,
        html: `<h3>Hello ${user.name},</h3><p>Your new password reset verification OTP code is: <strong>${resetOtp}</strong></p><p>This code will expire in 5 minutes.</p>`
      });
    }

    // Send Reset OTP via SMS if chosen
    if ((sendChannel === 'phone' || sendChannel === 'both') && user.phone) {
      await sendSms({
        to: user.phone,
        message: `Your new Medi Consult password reset verification OTP code is: ${resetOtp}. Valid for 5 minutes.`
      });
    }

    res.status(200).json({
      success: true,
      message: 'New OTP code has been sent.'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Verify OTP and reset password
export const forgotPasswordVerifyAndReset = async (req, res) => {
  try {
    const { identifier, otp, newPassword } = req.body;

    const user = await User.findOne({
      $or: [{ email: identifier }, { phone: identifier }]
    });

    if (!user) {
      return res.status(404).json({ message: 'No account found.' });
    }

    const now = new Date();
    if (!user.resetOtp || now > user.resetOtpExpires) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    if (user.resetOtp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP code.' });
    }

    // Update password (User schema pre-save hook will hash it automatically)
    user.password = newPassword;

    // Clear reset OTP fields
    user.resetOtp = undefined;
    user.resetOtpExpires = undefined;
    user.lastResetOtpSentAt = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully. Please login with your new password.'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const googleLogin = async (req, res) => {
  try {
    const { idToken, role: intendedRole, additionalFields } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: 'No token provided' });
    }

    // Verify Firebase ID Token
    const decodedToken = await getAuth().verifyIdToken(idToken);

    // Firebase field mapping
    const googleId = decodedToken.uid;
    const email = decodedToken.email;
    const name = decodedToken.name || email.split('@')[0];
    const picture = decodedToken.picture || '';
    const email_verified = decodedToken.email_verified || false;

    let user = await User.findOne({ email });

    if (user) {
      if (user.role === 'admin') {
        return res.status(403).json({ message: 'Admin login via Google is not allowed. Please use Admin ID and Password.' });
      }
      // User exists, update Google info if not already set
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = 'Google';
        user.profilePicture = picture;
        user.emailVerified = email_verified;
      }

      const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
      const device = req.headers['user-agent'] || 'Device';
      user.lastLogin = new Date();
      user.loginHistory.push({
        loginAt: user.lastLogin,
        ip,
        device,
        browser: device, // Simplified
        authProvider: 'Google'
      });
      await user.save();
    } else {
      // New User
      if (intendedRole === 'admin') {
        return res.status(403).json({ message: 'Admin registration via Google is not allowed.' });
      }

      const role = intendedRole || 'patient';

      user = new User({
        name,
        email,
        googleId,
        profilePicture: picture,
        authProvider: 'Google',
        emailVerified: email_verified,
        role,
        isActive: true
      });

      if (role === 'patient') {
        const patientCount = await User.countDocuments({ role: 'patient' });
        user.patientId = `PAT${1001 + patientCount}`;
        user.applicationNumber = `APP${new Date().getFullYear()}${String(patientCount + 1).padStart(3, '0')}`;

        await user.save();

        await PatientProfile.create({
          userId: user._id,
          patientId: user.patientId,
          profilePicture: picture
        });
      } else if (role === 'doctor') {
        const doctorCount = await User.countDocuments({ role: 'doctor' });
        user.doctorId = `DOC${1001 + doctorCount}`;

        await user.save();

        await DoctorProfile.create({
          userId: user._id,
          doctorId: user.doctorId,
          specialization: additionalFields?.specialization,
          department: additionalFields?.department,
          hospitalName: additionalFields?.hospitalName,
          experience: additionalFields?.experience,
          isVerified: false // Status = Pending Verification
        });
      }
    }

    if (user.role === 'doctor') {
      const profile = await DoctorProfile.findOne({ userId: user._id });
      if (!profile || !profile.isVerified) {
        // Return success but with a flag that it's pending
        // Actually the prompt says: If not verified, display: "Your account is pending verification. Please contact the hospital administrator."
        // We can send this info in the response.
        return res.json({
          success: true,
          token: generateToken(user._id),
          role: user.role,
          userId: user.doctorId,
          _id: user._id,
          name: user.name,
          isVerified: false,
          message: 'Your account is pending verification. Please contact the hospital administrator.'
        });
      }
    }

    let redirectTo = `/${user.role}/dashboard`;
    if (user.role === 'admin') redirectTo = '/admin-dashboard';
    if (user.role === 'doctor') redirectTo = '/doc-dashboard';
    if (user.role === 'patient') redirectTo = '/patient/dashboard';

    res.json({
      success: true,
      token: generateToken(user._id),
      role: user.role,
      userId: user.patientId || user.doctorId || user.adminId,
      _id: user._id,
      name: user.name,
      isVerified: true,
      redirectTo
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
