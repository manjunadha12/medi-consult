import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  patientId: { type: String, required: true },
  doctorId: { type: String, required: true },
  hospitalName: { type: String },
  specialization: { type: String },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  tokenNumber: { type: Number },
  appointmentId: { type: String, unique: true },
  consultationType: { type: String, enum: ['In-person', 'Video'], default: 'Video' },
  problemDescription: { type: String },
  status: { type: String, enum: ['Pending', 'Accepted', 'Live', 'Completed', 'Cancelled'], default: 'Pending' },
  isEmergency: { type: Boolean, default: false },

  // Payment Fields
  paymentMethod: { type: String, enum: ['UPI', 'Card', 'Wallet', 'PayPal', 'Razorpay'], default: 'Razorpay' },
  paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Failed', 'Verifying', 'Timeout'], default: 'Pending' },
  fee: { type: Number, default: 0 },
  transactionId: { type: String }, // For manual UPI UTR verification
  paymentScreenshot: { type: String }, // URL or path to the uploaded screenshot
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },

  // Video Call Fields
  roomCode: { type: String },
  meetingId: { type: String },
  meetingPassword: { type: String },
  scheduledVideoTime: { type: String },
  isMeetingReady: { type: Boolean, default: false },
  participants: [String], // Array of userId/patientId

  // Opinion & Results
  symptoms: { type: String },
  diagnosis: { type: String },
  clinicalObservations: { type: String },
  notes: { type: String },
  remarks: { type: String },
  prescription: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription' },
  reports: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Report' }],

  secondOpinionStatus: { type: String, enum: ['None', 'Requested', 'Completed'], default: 'None' },
  secondOpinionDoctorId: { type: String },

  chatDismissed: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now },
  endedAt: { type: Date }
});

const Appointment = mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);
export default Appointment;
