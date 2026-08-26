import mongoose from 'mongoose';

const institutionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  shortName: { type: String },
  type: { type: String, enum: ['Hospital', 'College', 'Medical College & Hospital', 'Clinic'], required: true },
  address: { type: String },
  city: { type: String, required: true },
  state: { type: String },
  country: { type: String, default: 'India' },
  postalCode: { type: String },
  website: { type: String },
  phone: { type: String },
  ownership: { type: String, enum: ['Private', 'Government'] },
  university: { type: String },
  hospitalId: { type: String, unique: true, sparse: true },
  collegeId: { type: String, unique: true, sparse: true },
  verificationStatus: { type: String, enum: ['Verified', 'Pending', 'Unverified'], default: 'Verified' },
  nabhStatus: { type: String },
  nmcApproval: { type: String },
  naacGrade: { type: String },
  district: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

institutionSchema.index({ name: 'text', city: 1, type: 1 });

const Institution = mongoose.models.Institution || mongoose.model('Institution', institutionSchema);
export default Institution;
