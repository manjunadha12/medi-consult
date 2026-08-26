import mongoose from 'mongoose';

const patientProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  patientId: { type: String, required: true, unique: true },
  age: { type: Number },
  gender: { type: String },
  bloodGroup: { type: String },
  address: { type: String },
  allergies: [String],
  emergencyContact: {
    name: String,
    relation: String,
    phone: String
  },
  medicalHistory: [String],
  currentProblems: [String],
  currentMedicines: [String],
  symptoms: [String],
  bp: { type: String },
  sugar: { type: String },
  oxygen: { type: String },
  fever: { type: String },
  painLevel: { type: Number, min: 0, max: 10 }
});

const PatientProfile = mongoose.models.PatientProfile || mongoose.model('PatientProfile', patientProfileSchema);
export default PatientProfile;
