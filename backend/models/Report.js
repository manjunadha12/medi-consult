import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  patientId: { type: String, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fileName: { type: String },
  fileUrl: { type: String },
  fileType: { type: String },
  category: { type: String },
  aiSummary: { type: String },
  riskLevel: { type: String, enum: ['Low', 'Medium', 'High'] },
  abnormalValues: [String],
  suggestedSpecialist: { type: String },
  suggestedTest: { type: String },
  precautionTips: [String],
  status: { type: String, default: 'Pending' },
  createdAt: { type: Date, default: Date.now }
});

const Report = mongoose.models.Report || mongoose.model('Report', reportSchema);
export default Report;
