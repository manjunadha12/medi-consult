import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import Appointment from '../models/Appointment.js';

export const getConversations = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Identity node unverified" });

    const userId = req.user._id;
    const humanId = req.user.doctorId || req.user.patientId;

    console.log(`[CHAT_SYNC] Probing registry for: ${req.user.name} (${humanId || 'G-NODE'})`);

    // 1. Get existing conversations
    let conversations = [];
    try {
      conversations = await Conversation.find({
        'participants.userId': userId
      }).sort({ updatedAt: -1 });
    } catch (dbErr) {
      console.error("[CHAT_DB_ERR] Registry read failure:", dbErr.message);
      return res.status(500).json({ message: "Neural registry inaccessible" });
    }

    // Patch humanId for older conversations if missing
    try {
      conversations = await Promise.all(conversations.map(async (c) => {
        const conv = c.toObject();
        for (let p of conv.participants) {
          const u = await User.findById(p.userId).select('doctorId patientId adminId profilePicture');
          p.humanId = u?.doctorId || u?.patientId || u?.adminId;
          p.profilePicture = u?.profilePicture;
        }
        return conv;
      }));
    } catch (patchErr) {
      console.error("[CHAT_SYNC_WARN] Patch failed:", patchErr.message);
    }

    // 2. Find appointments that don't have a conversation yet
    const existingApptIds = conversations.map(c => c.appointmentId?.toString()).filter(id => id && mongoose.Types.ObjectId.isValid(id));

    if (!humanId) {
      console.warn("[CHAT_SYNC_WARN] User has no humanId. Skipping potential matches.");
      return res.json(conversations);
    }

    const cleanHumanId = humanId.toLowerCase();

    let potentialAppointments = [];
    try {
      // Make humanId search case-insensitive
      potentialAppointments = await Appointment.find({
        $or: [
          { doctorId: { $regex: new RegExp(`^${humanId}$`, 'i') } },
          { patientId: { $regex: new RegExp(`^${humanId}$`, 'i') } }
        ],
        status: { $in: ['Accepted', 'Pending', 'Live'] },
        _id: { $nin: existingApptIds },
        chatDismissed: { $ne: true }
      });
    } catch (apptErr) {
      console.error("[CHAT_DB_ERR] Potential Appointments:", apptErr.message);
      return res.json(conversations);
    }

    // 3. Map potential appointments to a compatible conversation format (Grouped by Partner)
    const seenPartners = new Set();

    // Add existing conversation partners to seenPartners to prevent duplication
    if (Array.isArray(conversations)) {
      conversations.forEach(c => {
        if (c.participants && Array.isArray(c.participants)) {
          const partner = c.participants.find(p => p.userId?.toString() !== userId.toString());
          if (partner?.humanId) seenPartners.add(partner.humanId.toLowerCase());
        }
      });
    }

    const potentialChats = [];

    for (const appt of potentialAppointments) {
      try {
        const docId = (appt.doctorId || '').toLowerCase();
        const patId = (appt.patientId || '').toLowerCase();
        const targetHumanId = (docId === cleanHumanId) ? appt.patientId : appt.doctorId;

        if (!targetHumanId || seenPartners.has(targetHumanId.toLowerCase())) continue;

        let targetUser = null;
        try {
          targetUser = await User.findOne({
            $or: [
              { doctorId: { $regex: new RegExp(`^${targetHumanId}$`, 'i') } },
              { patientId: { $regex: new RegExp(`^${targetHumanId}$`, 'i') } }
            ]
          }).select('name role profilePicture');
        } catch (e) {
          console.error(`[CHAT_SYNC_ERR] Finding target user ${targetHumanId}:`, e.message);
        }

        // Only add to potential chats if we actually found a user node
        // This prevents the "Error establishing link" when clicking on ghost IDs
        if (targetUser) {
          potentialChats.push({
            _id: `temp_${appt._id}`,
            isPotential: true,
            isLocked: appt.status === 'Pending',
            appointmentId: appt._id,
            participants: [
              { userId, humanId, name: req.user.name || 'User', role: req.user.role, profilePicture: req.user.profilePicture },
              {
                userId: targetUser._id,
                humanId: targetHumanId,
                name: targetUser.name,
                role: targetUser.role,
                profilePicture: targetUser.profilePicture
              }
            ],
            lastMessage: {
              text: appt.status === 'Pending' ? 'Awaiting Specialist Approval' : 'Clinical Link Authorized - Initialize Chat',
              timestamp: appt.updatedAt || appt.createdAt
            }
          });
          seenPartners.add(targetHumanId.toLowerCase());
        } else {
          console.warn(`[CHAT_SYNC_WARN] Ghost node detected: ${targetHumanId}. User record missing.`);
        }
      } catch (loopErr) {
        console.error("[CHAT_SYNC_ERR] Potential chat loop failed:", loopErr.message);
      }
    }

    res.json([...conversations, ...potentialChats]);
  } catch (error) {
    console.error("[CHAT_SYNC_FATAL] getConversations failed:", error.stack);
    // Absolute fallback: Return empty array to prevent UI crash
    res.json([]);
  }
};

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    // If it's a temporary ID for a potential chat, return empty array instead of failing
    if (conversationId.startsWith('temp_')) {
      return res.json([]);
    }

    const { limit = 50, skip = 0 } = req.query;

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .populate('replyTo');

    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { conversationId, text, type, metadata, replyTo, receiverId } = req.body;
    const senderId = req.user._id;

    if (!conversationId || conversationId.startsWith('temp_')) {
      return res.status(400).json({ message: "Neural link not yet established. Please wait for synchronization." });
    }

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation node ID" });
    }

    // Resolve receiverId if it's a DOC/PAT string ID
    let resolvedReceiverId = receiverId;
    if (typeof receiverId === 'string' && (receiverId.startsWith('DOC') || receiverId.startsWith('PAT'))) {
      try {
        const targetUser = await User.findOne({
          $or: [{ doctorId: receiverId }, { patientId: receiverId }]
        });
        if (targetUser) resolvedReceiverId = targetUser._id;
      } catch (e) {}
    }

    const attachments = req.files ? req.files.map(file => ({
      url: `/uploads/chat/${file.filename}`,
      name: file.originalname,
      size: file.size,
      fileType: file.mimetype
    })) : [];

    const message = new Message({
      conversationId,
      senderId,
      text,
      type: type || 'text',
      attachments,
      metadata,
      replyTo: replyTo && mongoose.Types.ObjectId.isValid(replyTo) ? replyTo : undefined
    });

    await message.save();

    // Update conversation last message and touch the record
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: {
        text: type === 'text' ? (text?.substring(0, 100)) : `Sent a ${type}`,
        senderId,
        timestamp: new Date()
      }
    });

    res.status(201).json(message);
  } catch (error) {
    console.error("[CHAT_SEND_ERR]", error.message);
    res.status(500).json({ message: "Neural stream interruption: " + error.message });
  }
};

