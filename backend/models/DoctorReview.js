import mongoose from 'mongoose';

const doctorReviewSchema = new mongoose.Schema({
  reviewId: { type: String, unique: true },
  patientId: { type: String, required: true },
  patientName: { type: String },
  doctorId: { type: String, required: true },
  doctorName: { type: String },
  appointmentId: { type: String },
  consultationId: { type: String },
  rating: { type: Number, required: true, min: 1, max: 5 },
  reviewComment: { type: String },
  reviewDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['Pending', 'Published', 'Hidden', 'Flagged'], default: 'Pending' },
  createdAt: { type: Date, default: Date.now }
});

const DoctorReview = mongoose.models.DoctorReview || mongoose.model('DoctorReview', doctorReviewSchema);
export default DoctorReview;
