import mongoose from 'mongoose';

const offlineAppointmentSchema = new mongoose.Schema({
  appointmentId: { type: String, required: true, unique: true }, // Format: OFF-2026-000184
  patientId: { type: String, required: true },
  patientName: { type: String, required: true },
  patientPhone: { type: String },
  patientEmail: { type: String },
  
  hospitalId: { type: String, required: true },
  hospitalName: { type: String, required: true },
  hospitalAddress: { type: String, required: true },
  hospitalContact: { type: String },

  doctorId: { type: String, required: true },
  doctorName: { type: String, required: true },
  department: { type: String, required: true },
  specialization: { type: String },

  appointmentDate: { type: Date, required: true },
  appointmentTime: { type: String, required: true }, // e.g., '10:30 AM'
  reportingTime: { type: String }, // e.g., '10:15 AM' (15 mins prior)
  
  appointmentType: {
    type: String,
    enum: [
      'General Consultation',
      'Specialist Consultation',
      'Follow-up',
      'Diagnostic Test',
      'Procedure / Treatment',
      'Emergency Guidance'
    ],
    default: 'General Consultation'
  },

  reasonForVisit: { type: String, required: true },
  symptoms: { type: String },
  medicalReports: [{ type: String }], // Array of uploaded report paths/urls

  status: {
    type: String,
    enum: [
      'Booked',
      'Checked In',
      'Waiting',
      'Consultation Started',
      'Completed',
      'Cancelled'
    ],
    default: 'Booked'
  },

  estimatedFee: { type: Number, default: 500 },
  paymentStatus: { type: String, enum: ['Pay at Hospital Counter', 'Paid Online', 'Exempted'], default: 'Pay at Hospital Counter' },

  qrCodePayload: { type: String }, // Scannable string or base64 data
  
  // Hospital Check-In & Consultation Progress Timestamps
  checkInTime: { type: Date },
  consultationStartTime: { type: Date },
  consultationEndTime: { type: Date },
  
  // Clinical Notes & Prescription by Doctor
  clinicalNotes: { type: String },
  diagnosis: { type: String },
  prescription: {
    medicines: [{
      name: String,
      dosage: String,
      frequency: String,
      duration: String,
      instructions: String
    }],
    advice: String,
    followUpDate: String
  },
  
  cancellationReason: { type: String },
  cancelledAt: { type: Date },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

offlineAppointmentSchema.index({ appointmentId: 1, patientId: 1, hospitalId: 1, doctorId: 1, appointmentDate: 1 });

const OfflineAppointment = mongoose.models.OfflineAppointment || mongoose.model('OfflineAppointment', offlineAppointmentSchema);
export default OfflineAppointment;
