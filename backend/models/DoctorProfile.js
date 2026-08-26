import mongoose from 'mongoose';

const doctorProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: String, unique: true, sparse: true },
  applicationNumber: { type: String, unique: true, sparse: true },
  specialization: { type: String },
  hospitalName: { type: String },
  city: { type: String, default: 'Bangalore' },
  address: { type: String },
  department: { type: String },
  experience: { type: Number },
  age: { type: Number },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], default: 'Male' },
  consultationFee: { type: Number },
  rating: { type: Number, default: 0 },
  availability: { type: String },
  availabilityStatus: { type: String, enum: ['Available', 'Busy', 'On Break', 'Offline'], default: 'Available' },
  dutyStatus: { type: String, default: 'On Duty' },
  signature: { type: String },

  // Stats & Bio
  operationsCount: { type: Number, default: 0 },
  patientsTreatedCount: { type: Number, default: 0 },
  appointmentsCompleted: { type: Number, default: 0 },
  repeatPatientsCount: { type: Number, default: 0 },
  recommendationPercentage: { type: Number, default: 98 },
  responseTime: { type: String, default: "15 mins" },
  bio: { type: String },
  professionalSummary: { type: String },
  clinicalHistory: [String],
  awards: [String],
  detailedExpertise: [String],
  conditionsTreated: [String],
  proceduresPerformed: [String],
  languages: { type: [String], default: ['English', 'Hindi'] },
  qualifications: { type: [String], default: ['MBBS'] },
  medicalCouncil: { type: String, default: 'Medical Council of India' },
  designation: { type: String, default: 'Senior Consultant' },
  certifications: [String],
  publications: [String],
  memberships: [String],
  hospitalAffiliations: [String],
  successStories: [{ patientName: String, story: String, date: Date }],
  mediaGallery: [{ url: String, type: { type: String, enum: ['image', 'video'] }, title: String }],

  // Surgical Experience (Verified)
  surgicalStats: {
    totalSurgeries: Number,
    successfulSurgeries: Number,
    complexCases: Number,
    successRate: String,
    avgSurgeriesPerYear: Number
  },

  // Rating Breakdown
  ratingBreakdown: {
    knowledge: { type: Number, default: 4.8 },
    communication: { type: Number, default: 4.7 },
    treatment: { type: Number, default: 4.9 },
    waitingTime: { type: Number, default: 4.2 },
    hospitalExperience: { type: Number, default: 4.5 }
  },

  topReview: { type: String, default: "Excellent clinical expertise and patient care node established." },

  // Google Places Data
  placeId: { type: String },
  formattedAddress: { type: String },
  district: { type: String },
  state: { type: String },
  country: { type: String },
  postalCode: { type: String },
  latitude: { type: Number },
  longitude: { type: Number },
  website: { type: String },
  phoneNumber: { type: String },
  googleRating: { type: Number },

  // Verification Data
  medicalRegistrationNumber: { type: String, unique: true, sparse: true },
  verificationStatus: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Suspended', 'Documents Required'],
    default: 'Pending'
  },
  uploadedDocuments: [{
    name: String,
    fileUrl: String,
    fileType: String,
    isMandatory: Boolean,
    status: { type: String, default: 'Uploaded' }
  }],

  isVerified: { type: Boolean, default: false }
});

const DoctorProfile = mongoose.models.DoctorProfile || mongoose.model('DoctorProfile', doctorProfileSchema);
export default DoctorProfile;