export const startConversation = async (req, res) => {
  try {
    let { targetUserId, appointmentId } = req.body;
    const currentUserId = req.user._id;

    if (!targetUserId) {
      return res.status(400).json({ message: "Target identity node missing" });
    }

    console.log(`[CHAT_START] Link Request: ${req.user.name} -> ${targetUserId} (Appt: ${appointmentId || 'None'})`);

    // Resolve targetUserId if it's a DOC/PAT string ID
    if (typeof targetUserId === 'string' && (targetUserId.startsWith('DOC') || targetUserId.startsWith('PAT') || targetUserId.startsWith('ADM'))) {
      const targetUser = await User.findOne({
        $or: [
          { doctorId: targetUserId },
          { patientId: targetUserId },
          { adminId: targetUserId }
        ]
      });
      if (!targetUser) {
        console.error(`[CHAT_START_FAIL] Identity not found in registry: ${targetUserId}`);
        return res.status(404).json({ message: "Specialist/Patient node not found in registry" });
      }
      targetUserId = targetUser._id;
    }

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({ message: "Invalid target identity node" });
    }

    const query = {
      'participants.userId': { $all: [currentUserId, targetUserId] }
    };

    if (appointmentId) {
      query.appointmentId = appointmentId;
    } else {
      // Peer-to-peer chat (no appointment)
      query.appointmentId = { $exists: false };
    }

    let conversation = await Conversation.findOne(query);

    if (conversation) {
      return res.json(conversation);
    }

    const participantsData = await User.find({
      _id: { $in: [currentUserId, targetUserId] }
    });

    const conversationData = {
      participants: participantsData.map(u => ({
        userId: u._id,
        humanId: u.doctorId || u.patientId || u.adminId,
        role: u.role,
        name: u.name,
        avatar: u.profilePic || ''
      })),
      appointmentId
    };

    conversation = new Conversation(conversationData);
    await conversation.save();

    res.status(201).json(conversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;

    // Skip if it's a temporary ID
    if (conversationId.startsWith('temp_')) {
      return res.json({ success: true });
    }

    const userId = req.user._id;

    await Message.updateMany(
      { conversationId, senderId: { $ne: userId }, status: { $ne: 'read' } },
      { $set: { status: 'read' } }
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    await Conversation.findByIdAndDelete(conversationId);
    await Message.deleteMany({ conversationId });
    res.json({ success: true, message: "Neural link purged successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const dismissPotentialChat = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    await Appointment.findByIdAndUpdate(appointmentId, { chatDismissed: true });
    res.json({ success: true, message: "Potential link dismissed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const logCall = async (req, res) => {
  try {
    const { conversationId, receiverId, callType, status, duration } = req.body;
    const senderId = req.user._id;

    // Resolve receiverId if string
    let resolvedReceiverId = receiverId;
    if (typeof receiverId === 'string' && (receiverId.startsWith('DOC') || receiverId.startsWith('PAT'))) {
      const u = await User.findOne({ $or: [{ doctorId: receiverId }, { patientId: receiverId }] });
      if (u) resolvedReceiverId = u._id;
    }

    const text = status === 'started'
      ? `📞 ${callType.toUpperCase()} CALL STARTED`
      : status === 'declined'
      ? `🚫 MISSED ${callType.toUpperCase()} CALL`
      : `🏁 ${callType.toUpperCase()} CALL ENDED${duration ? ` • ${duration}` : ''}`;

    const message = new Message({
      conversationId,
      senderId,
      text,
      type: 'call',
      metadata: { callStatus: status, callType, duration }
    });

    await message.save();

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: {
        text,
        senderId,
        timestamp: new Date()
      }
    });

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
