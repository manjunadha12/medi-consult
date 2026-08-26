import express from 'express';
import {
  getConversations,
  getMessages,
  sendMessage,
  startConversation,
  markAsRead,
  deleteConversation,
  dismissPotentialChat,
  logCall
} from '../controllers/chatController.js';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.use(protect);

router.get('/conversations', getConversations);
router.get('/messages/:conversationId', getMessages);
router.post('/send', upload.array('files', 5), sendMessage);
router.post('/start', startConversation);
router.put('/read/:conversationId', markAsRead);
router.delete('/conversation/:conversationId', deleteConversation);
router.put('/dismiss-potential/:appointmentId', dismissPotentialChat);
router.post('/log-call', logCall);

export default router;
