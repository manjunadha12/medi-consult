import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: function() { return this.authProvider === 'Local'; } },
  role: { type: String, enum: ['patient', 'doctor', 'admin'], required: true },
  phone: { type: String },
  patientId: { type: String, unique: true, sparse: true },
  doctorId: { type: String, unique: true, sparse: true },
  adminId: { type: String, unique: true, sparse: true },
  applicationNumber: { type: String, unique: true, sparse: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date },
  loginHistory: [{
    loginAt: { type: Date, default: Date.now },
    ip: { type: String },
    device: { type: String },
    browser: { type: String },
    authProvider: { type: String, default: 'Local' }
  }],
  loginOtp: { type: String },
  loginOtpExpires: { type: Date },
  resetOtp: { type: String },
  resetOtpExpires: { type: Date },
  lastResetOtpSentAt: { type: Date },
  securitySettings: {
    twoFactorAuth: { type: Boolean, default: false },
    sessionTimeout: { type: String, default: '30 Minutes' },
    dataEncryption: { type: Boolean, default: true }
  },
  googleId: { type: String, sparse: true },
  profilePicture: { type: String },
  authProvider: { type: String, enum: ['Local', 'Google'], default: 'Local' },
  emailVerified: { type: Boolean, default: false }
});

userSchema.index({ role: 1 });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(12); // Increased institutional complexity
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
