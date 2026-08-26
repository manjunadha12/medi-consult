import mongoose from 'mongoose';

const prescriptionSchema = new mongoose.Schema({
  patientId: { type: String, required: true },
  doctorId: { type: String, required: true },
  doctorRegNo: { type: String },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  diagnosis: { type: String, required: true },
  medicines: [{
    name: { type: String, required: true },
    genericName: { type: String },
    brandName: { type: String },
    strength: { type: String },
    dosageForm: { type: String },
    manufacturer: { type: String },
    dosage: { type: String },
    frequency: { type: String },
    foodInstruction: { type: String },
    durationValue: { type: Number },
    durationUnit: { type: String, default: 'Days' },
    morning: { type: Boolean, default: false },
    afternoon: { type: Boolean, default: false },
    night: { type: Boolean, default: false },
    specialInstructions: { type: String },
    quantity: { type: Number }
  }],
  advice: { type: String },
  followUpDate: { type: Date },
  qrCodeData: { type: String },
  signature: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const Prescription = mongoose.models.Prescription || mongoose.model('Prescription', prescriptionSchema);
export default Prescription;
