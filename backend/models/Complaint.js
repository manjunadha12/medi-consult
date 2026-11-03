import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema({
  complaintId: { 
    type: String, 
    unique: true,
    default: () => `CMP-${Math.floor(100000 + Math.random() * 900000)}`
  },
  appointmentId: { type: String },
  patientId: { type: String, required: true },
  patientName: { type: String },
  doctorId: { type: String },
  doctorName: { type: String },
  category: { 
    type: String, 
    required: true,
    enum: [
      'Billing / Payment Issue',
      'Clinical Delay',
      'Doctor Conduct',
      'Prescription / Pharmacy Error',
      'Technical / Platform Glitch',
      'Other'
    ]
  },
  urgency: { 
    type: String, 
    enum: ['Normal', 'High', 'Critical'], 
    default: 'Normal' 
  },
  description: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['Pending Review', 'Under Investigation', 'Resolved', 'Dismissed'], 
    default: 'Pending Review' 
  },
  adminNotes: { type: String },
  resolutionDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

complaintSchema.index({ patientId: 1, appointmentId: 1 });
complaintSchema.index({ status: 1, urgency: 1 });

const Complaint = mongoose.models.Complaint || mongoose.model('Complaint', complaintSchema);
export default Complaint;

