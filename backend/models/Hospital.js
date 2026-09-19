import mongoose from 'mongoose';

const hospitalSchema = new mongoose.Schema({
  hospitalId: { type: String, required: true, unique: true },
  hospitalName: { type: String, required: true },
  logo: { type: String },
  image: { type: String },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  departments: [{ type: String }],
  contactNumber: { type: String, required: true },
  emergencyContact: { type: String },
  timings: { type: String, default: '24x7 Emergency • OPD: 08:00 AM - 08:00 PM' },
  isEmergencyAvailable: { type: Boolean, default: true },
  consultationFee: { type: Number, default: 500 },
  rating: { type: Number, default: 4.8 },
  totalBeds: { type: Number, default: 350 },
  icuBedsAvailable: { type: Number, default: 24 },
  distanceKm: { type: Number, default: 3.2 },
  facilities: [{ type: String }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

hospitalSchema.index({ hospitalName: 'text', city: 'text', state: 'text', pincode: 'text', departments: 'text' });

const Hospital = mongoose.models.Hospital || mongoose.model('Hospital', hospitalSchema);
export default Hospital;
