import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String },
  type: {
    type: String,
    enum: ['text', 'image', 'pdf', 'voice', 'report', 'prescription', 'instruction', 'call'],
    default: 'text'
  },
  attachments: [{
    url: String,
    name: String,
    size: Number,
    fileType: String
  }],
  metadata: {
    reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'Report' },
    prescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription' },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' }
  },
  status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  reactions: [{
    userId: mongoose.Schema.Types.ObjectId,
    emoji: String
  }],
  isStarred: { type: Boolean, default: false },
  isPinned: { type: Boolean, default: false }
}, { timestamps: true });

const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);
export default Message;
