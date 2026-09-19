import React, { useState, useEffect, useRef } from 'react';
import Navbar from './Navbar';
import {
  Search as SearchIcon, MessageCircle, MoreVertical, Phone as PhoneIcon, Video, Send, PhoneOff,
  Paperclip, Mic, Image as ImageIcon, FileText, X, ChevronLeft,
  Check, CheckCheck, Smile, Star, Pin, Trash2, Reply, Forward,
  Clock, User as UserIcon, Stethoscope, Loader2, Pill, Activity, Shield, Info, Download, Camera, Brain, Users
} from 'lucide-react';
import useStore from '../../store/useStore';
import api, { BACKEND_URL } from '../../utils/api';
import { toast } from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import WritePrescription from '../doctor/WritePrescription';
import AIReportReview from '../doctor/AIReportReview';
import Followups from '../doctor/Followups';
import ReferCase from '../doctor/ReferCase';

const ChatSystem = () => {
  const { user, theme, socket, incomingCall, setIncomingCall, initializeGlobalSocket } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [search, setSearch] = useState('');
  const [typing, setTyping] = useState(false);
  const [receiverTyping, setReceiverTyping] = useState(false);
  const [initializing, setInitializing] = useState(false);

  // Attachment & Voice States
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);

  // Call States
  const [activeModal, setActiveModal] = useState(null); // 'prescription', 'report', 'followup', 'refer'

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const chatContainerRef = useRef(null);
  const socketRef = useRef(socket);

  useEffect(() => {
    if (!socket && user) {
      initializeGlobalSocket();
    }
  }, [socket, user, initializeGlobalSocket]);

  // Socket Events
  useEffect(() => {
    if (!socket) return;
    socketRef.current = socket;

    const handleNewMessage = (message) => {
      if (activeConversation && message.conversationId === activeConversation._id) {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
      }
      fetchConversations();
    };

    const handleTyping = ({ conversationId, isTyping }) => {
      if (activeConversation && conversationId === activeConversation._id) {
        setReceiverTyping(isTyping);
      }
    };

    socketRef.current.on('new-chat-message', handleNewMessage);
    socketRef.current.on('user-typing', handleTyping);

    return () => {
      socketRef.current.off('new-chat-message', handleNewMessage);
      socketRef.current.off('user-typing', handleTyping);
    };
  }, [socket, activeConversation]);

  useEffect(() => {
    fetchConversations();
    // Handle starting a chat from an external link (e.g. appointment list)
    if (location.state?.startChat) {
      handleStartChat(location.state.targetUserId, location.state.appointmentId);
    }
  }, []);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation._id);
      if (window.innerWidth < 1024) setSidebarOpen(false);
    }
  }, [activeConversation]);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/chat/conversations');
      if (Array.isArray(res.data)) {
        setConversations(res.data);
      } else {
        console.error("[CHAT_SYNC] Registry protocol mismatch:", res.data);
        setConversations([]);
      }
      setLoading(false);
    } catch (err) {
      console.error("[CHAT_SYNC_FAIL]", err.response?.status, err.response?.data || err.message);
      toast.error("Neural Registry Offline");
      setLoading(false);
    }
  };

  const fetchMessages = async (id) => {
    try {
      const res = await api.get(`/chat/messages/${id}`);
      setMessages(res.data);
      scrollToBottom();
      // Mark as read
      await api.put(`/chat/read/${id}`);
    } catch (err) {
      toast.error("Failed to load messages");
    }
  };

  const handleStartChat = async (targetUserId, appointmentId) => {
    setInitializing(true);
    try {
      const res = await api.post('/chat/start', { targetUserId, appointmentId });
      setActiveConversation(res.data);
      fetchConversations();
    } catch (err) {
      console.error("[CHAT_INIT_ERR]", err);
      toast.error("Error establishing link");
    } finally {
      setInitializing(false);
    }
  };

  const handleDeleteConversation = async (conv) => {
    const isPotential = conv._id.startsWith('temp_');
    const id = isPotential ? conv.appointmentId : conv._id;

    if (!window.confirm("Disconnect this neural link? This node will be purged from your active registry.")) return;

    try {
      if (isPotential) {
        // For potential chats, we "dismiss" the appointment from chat view
        await api.put(`/chat/dismiss-potential/${id}`);
      } else {
        // For real conversations, we delete the conversation record
        await api.delete(`/chat/conversation/${id}`);
      }

      if (activeConversation?._id === conv._id) setActiveConversation(null);
      toast.success("Node Purged");
      fetchConversations();
    } catch (err) {
      toast.error("Failed to purge node");
    }
  };

  const handleFileSelect = async (e, type = 'text') => {
    const file = e.target.files[0];
    if (!file) return;

    const myMongoId = user?._id?.toString();
    const myHumanId = user?.userId?.toString();
    const receiver = activeConversation.participants.find(p =>
      p.userId?.toString() !== myMongoId && p.humanId?.toString() !== myHumanId
    );

    const formData = new FormData();
    formData.append('conversationId', activeConversation._id);
    formData.append('text', type === 'image' ? 'Sent an image' : type === 'voice' ? 'Sent a voice note' : `Attached file: ${file.name}`);
    formData.append('type', type === 'image' ? 'image' : type === 'voice' ? 'voice' : 'file');
    formData.append('receiverId', receiver.userId);
    formData.append('files', file);

    try {
      setSending(true);
      const res = await api.post('/chat/send', formData);
      setMessages(prev => [...prev, res.data]);
      scrollToBottom();
      socket.emit('chat-message', { ...res.data, receiverId: receiver.userId });
      fetchConversations();
    } catch (err) {
      console.error("[FILE_SYNC_ERR]", err);
      const msg = err.response?.data?.message || "File sync failed";
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  const handleShareFromTool = async (payload) => {
    if (!activeConversation) return;

    const partner = getPartner(activeConversation);
    const receiverId = partner.userId || partner.humanId;

    let text = '';
    let attachments = [];

    if (payload.isAnalysis) {
      text = `📊 AI SYNTHESIS SHARED:\n\n${payload.content}`;
    } else {
      // It's a file report
      text = `📎 SHARED REPORT: ${payload.fileName}`;
      attachments = [{
        url: payload.fileUrl,
        name: payload.fileName,
        fileType: 'application/pdf', // default
        size: 0
      }];
    }

    const messageData = {
      conversationId: activeConversation._id,
      text,
      type: 'text',
      receiverId,
      attachments: attachments.length > 0 ? attachments : undefined
    };

    try {
      setSending(true);
      const res = await api.post('/chat/send', messageData);
      setMessages(prev => [...prev, res.data]);
      scrollToBottom();
      socket.emit('chat-message', { ...res.data, receiverId });
      toast.success("Synchronized with chat stream");
      setActiveModal(null); // Close tool after sharing
    } catch (err) {
      toast.error("Share failed");
    } finally {
      setSending(false);
    }
  };

  const handleInitiateCall = async (type = 'video') => {
    if (!activeConversation) return;
    const partner = getPartner(activeConversation);
    const partnerId = partner.userId || partner.humanId;

    const isSpecialist = partner?.role === 'doctor' || (partner?.humanId && partner.humanId.toUpperCase().startsWith('DOC'));
    if (isSpecialist) {
      return toast.error("Calls are disabled for Specialist Peers. Available for Clinical Patients only.");
    }

    const isP2P = user.role === 'doctor' && partner.role === 'doctor';
    // Use conversationId as deterministic roomCode
    const roomCode = activeConversation._id;

    console.log(`[CALL] Initiating ${type} node: ${roomCode}`);

    // Log call start to database
    await logCallStatus('started');

    // Notify peer via socket
    if (socketRef.current && socketRef.current.connected) {
      console.log(`[CHAT_CALL] Triggering signal to ${partnerId}`);
      socketRef.current.emit('call-user', {
        userToCall: partnerId,
        from: user.userId || user._id,
        name: user.name,
        conversationId: activeConversation._id,
        callType: type,
        isP2P
      });
      toast.success(`Requesting ${type} link...`);

      // Navigate to call screen
      const isPatient = user.role === 'patient';
      const path = type === 'video'
        ? (isPatient ? '/patient/video-consult' : '/doctor/video-consult')
        : (isPatient ? '/patient/voice-consult' : '/doctor/voice-consult');

      navigate(`${path}?roomCode=${roomCode}&peerName=${partner.name}&peerId=${partner.humanId || partner.userId}&isP2P=${isP2P}`);
    } else {
      console.error("[CHAT_CALL] Global socket disconnected or null");
      toast.error("Neural Link Offline. Reconnecting...");
      if (initializeGlobalSocket) initializeGlobalSocket();
    }
  };

  const handleAcceptCall = () => {
    if (!incomingCall) return;
    const { conversationId, callType, from, name } = incomingCall;

    // Find if we have this conversation in our list
    const conv = conversations.find(c => c._id === conversationId);
    if (!conv) return toast.error("Identity node mismatch");

    const partner = getPartner(conv);
    const isP2P = user.role === 'doctor' && partner.role === 'doctor';

    setIncomingCall(null);
    const isPatient = user.role === 'patient';
    const path = callType === 'video'
      ? (isPatient ? '/patient/video-consult' : '/doctor/video-consult')
      : (isPatient ? '/patient/voice-consult' : '/doctor/voice-consult');

    navigate(`${path}?roomCode=${conversationId}&peerName=${name}&peerId=${from}&isP2P=${isP2P}`);
  };

  const handleDeclineCall = async () => {
    if (!incomingCall || !socket) return;
    socket.emit('decline-call', { to: incomingCall.from });

    // Log missed/declined call
    await api.post('/chat/log-call', {
        conversationId: incomingCall.conversationId,
        receiverId: incomingCall.from,
        callType: incomingCall.callType,
        status: 'declined'
    });

    setIncomingCall(null);
    toast.error("Call Declined");
  };

  const logCallStatus = async (status, duration = null) => {
    if (!activeConversation) return;
    const partner = getPartner(activeConversation);
    const receiverId = partner.userId || partner.humanId;

    const callType = activeModal === 'voice' ? 'voice' : 'video';

    try {
      const res = await api.post('/chat/log-call', {
        conversationId: activeConversation._id,
        receiverId,
        callType,
        status,
        duration
      });
      setMessages(prev => [...prev, res.data]);
      socket.emit('chat-message', { ...res.data, receiverId });
      fetchConversations();
    } catch (err) {
      console.error("Failed to log call node", err);
    }
  };

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !window.MediaRecorder) {
        return toast.error("Hardware voice node unavailable");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Determine optimal mimeType for stability on older Android WebViews
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/ogg')
          ? 'audio/ogg'
          : 'audio/mp4';

      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        if (chunks.length === 0) return toast.error("Neural data capture failed");

        const blob = new Blob(chunks, { type: mimeType });
        const ext = mimeType.includes('webm') ? 'webm' : mimeType.includes('ogg') ? 'ogg' : 'mp4';
        const file = new File([blob], `voice_note_${Date.now()}.${ext}`, { type: mimeType });

        // Auto-send voice note
        const event = { target: { files: [file] } };
        handleFileSelect(event, 'voice');

        stream.getTracks().forEach(track => track.stop());
      };

      // Use a timeslice for better reliability on some mobile browsers
      recorder.start(1000);
      setMediaRecorder(recorder);
      setIsRecording(true);
      toast.success("Voice sequence active");
    } catch (err) {
      console.error("[VOICE_SYNC_ERR]", err);
      toast.error("Microphone handshake failed");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const addEmoji = (emoji) => {
    setInput(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || !activeConversation) return;

    const myMongoId = user?._id?.toString();
    const myHumanId = user?.userId?.toString();
    const receiver = activeConversation.participants.find(p =>
      p.userId?.toString() !== myMongoId && p.humanId?.toString() !== myHumanId
    );

    const messageData = {
      conversationId: activeConversation._id,
      text: input,
      type: 'text',
      receiverId: receiver.userId
    };

    try {
      setSending(true);
      const res = await api.post('/chat/send', messageData);
      setMessages(prev => [...prev, res.data]);
      setInput('');
      scrollToBottom();

      // Emit via socket
      socket.emit('chat-message', { ...res.data, receiverId: receiver.userId });
      fetchConversations();
    } catch (err) {
      toast.error("Message delivery failed");
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const getPartner = (conv) => {
    if (!conv) return {};
    const myMongoId = user?._id?.toString();
    const myHumanId = user?.userId?.toString();
    return conv.participants.find(p =>
      p.userId?.toString() !== myMongoId && p.humanId?.toString() !== myHumanId
    ) || conv.participants[0] || {};
  };

  const filteredConversations = conversations.filter(c => {
    const partner = getPartner(c);
    return partner.name?.toLowerCase().includes(search.toLowerCase()) ||
           partner.humanId?.toLowerCase().includes(search.toLowerCase());
  });

  const formatJsonToText = (obj, level = 0) => {
    if (typeof obj !== 'object' || obj === null) return String(obj);

    return Object.entries(obj).map(([key, value]) => {
      const formattedKey = key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

      if (Array.isArray(value)) {
        if (value.length === 0) return "";
        if (typeof value[0] === 'object' && value[0] !== null) {
          return `#### ${formattedKey}\n${value.map(item => formatJsonToText(item, level + 1)).join('\n---\n')}`;
        }
        return `#### ${formattedKey}\n${value.map(item => `* ${item}`).join('\n')}`;
      }

      if (typeof value === 'object' && value !== null) {
        return `#### ${formattedKey}\n${formatJsonToText(value, level + 1)}`;
      }

      if (value === "not_provided" || !value) return "";

      return `**${formattedKey}**: ${value}  \n`;
    }).join('\n');
  };

  const handleSelectConversation = async (conv) => {
    setActiveConversation(conv); // Always set as active so we can show the "Locked" UI

    if (conv.isLocked) {
      if (user.role === 'doctor') {
        const confirmAccept = window.confirm("Establish bidirectional link with this patient node?");
        if (confirmAccept) {
          try {
            await api.put(`/appointments/accept/${conv.appointmentId}`);
            toast.success("Clinical Link Authorized");
            fetchConversations();
          } catch (err) {
            toast.error("Authorization failed");
          }
        }
      }
      return;
    }

    if (conv.isPotential) {
      const partner = getPartner(conv);
      handleStartChat(partner.userId || partner.humanId, conv.appointmentId);
    }
  };

  const getDeduplicatedConversations = () => {
    const seen = new Set();
    return filteredConversations.filter(c => {
      const partner = getPartner(c);
      const key = partner.humanId || partner.userId || c._id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const deduplicated = getDeduplicatedConversations();
  const drConversations = deduplicated.filter(c => getPartner(c).role === 'doctor');
  const ptConversations = deduplicated.filter(c => getPartner(c).role === 'patient');

  const renderConvItem = (conv) => {
    const partner = getPartner(conv);
    const isActive = activeConversation?._id === conv._id;
    return (
      <div
        key={conv._id}
        onClick={() => handleSelectConversation(conv)}
        className={`p-4 rounded-[28px] cursor-pointer transition-all flex items-center gap-4 group relative ${isActive ? (theme === 'dark' ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/30' : 'bg-blue-50 text-blue-700') : (theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-slate-50')} ${conv.isLocked ? 'opacity-60' : ''}`}
      >
        <div className="relative shrink-0">
          <div className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center text-lg font-black uppercase overflow-hidden ${isActive ? 'border-white/20 bg-white/10' : conv.isLocked ? 'border-zinc-700 bg-zinc-900/50 text-zinc-600' : conv.isPotential ? 'border-amber-500/30 bg-amber-500/5 text-amber-500' : 'border-white/5 bg-zinc-900 text-blue-500'}`}>
            {conv.isLocked ? <Shield size={20} /> : (
              partner.profilePicture ? (
                <img src={`${BACKEND_URL}${partner.profilePicture}`} alt={partner.name} className="w-full h-full object-cover" />
              ) : (
                partner.name?.charAt(0)
              )
            )}
          </div>
          {!conv.isPotential && !conv.isLocked && <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 ${theme === 'dark' ? 'border-zinc-950' : 'border-white'} bg-emerald-500 shadow-lg`}></div>}
        </div>
        <div className="flex-1 overflow-hidden text-left">
          <div className="flex justify-between items-center mb-0.5">
            <p className={`font-black text-xs uppercase tracking-tight truncate ${isActive ? 'text-white' : (theme === 'dark' ? 'text-zinc-200' : 'text-slate-800')}`}>{partner.name}</p>
            <span className={`text-[8px] font-black uppercase ${isActive ? 'text-blue-100' : 'text-zinc-500'}`}>
              {conv.lastMessage?.timestamp ? new Date(conv.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
            </span>
          </div>
          <p className={`text-[10px] font-bold truncate uppercase tracking-tighter ${isActive ? 'text-blue-50' : (conv.isLocked ? 'text-zinc-600' : conv.isPotential ? 'text-amber-500/70' : 'text-zinc-500')}`}>
            {partner.humanId} • {conv.lastMessage?.text || 'Node Link Synchronized'}
          </p>
        </div>

        {/* Delete Option */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteConversation(conv);
          }}
          className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/10 rounded-full text-zinc-600 hover:text-red-500 transition-all shrink-0"
          title="Dismiss Link"
        >
          <Trash2 size={14} />
        </button>

        {conv.unreadCount?.[user?.userId || user?._id] > 0 && (
          <div className="absolute right-4 bottom-4 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg animate-pulse">
            {conv.unreadCount[user?.userId || user?._id]}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-screen ${theme === 'dark' ? 'bg-[#050505] text-zinc-300' : 'bg-[#F8FAFC] text-slate-600'}`}>
      <Navbar />

      <div className="flex-1 flex overflow-hidden relative">

        {/* SIDEBAR */}
        <div className={`fixed inset-y-0 left-0 z-40 w-full sm:w-80 lg:relative lg:translate-x-0 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${theme === 'dark' ? 'bg-zinc-950 border-r border-white/5' : 'bg-white border-r border-slate-200'} flex flex-col pt-16 lg:pt-0`}>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className={`text-xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Neural Messages</h2>
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 hover:bg-white/5 rounded-xl"><X size={20}/></button>
            </div>

            <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all ${theme === 'dark' ? 'bg-white/5 border-white/5 focus-within:border-blue-500/50' : 'bg-slate-50 border-slate-100 focus-within:border-blue-500/50'}`}>
              <SearchIcon size={18} className="text-zinc-500" />
              <input
                type="text"
                placeholder="SEARCH REGISTRY..."
                className="bg-transparent border-none outline-none text-xs font-bold w-full uppercase tracking-widest placeholder:text-zinc-600"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar px-2 space-y-6">
            {loading ? (
               <div className="flex flex-col items-center py-20 gap-4 opacity-30">
                  <Loader2 className="animate-spin" size={32} />
                  <p className="text-[10px] font-black uppercase tracking-widest">Loading Nodes...</p>
               </div>
            ) : filteredConversations.length > 0 ? (
              <>
                {drConversations.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em] px-4">Specialist Peers</p>
                    <div className="space-y-1">{drConversations.map(renderConvItem)}</div>
                  </div>
                )}

                {ptConversations.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-purple-500 uppercase tracking-[0.2em] px-4">Clinical Patients</p>
                    <div className="space-y-1">{ptConversations.map(renderConvItem)}</div>
                  </div>
                )}
              </>
            ) : (
              <div className="py-20 text-center opacity-20 flex flex-col items-center gap-4">
                 <MessageCircle size={48} />
                 <p className="text-[10px] font-black uppercase tracking-widest px-10 leading-relaxed">
                   {search ? `No node matching "${search}" in your authorized registry.` : "No active neural links found in registry."}
                 </p>
                 {search && (
                   <button
                     onClick={() => navigate('/patient/find-doctor')}
                     className="mt-4 px-6 py-2 bg-blue-600/20 text-blue-400 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all opacity-100"
                   >
                     Establish New Link
                   </button>
                 )}
              </div>
            )}
          </div>
        </div>

        {/* CHAT MAIN WINDOW */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-center bg-no-repeat bg-contain">
          {activeConversation ? (
            <>
              {/* HEADER */}
              <div className={`p-3 sm:p-4 border-b flex items-center justify-between z-30 transition-all ${theme === 'dark' ? 'bg-[#0A0A0A]/90 backdrop-blur-3xl border-white/5' : 'bg-white/90 backdrop-blur-3xl border-slate-200'}`}>
                <div className="flex items-center gap-3 text-left">
                  <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-zinc-500 hover:text-white transition-all"><ChevronLeft size={24}/></button>
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500 font-black shrink-0 shadow-inner overflow-hidden">
                    {activeConversation.isLocked ? <Shield size={20} /> : (
                      getPartner(activeConversation).profilePicture ? (
                        <img src={`${BACKEND_URL}${getPartner(activeConversation).profilePicture}`} alt={getPartner(activeConversation).name} className="w-full h-full object-cover" />
                      ) : (
                        getPartner(activeConversation).name?.charAt(0)
                      )
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <h3 className={`text-sm sm:text-base font-black uppercase tracking-tight truncate ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                      {getPartner(activeConversation).name}
                    </h3>
                    <p className={`text-[8px] sm:text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${activeConversation.isLocked ? 'text-amber-500' : 'text-emerald-500'}`}>
                       <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${activeConversation.isLocked ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                       {activeConversation.isLocked ? 'PROTOCOL: AWAITING AUTHORIZATION' : (receiverTyping ? 'OPERATOR TYPING...' : `ID: ${getPartner(activeConversation).humanId || 'Active'} • Online`)}
                    </p>
                  </div>
                </div>

                {!activeConversation.isLocked && (
                  <div className="flex items-center gap-2 sm:gap-3">
                    {initializing && <Loader2 size={16} className="animate-spin text-blue-500 mr-2" />}
                    {(() => {
                      const partner = getPartner(activeConversation);
                      const isSpecialist = partner?.role === 'doctor' || (partner?.humanId && partner.humanId.toUpperCase().startsWith('DOC'));
                      return !isSpecialist && (
                        <>
                          <button
                            disabled={initializing}
                            onClick={() => handleInitiateCall('voice')}
                            className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all shadow-sm flex items-center gap-2 ${initializing ? 'opacity-30 cursor-not-allowed' : theme === 'dark' ? 'bg-blue-600/10 border border-blue-500/20 text-blue-500 hover:bg-blue-600 hover:text-white' : 'bg-blue-50 border border-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white'}`}
                            title="Initiate Voice Call"
                          >
                            <PhoneIcon size={18} />
                          </button>
                          <button
                            disabled={initializing}
                            onClick={() => handleInitiateCall('video')}
                            className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all shadow-sm flex items-center gap-2 ${initializing ? 'opacity-30 cursor-not-allowed' : theme === 'dark' ? 'bg-purple-600/10 border border-purple-500/20 text-purple-500 hover:bg-purple-600 hover:text-white' : 'bg-purple-50 border border-purple-100 text-purple-600 hover:bg-purple-600 hover:text-white'}`}
                            title="Initiate Video Call"
                          >
                            <Video size={18} />
                          </button>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>

              {activeConversation.isLocked ? (
                <div className="flex-1 flex flex-col items-center justify-center p-10 gap-8 animate-in fade-in duration-700 bg-[#050505] neural-grid">
                   <div className="w-24 h-24 rounded-[32px] border border-amber-500/20 bg-amber-500/5 flex items-center justify-center shadow-2xl relative">
                      <div className="absolute inset-0 bg-amber-500/10 blur-2xl animate-pulse"></div>
                      <Shield size={40} className="text-amber-500 relative z-10" />
                   </div>
                   <div className="text-center space-y-4 max-w-sm">
                      <h2 className="text-xl font-black uppercase text-white tracking-tighter">Clinical Sync Pending</h2>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-relaxed">
                        {user.role === 'doctor'
                          ? "This link is currently locked. Tap 'Accept Node' in the registry sidebar to establish the bidirectional stream."
                          : "Your specialist has not yet authorized this neural link. Access will be granted once the appointment node is accepted."}
                      </p>
                   </div>
                   {user.role === 'doctor' && (
                     <button
                       onClick={() => handleSelectConversation(activeConversation)}
                       className="px-8 py-4 bg-emerald-600 text-white rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl hover:bg-emerald-500 transition-all active:scale-95"
                     >
                       Authorize Link Now
                     </button>
                   )}
                </div>
              ) : (
                <>
                  {/* MESSAGES */}
                  <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-4 custom-scrollbar scroll-smooth">
                    {messages.map((msg, i) => {
                      const myId = (user?._id || user?.userId || '').toString();
                      const senderId = (msg.senderId || '').toString();
                      const isMe = senderId === myId;

                      const showDate = i === 0 || new Date(msg.createdAt).toDateString() !== new Date(messages[i-1].createdAt).toDateString();

                      return (
                        <React.Fragment key={msg._id || i}>
                          {showDate && (
                            <div className="flex justify-center my-10">
                              <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-[0.3em] ${theme === 'dark' ? 'bg-white/5 text-zinc-500 border border-white/5' : 'bg-slate-100 text-slate-400'}`}>
                                {new Date(msg.createdAt).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                              </span>
                            </div>
                          )}

                          <div className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                            <div className={`flex gap-3 sm:gap-4 max-w-[85%] sm:max-w-[70%] items-end ${isMe ? 'flex-row' : 'flex-row'}`}>
                              {!isMe && (
                                <div className={`w-8 h-8 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center text-blue-500 font-black text-[10px] shrink-0 shadow-lg hidden sm:flex`}>
                                   {getPartner(activeConversation).name?.charAt(0)}
                                </div>
                              )}
                              <div className={`space-y-1 ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                                 <div className={`p-3 sm:p-4 rounded-[24px] shadow-xl relative overflow-hidden transition-all hover:scale-[1.01] ${
                                   isMe
                                     ? 'bg-blue-600 text-white rounded-br-none border border-blue-400/20'
                                     : (theme === 'dark' ? 'bg-zinc-950 border border-white/5 text-zinc-300 rounded-bl-none' : 'bg-white border border-slate-100 text-slate-700 rounded-bl-none')
                                 }`}>
                                   {/* Attachments Rendering */}
                                   {msg.attachments && msg.attachments.length > 0 && (
                                     <div className="mb-3 space-y-2">
                                       {msg.attachments.map((att, idx) => {
                                         const isImage = att.fileType?.startsWith('image/');
                                         const isAudio = att.fileType?.startsWith('audio/');

                                         if (isImage) return (
                                           <a key={idx} href={`${BACKEND_URL}${att.url}`} target="_blank" rel="noreferrer">
                                             <img src={`${BACKEND_URL}${att.url}`} alt="Attachment" className="max-w-full rounded-2xl border border-white/10 hover:opacity-90 transition-opacity" />
                                           </a>
                                         );

                                         if (isAudio) return (
                                           <div key={idx} className="flex items-center gap-2 bg-black/20 p-3 rounded-2xl">
                                             <audio src={`${BACKEND_URL}${att.url}`} controls className="h-8 max-w-[200px]" />
                                           </div>
                                         );

                                         return (
                                           <a key={idx} href={`${BACKEND_URL}${att.url}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-black/10 rounded-2xl hover:bg-black/20 transition-all">
                                             <FileText size={20} className="text-blue-400" />
                                             <div className="overflow-hidden">
                                               <p className="text-[10px] font-black truncate">{att.name}</p>
                                               <p className="text-[8px] opacity-60 uppercase">{(att.size / 1024).toFixed(1)} KB</p>
                                             </div>
                                           </a>
                                         );
                                       })}
                                     </div>
                                   )}

                                   {/* Message Content with JSON formatting */}
                                   <div className="text-xs sm:text-sm font-bold leading-relaxed text-left space-y-3">
                                     {msg.type === 'call' ? (
                                       <div className="flex items-center gap-3 py-1 px-0.5">
                                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isMe ? 'bg-white/20' : 'bg-blue-600/10'}`}>
                                            {msg.text.includes('STARTED') ? <PhoneIcon size={14} className="animate-pulse" /> : <PhoneOff size={14} className="opacity-60" />}
                                          </div>
                                          <div>
                                             <p className="font-black uppercase tracking-widest text-[9px] sm:text-[10px]">{msg.text}</p>
                                             {msg.metadata?.duration && <p className="text-[7px] sm:text-[8px] opacity-60 font-bold uppercase mt-0.5">Duration: {msg.metadata.duration}</p>}
                                          </div>
                                       </div>
                                     ) : (() => {
                                       let content = msg.text;
                                       try {
                                         const jsonStart = content.indexOf('{');
                                         const jsonEnd = content.lastIndexOf('}') + 1;
                                         if (jsonStart !== -1 && jsonEnd > jsonStart) {
                                           const rawJson = content.substring(jsonStart, jsonEnd);
                                           const parsed = JSON.parse(rawJson);
                                           content = formatJsonToText(parsed);
                                         }
                                       } catch (e) {}

                                       return content.split('\n').map((line, idx) => {
                                         const trimmed = line.trim();
                                         if (!trimmed && line !== "---") return null;
                                         if (line === "---") return <div key={idx} className="border-t border-white/10 my-4" />;

                                         // Remove bullet points from text before processing components
                                         const cleanLine = trimmed.replace(/^[*|-]\s*/, '');
                                         const parts = cleanLine.split(/\*\*(.*?)\*\*/g);

                                         const renderedLine = parts.map((part, i) => {
                                           if (i % 2 === 1) return <strong key={i} className="font-black text-white">{part}</strong>;
                                           return part;
                                         });

                                         if (trimmed.startsWith('####')) {
                                           return <h4 key={idx} className="text-sm font-black uppercase text-blue-400 mt-4 mb-2">{trimmed.replace(/#/g, '').trim()}</h4>;
                                         }

                                         if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
                                           return (
                                             <div key={idx} className="flex gap-2 pl-4 text-left">
                                               <span className="text-blue-400 font-bold">•</span>
                                               <div className="flex-1">{renderedLine}</div>
                                             </div>
                                           );
                                         }
                                         return <p key={idx}>{renderedLine}</p>;
                                       });
                                     })()}
                                   </div>

                                   {/* Status Indicators */}
                                   <div className={`mt-2 flex items-center justify-end gap-1.5 text-[8px] font-black uppercase tracking-widest ${isMe ? 'text-blue-100/60' : 'text-zinc-500'}`}>
                                     {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                     {isMe && (
                                       msg.status === 'read' ? <CheckCheck size={10} className="text-blue-100" /> : <Check size={10} />
                                     )}
                                   </div>
                                 </div>
                              </div>
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* INPUT AREA */}
                  <div className={`p-3 sm:p-6 pt-0 z-40 bg-gradient-to-t ${theme === 'dark' ? 'from-[#050505] via-[#050505]/95' : 'from-[#F8FAFC] via-[#F8FAFC]/95'} to-transparent`}>
                    <div className="max-w-6xl mx-auto flex flex-col gap-4">

                      {/* Doctor Quick Tools */}
                      {user.role === 'doctor' && (
                        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                           {[
                             { id: 'prescription', label: 'Prescription', icon: Pill, color: 'text-blue-400' },
                             { id: 'report', label: 'Lab Report', icon: FileText, color: 'text-purple-400' },
                             { id: 'followup', label: 'Follow-up', icon: Clock, color: 'text-amber-400' },
                             ...(getPartner(activeConversation).role === 'doctor' ? [
                               { id: 'refer', label: 'Refer Case', icon: Users, color: 'text-emerald-400' }
                             ] : [])
                           ].map((tool, i) => (
                             <button
                               key={i}
                               onClick={() => setActiveModal(tool.id)}
                               className="shrink-0 px-4 py-2 bg-white/5 border border-white/5 rounded-full flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:border-white/20 transition-all"
                             >
                                <tool.icon size={12} className={tool.color} /> {tool.label}
                             </button>
                           ))}
                        </div>
                      )}

                      <form onSubmit={handleSend} className={`p-3 rounded-[32px] shadow-2xl border flex items-center gap-3 transition-all duration-500 relative ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/5 focus-within:border-blue-500/50' : 'bg-white border-slate-200 focus-within:border-blue-600/30'}`}>
                        {/* Hidden Inputs */}
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={(e) => handleFileSelect(e, 'file')}
                          className="hidden"
                        />
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          ref={cameraInputRef}
                          onChange={(e) => handleFileSelect(e, 'image')}
                          className="hidden"
                        />

                        {/* Emoji Picker Overlay */}
                        {showEmojiPicker && (
                          <>
                            <div className="fixed inset-0 z-[90]" onClick={() => setShowEmojiPicker(false)}></div>
                            <div className={`absolute bottom-full left-0 mb-4 p-4 rounded-3xl border shadow-2xl z-[100] grid grid-cols-6 gap-2 animate-in slide-in-from-bottom-2 ${theme === 'dark' ? 'bg-zinc-900 border-white/10 shadow-black' : 'bg-white border-slate-200'}`}>
                              {['😊', '😂', '🤣', '❤️', '👍', '🙏', '💊', '🏥', '🚑', '🩺', '🤒', '🤕', '😴', '🏃', '🍎', '🥦', '💧', '✅', '❌', '⚠️', '🔥', '🤝', '⚡', '✨'].map(emoji => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => addEmoji(emoji)}
                                  className="text-xl hover:scale-125 transition-transform p-2 active:bg-blue-500/10 rounded-xl"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </>
                        )}

                        <div className="flex gap-1 sm:gap-2">
                           <button
                             type="button"
                             onClick={() => fileInputRef.current?.click()}
                             className={`p-3 rounded-2xl transition-all ${theme === 'dark' ? 'text-zinc-500 hover:text-white hover:bg-white/5' : 'text-slate-400 hover:text-slate-800 hover:bg-slate-50'}`}
                           >
                             <Paperclip size={20}/>
                           </button>
                           <button
                             type="button"
                             onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                             className={`p-3 rounded-2xl transition-all ${showEmojiPicker ? 'text-blue-500 bg-blue-500/10' : theme === 'dark' ? 'text-zinc-500 hover:text-white hover:bg-white/5' : 'text-slate-400 hover:text-slate-800 hover:bg-slate-50'}`}
                           >
                             <Smile size={20}/>
                           </button>
                           <button
                             type="button"
                             onClick={() => cameraInputRef.current?.click()}
                             className={`p-3 rounded-2xl transition-all hidden sm:block ${theme === 'dark' ? 'text-zinc-500 hover:text-white hover:bg-white/5' : 'text-slate-400 hover:text-slate-800 hover:bg-slate-50'}`}
                           >
                             <Camera size={20}/>
                           </button>
                        </div>

                        <input
                          type="text"
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          placeholder={user.role === 'doctor' ? "PROVIDE CLINICAL INSTRUCTION..." : "DESCRIBE BIOMETRIC ANOMALY..."}
                          className={`flex-1 bg-transparent border-none outline-none py-4 px-2 text-xs sm:text-sm font-bold placeholder:opacity-50 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}
                        />

                        <div className="flex items-center gap-2 px-2">
                           {initializing ? (
                             <div className="w-14 h-14 flex items-center justify-center opacity-30">
                               <Loader2 className="animate-spin text-blue-500" size={24} />
                             </div>
                           ) : !input.trim() ? (
                             <button
                               type="button"
                               onMouseDown={startRecording}
                               onMouseUp={stopRecording}
                               onTouchStart={startRecording}
                               onTouchEnd={stopRecording}
                               className={`w-14 h-14 rounded-[24px] border transition-all flex items-center justify-center ${isRecording ? 'bg-red-500 border-red-400 text-white animate-pulse' : 'bg-white/5 border-white/5 text-zinc-500 hover:text-blue-500'}`}
                             >
                               <Mic size={22}/>
                             </button>
                           ) : (
                             <button
                               type="submit"
                               disabled={sending}
                               className="w-14 h-14 rounded-[24px] bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-xl shadow-blue-500/30 transition-all active:scale-90"
                             >
                               {sending ? <Loader2 className="animate-spin" size={20}/> : <Send size={20}/>}
                             </button>
                           )}
                        </div>
                      </form>
                    </div>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-10 gap-8 animate-in fade-in duration-700">
               <div className={`w-32 h-32 sm:w-40 sm:h-40 rounded-[56px] border flex items-center justify-center shadow-2xl relative ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/5' : 'bg-white border-slate-100'}`}>
                  <div className="absolute inset-0 bg-blue-600/10 blur-3xl animate-pulse"></div>
                  <MessageCircle size={64} className="text-blue-500 relative z-10" />
               </div>
               <div className="text-center space-y-4 max-w-sm">
                  <h2 className={`text-2xl font-black uppercase tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Select a Neural Stream</h2>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest leading-relaxed">
                     Establish a bidirectional clinical link with your assigned specialist to begin synchronization.
                  </p>
               </div>
               <button onClick={() => setSidebarOpen(true)} className="lg:hidden px-8 py-4 bg-blue-600 text-white rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl">Open Registry</button>
            </div>
          )}
        </div>
      </div>

      {/* OVERLAY MODALS */}
      <AnimatePresence>
        {activeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-xl flex flex-col p-4 sm:p-10"
          >
            <div className="flex-1 overflow-hidden flex flex-col max-w-7xl mx-auto w-full">
              {activeModal === 'prescription' && (
                <WritePrescription
                  patientId={getPartner(activeConversation).humanId || getPartner(activeConversation).userId}
                  hideNavbar={true}
                  onComplete={() => setActiveModal(null)}
                />
              )}
              {activeModal === 'report' && (
                <AIReportReview
                  patientId={getPartner(activeConversation).humanId || getPartner(activeConversation).userId}
                  hideNavbar={true}
                  onComplete={() => setActiveModal(null)}
                  onShare={handleShareFromTool}
                />
              )}
              {activeModal === 'followup' && (
                <Followups
                  patientId={getPartner(activeConversation).humanId || getPartner(activeConversation).userId}
                  hideNavbar={true}
                  onComplete={() => setActiveModal(null)}
                />
              )}
              {activeModal === 'refer' && (
                <ReferCase
                  referredDoctor={getPartner(activeConversation)}
                  onComplete={() => setActiveModal(null)}
                  onShare={handleShareFromTool}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 0px; }
      `}</style>
    </div>
  );
};

export default ChatSystem;
