import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from '../common/Navbar';
import {
  Video, Mic, PhoneOff, MessageCircle, User as UserIcon, Clock, Shield,
  Loader2, MicOff, VideoOff, Maximize2, Volume2, Layout, ShieldCheck as ShieldCheckIcon, X, Zap, UserCheck
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import useStore from '../../store/useStore';
import api from '../../utils/api';
import FloatingVideo from '../common/FloatingVideo';
import CommLinkPopup from '../common/CommLinkPopup';
import { motion, AnimatePresence } from 'framer-motion';

const VideoConsultation = () => {
  const { user, theme, socket: globalSocket } = useStore();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const roomCode = searchParams.get('roomCode');
  const appointmentId = searchParams.get('appointmentId');
  const patientIdFromUrl = searchParams.get('patientId') || searchParams.get('peerId');
  const patientNameFromUrl = searchParams.get('patientName') || searchParams.get('peerName');
  const isP2P = searchParams.get('isP2P') === 'true';

  const [stream, setStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isFloating, setIsFloating] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const [messages, setMessages] = useState([]);
  const [patient, setPatient] = useState(null);
  const SESSION_DURATION = 20 * 60;
  const [timeLeft, setTimeLeft] = useState(SESSION_DURATION);

  const [opinionData, setOpinionData] = useState({ diagnosis: '', symptoms: '', notes: '', remarks: '' });
  const [showOpinionModal, setShowOpinionModal] = useState(false);

  const [localAudioLevel, setLocalAudioLevel] = useState(0);
  const [remoteAudioLevel, setRemoteAudioLevel] = useState(0);

  const myVideo = useRef();
  const userVideo = useRef();
  const streamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const targetSocketIdRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const socketRef = useRef(globalSocket);
  const candidateQueue = useRef([]);
  const hasEmittedSignal = useRef(false);
  const remoteMeterCtxRef = useRef(null);

  // Sync stream state to ref
  useEffect(() => {
    streamRef.current = stream;
  }, [stream]);

  // Measure local microphone level
  useEffect(() => {
    if (!stream || isMuted) {
      setLocalAudioLevel(0);
      return;
    }
    let inv = null;
    let ctx = null;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      ctx = new AudioCtx();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      src.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkVol = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setLocalAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
      };
      inv = setInterval(checkVol, 80);
    } catch (e) {}

    return () => {
      if (inv) clearInterval(inv);
      if (ctx) ctx.close();
    };
  }, [stream, isMuted]);

  // Measure remote audio stream level
  useEffect(() => {
    if (!remoteStream) {
      setRemoteAudioLevel(0);
      return;
    }

    let inv = null;
    let meterCtx = null;

    const startMeter = () => {
      try {
        const audioTracks = remoteStream.getAudioTracks();
        if (!audioTracks || audioTracks.length === 0) return;

        if (remoteMeterCtxRef.current) {
          try { remoteMeterCtxRef.current.close(); } catch (e) {}
        }

        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        meterCtx = new AudioCtx();
        remoteMeterCtxRef.current = meterCtx;

        if (meterCtx.state === 'suspended') meterCtx.resume();

        const audioOnlyStream = new MediaStream(audioTracks);
        const src = meterCtx.createMediaStreamSource(audioOnlyStream);
        const analyser = meterCtx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.3;
        src.connect(analyser);

        const gain = meterCtx.createGain();
        gain.gain.value = 0.001;
        analyser.connect(gain);
        gain.connect(meterCtx.destination);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        inv = setInterval(() => {
          if (meterCtx && meterCtx.state === 'suspended') meterCtx.resume();
          analyser.getByteFrequencyData(dataArray);
          const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          const level = Math.min(100, Math.round((avg / 128) * 100));
          setRemoteAudioLevel(level);
        }, 80);
      } catch (e) {}
    };

    const t = setTimeout(startMeter, 200);

    return () => {
      clearTimeout(t);
      if (inv) clearInterval(inv);
      if (meterCtx) {
        try { meterCtx.close(); } catch (e) {}
      }
      remoteMeterCtxRef.current = null;
      setRemoteAudioLevel(0);
    };
  }, [remoteStream]);

  const createPeerConnection = (targetSocketId, localStream) => {
    if (peerConnectionRef.current) {
      try { peerConnectionRef.current.close(); } catch (e) {}
      peerConnectionRef.current = null;
    }

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
      ]
    });

    peerConnectionRef.current = pc;

    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }

    pc.ontrack = (event) => {
      console.log("[VIDEO] Remote track received:", event.track.kind);
      let streamToUse = (event.streams && event.streams[0]) ? event.streams[0] : null;
      if (!streamToUse) {
        if (!remoteStreamRef.current) {
          remoteStreamRef.current = new MediaStream();
        }
        remoteStreamRef.current.addTrack(event.track);
        streamToUse = remoteStreamRef.current;
      }
      setRemoteStream(streamToUse);
      setCallAccepted(true);
      if (userVideo.current) {
        userVideo.current.srcObject = streamToUse;
        userVideo.current.play().catch(() => {});
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current && targetSocketIdRef.current) {
        socketRef.current.emit("ice-candidate", {
          to: String(targetSocketIdRef.current),
          candidate: event.candidate
        });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("[VIDEO] Connection state:", pc.connectionState);
      if (pc.connectionState === 'connected') {
        setCallAccepted(true);
        console.log("[VIDEO] VIDEO CONNECTION ESTABLISHED");
        toast.success("Video Consultation Tunnel Established!");
      }
      if (
        pc.connectionState === "failed" ||
        pc.connectionState === "disconnected" ||
        pc.connectionState === "closed"
      ) {
        console.warn("[VIDEO] WebRTC connection:", pc.connectionState);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("[VIDEO] ICE connection:", pc.iceConnectionState);
    };

    pc.onsignalingstatechange = () => {
      console.log("[VIDEO] Signaling state:", pc.signalingState);
    };

    return pc;
  };

  const callUser = async (targetSocketId, localStream) => {
    try {
      if (!targetSocketId) {
        console.error("[VIDEO] No target socket ID");
        return;
      }
      if (!localStream) {
        console.error("[VIDEO] No local stream");
        return;
      }

      console.log("[VIDEO] Doctor calling socket:", targetSocketId);
      targetSocketIdRef.current = String(targetSocketId);

      const pc = createPeerConnection(String(targetSocketId), localStream);
      peerConnectionRef.current = pc;

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });

      await pc.setLocalDescription(offer);

      socketRef.current.emit("call-user", {
        userToCall: String(targetSocketId),
        signalData: offer,
        from: user.userId || user._id,
        name: user.name,
        conversationId: roomCode,
        callType: 'video',
        isP2P
      });

      console.log("[VIDEO] Doctor offer sent");
    } catch (err) {
      console.error("[VIDEO] Doctor create offer error:", err);
    }
  };

  const answerCall = async (data, localStream) => {
    try {
      if (!localStream) {
        console.error("[VIDEO] Doctor: local stream missing");
        return;
      }

      const targetSocketId = data.fromSocketId || data.from;
      if (!targetSocketId) {
        console.error("[VIDEO] Doctor: missing target socket ID");
        return;
      }

      targetSocketIdRef.current = String(targetSocketId);
      console.log("[VIDEO] Doctor answering call from socket:", targetSocketId);
      const pc = createPeerConnection(String(targetSocketId), localStream);
      peerConnectionRef.current = pc;

      const offerSignal = data.signal || data.signalData || data;
      if (offerSignal) {
        await pc.setRemoteDescription(new RTCSessionDescription(offerSignal));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socketRef.current.emit("make-answer", {
          signal: answer,
          to: String(targetSocketId)
        });

        console.log("[VIDEO] Doctor answer sent");

        while (candidateQueue.current.length > 0) {
          const candidate = candidateQueue.current.shift();
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            console.error("[VIDEO] Queued ICE error:", err);
          }
        }
      }
    } catch (err) {
      console.error("[VIDEO] Doctor answer error:", err);
    }
  };

  useEffect(() => {
    if (!globalSocket) {
      console.log("[VIDEO_SYNC] Awaiting global socket node...");
      return;
    }

    socketRef.current = globalSocket;

    if (patientIdFromUrl) {
      fetchPatient(patientIdFromUrl);
    }

    const startStream = async () => {
      try {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const currentStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: isMobile ? { max: 640 } : { ideal: 1280 },
            height: isMobile ? { max: 480 } : { ideal: 720 },
            frameRate: { max: 24 }
          },
          audio: true
        });
        setStream(currentStream);
        if (myVideo.current) {
          myVideo.current.srcObject = currentStream;
          myVideo.current.muted = true;
          myVideo.current.playsInline = true;
          await myVideo.current.play().catch(() => {});
        }
      } catch (err) {
        console.error("[HARDWARE_SYNC_ERR]", err);
        toast.error("Hardware node offline.");
      }
    };

    const handleUserJoined = ({ socketId, userName }) => {
      console.log("[VIDEO] Patient joined:", socketId);
      toast.success(`${userName} linked to session`);
      targetSocketIdRef.current = String(socketId);
      if (streamRef.current) {
        callUser(String(socketId), streamRef.current);
      }
    };

    const handleCallMade = (data) => {
      console.log("[VIDEO] Doctor received call-made:", data);
      if (streamRef.current) {
        answerCall(data, streamRef.current);
      } else {
        sessionStorage.setItem('pending_signal', JSON.stringify(data));
      }
    };

    const handleCallAccepted = async (data) => {
      try {
        console.log("[VIDEO] Doctor received answer:", data);
        const answer = data?.signal || data?.signalData;
        if (!answer) return;
        if (data?.fromSocketId) targetSocketIdRef.current = String(data.fromSocketId);

        const pc = peerConnectionRef.current;
        if (!pc) return;

        if (pc.signalingState === "have-local-offer") {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        }

        while (candidateQueue.current.length > 0) {
          const candidate = candidateQueue.current.shift();
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {}
        }
      } catch (err) {}
    };

    const handleIceCandidate = async ({ candidate, fromSocketId }) => {
      if (!candidate) return;
      if (fromSocketId) targetSocketIdRef.current = String(fromSocketId);
      const pc = peerConnectionRef.current;
      if (!pc || !pc.remoteDescription) {
        candidateQueue.current.push(candidate);
        return;
      }
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {}
    };

    const handleReceiveMessage = (data) => setMessages(prev => [...prev, data]);
    const handleCallDeclined = () => {
      toast.error("Peer declined the call node");
      navigate('/doc-dashboard');
    };
    const handlePeerEnded = () => {
      toast.error("Peer disconnected the sync");
      handleEndCall(true);
    };

    const socket = socketRef.current;
    socket.on("user-joined", handleUserJoined);
    socket.on("call-made", handleCallMade);
    socket.on("call-accepted", handleCallAccepted);
    socket.on("ice-candidate", handleIceCandidate);
    socket.on("receive-message", handleReceiveMessage);
    socket.on("call-declined", handleCallDeclined);
    socket.on("peer-ended-call", handlePeerEnded);

    if (roomCode && user?.userId) {
      socket.emit("join-room", {
        roomCode: String(roomCode),
        userId: String(user.userId || user._id),
        userName: user.name
      });
    }

    // Initiate signaling after listeners are ready
    const pendingSignalRaw = sessionStorage.getItem('pending_signal');
    if (pendingSignalRaw && searchParams.get('incoming') === 'true') {
      const parsed = JSON.parse(pendingSignalRaw);
      sessionStorage.removeItem('pending_signal');
      const signal = parsed?.signal || parsed;
      const fromSocketId = parsed?.fromSocketId;
      if (streamRef.current) {
        answerCall({ signal, fromSocketId }, streamRef.current);
      }
    }

    startStream();

    return () => {
      if (peerConnectionRef.current) peerConnectionRef.current.close();
      if (socket) {
        socket.off("user-joined", handleUserJoined);
        socket.off("call-made", handleCallMade);
        socket.off("call-accepted", handleCallAccepted);
        socket.off("ice-candidate", handleIceCandidate);
        socket.off("receive-message", handleReceiveMessage);
        socket.off("call-declined", handleCallDeclined);
        socket.off("peer-ended-call", handlePeerEnded);
      }
    };
  }, [roomCode, globalSocket]);

  useEffect(() => {
    let interval = null;
    if (callAccepted && !callEnded) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callAccepted, callEnded]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (remoteStream && userVideo.current) {
      console.log("[VIDEO_SYNC] Binding remote stream to video element:", remoteStream);
      userVideo.current.srcObject = remoteStream;
      userVideo.current.muted = false;
      userVideo.current.volume = 1.0;
      userVideo.current.play().catch(e => console.warn("[VIDEO_SYNC] Autoplay blocked:", e));
    }
  }, [remoteStream, callAccepted]);

  const fetchPatient = async (id) => {
    try {
      const { data } = await api.get(`/doctor/patient/${id}`);
      setPatient(data);
      if (appointmentId) await api.put(`/appointments/start-session/${appointmentId}`);
    } catch (err) { console.error(err); }
  };

  const handleSendMessage = (message) => {
    socketRef.current.emit("send-message", { roomCode, message, sender: user?.name || 'Doctor' });
  };

  const toggleAudio = () => {
    if (stream) {
      const track = stream.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsMuted(!track.enabled);
        if (!track.enabled) setLocalAudioLevel(0);
      }
    }
  };

  const toggleVideo = () => {
    if (stream) {
      const track = stream.getVideoTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsVideoOff(!track.enabled);
      }
    }
  };

  const handleEndCall = async (skipSignal = false) => {
    if (peerConnectionRef.current) peerConnectionRef.current.close();
    if (stream) stream.getTracks().forEach(track => track.stop());

    if (!skipSignal && socketRef.current) {
      socketRef.current.emit("end-call-signal", { to: patientIdFromUrl, roomCode, conversationId: roomCode });
      socketRef.current.emit("end-call", { to: patientIdFromUrl, roomCode, conversationId: roomCode });
    }

    setCallEnded(true);
    setCallAccepted(false);
    sessionStorage.removeItem('pending_signal');
    hasEmittedSignal.current = false;
    useStore.getState().setIncomingCall(null);

    if (isP2P) {
      const spentTime = SESSION_DURATION - timeLeft;
      const duration = formatTime(spentTime);
      await api.post('/chat/log-call', {
        conversationId: roomCode,
        receiverId: patientIdFromUrl,
        callType: 'video',
        status: 'ended',
        duration
      });
      navigate('/doc-dashboard');
    } else {
      setShowOpinionModal(true);
    }
  };

  const submitOpinion = async () => {
    try {
      const spentTime = SESSION_DURATION - timeLeft;
      const duration = formatTime(spentTime);
      await api.post('/appointments/share-opinion', { appointmentId, ...opinionData });

      await api.post('/chat/log-call', {
        conversationId: roomCode,
        receiverId: patientIdFromUrl,
        callType: 'video',
        status: 'ended',
        duration
      });

      toast.success("Medical Opinion Synchronized");
      navigate('/doc-dashboard');
    } catch (err) { toast.error("Failed to share opinion"); }
  };

  return (
    <div className={`flex h-screen overflow-hidden text-left transition-colors duration-500 ${theme === 'dark' ? 'bg-[#050505] text-slate-300' : 'bg-[#F8FAFC] text-slate-600'}`}>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 flex overflow-hidden relative">

          {/* FULL VIDEO ARENA */}
          <div className={`flex-1 relative overflow-hidden transition-all duration-700 ${isFloating ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100'}`}>

            {/* 1. REMOTE VIDEO (PATIENT) - FULL BACKGROUND */}
            <div className="absolute inset-0 z-0 bg-black">
              <video playsInline ref={userVideo} autoPlay className={`w-full h-full object-cover ${callAccepted && !callEnded ? 'block' : 'hidden'}`} />
              {(!callAccepted || callEnded) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#09090B]">
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-600/20 blur-[100px] rounded-full animate-pulse"></div>
                    <div className="w-48 h-48 bg-white/5 border border-white/10 rounded-full flex items-center justify-center relative z-10 shadow-2xl">
                      <UserIcon size={96} className="text-zinc-800" />
                    </div>
                    <div className="absolute top-0 right-0 w-12 h-12 bg-blue-600 rounded-full border-4 border-[#09090B] flex items-center justify-center shadow-lg animate-bounce">
                      <Zap size={20} className="text-white" />
                    </div>
                  </div>
                  <div className="text-center mt-12 space-y-4 px-6">
                    <h3 className="text-xl sm:text-3xl font-black text-white uppercase tracking-[0.2em] sm:tracking-[0.4em]">{isP2P ? 'Awaiting Peer Connection' : 'Awaiting Patient Link'}</h3>
                    <p className="text-[10px] sm:text-xs font-bold text-zinc-600 uppercase tracking-widest sm:tracking-[0.6em] flex items-center justify-center gap-2 sm:gap-4">
                      <Loader2 className="animate-spin text-blue-500" size={16} /> {isP2P ? 'Initializing Specialist Node Sync' : 'Establishing P2P Diagnostic Tunnel'}
                    </p>
                    {!stream && (
                      <button
                        onClick={() => window.location.reload()}
                        className="mt-6 px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-blue-500 transition-all active:scale-95 mx-auto block"
                      >
                        Retry Hardware Sync
                      </button>
                    )}
                  </div>
                  <div className="absolute bottom-20 flex items-center gap-4 px-6 sm:px-8 py-3 bg-white/5 border border-white/10 rounded-full backdrop-blur-xl max-w-[90%]">
                    <Shield size={16} className="text-emerald-500 shrink-0" />
                    <p className="text-[8px] sm:text-[10px] font-black uppercase text-zinc-500 tracking-widest truncate">RSA-4096 Multi-Layer Encryption Node Active</p>
                  </div>
                </div>
              )}
            </div>

            {/* 2. LOCAL VIDEO (DOCTOR) - FLOATING PIP */}
            <motion.div
              drag
              dragConstraints={{ top: 20, left: 20, right: 20, bottom: 20 }}
              whileDrag={{ scale: 1.05 }}
              initial={{
                x: window.innerWidth < 640 ? window.innerWidth - 140 : window.innerWidth - 300,
                y: window.innerWidth < 640 ? window.innerHeight - 340 : window.innerHeight - 450
              }}
              className="absolute z-40 w-32 h-44 sm:w-60 sm:h-80 rounded-[24px] sm:rounded-[32px] overflow-hidden border-2 border-white/10 shadow-[0_32px_64px_rgba(0,0,0,0.5)] cursor-move group backdrop-blur-3xl bg-black/20"
            >
              <video playsInline muted ref={myVideo} autoPlay className={`w-full h-full object-cover grayscale-[0.2] ${isVideoOff ? 'hidden' : ''}`} />
              {(!stream || isVideoOff) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/90 backdrop-blur-md">
                  <UserIcon size={window.innerWidth < 640 ? 24 : 32} className="text-blue-500 mb-2" />
                  <p className="text-[7px] sm:text-[8px] font-black uppercase text-blue-500 tracking-widest">Operator mode off</p>
                </div>
              )}
              <div className="absolute top-2 left-2 sm:top-4 sm:left-4 px-2 py-0.5 sm:px-3 sm:py-1 bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-[6px] sm:text-[8px] font-black uppercase tracking-widest text-white flex items-center gap-1 sm:gap-2">
                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-blue-500 rounded-full animate-pulse"></div> YOU
              </div>

              {/* Local Mic Volume Bar */}
              <div className="absolute bottom-2 left-2 right-2 p-1.5 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 flex flex-col gap-1">
                <div className="flex items-center justify-between text-[8px] font-bold text-white">
                  <span>MIC</span>
                  <span>{isMuted ? 'MUTED' : `${localAudioLevel}%`}</span>
                </div>
                <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-400 rounded-full transition-all duration-75" style={{ width: `${isMuted ? 0 : localAudioLevel}%` }} />
                </div>
              </div>
            </motion.div>

            {/* 3. HEADER OVERLAY */}
            <div className="absolute top-4 left-4 right-4 sm:top-10 sm:left-10 sm:right-10 z-30 flex justify-between items-start pointer-events-none">
              <div className="bg-[#121214BF] backdrop-blur-3xl border border-white/10 px-4 py-3 sm:px-8 sm:py-5 rounded-[20px] sm:rounded-[32px] shadow-2xl flex items-center gap-4 sm:gap-10 pointer-events-auto">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-600/30"><UserIcon size={window.innerWidth < 640 ? 20 : 28} /></div>
                  <div className="text-left overflow-hidden max-w-[80px] sm:max-w-none">
                    <p className="text-[10px] sm:text-base font-black text-white uppercase tracking-tight leading-none truncate">{patientNameFromUrl || (isP2P ? 'Peer' : 'Patient')}</p>
                    <div className="flex items-center gap-2 mt-1 sm:mt-2">
                      <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${callAccepted ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-amber-500 shadow-[0_0_10px_#f59e0b]'} animate-pulse`}></div>
                      <span className="text-[7px] sm:text-[10px] font-black text-blue-500 uppercase tracking-widest">
                        {callAccepted ? `VOICE PEER: ${remoteAudioLevel}%` : 'PENDING'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="w-px h-6 sm:h-10 bg-white/10"></div>
                <div className="flex items-center gap-4 sm:gap-8">
                  <div className="flex items-center gap-2 sm:gap-4">
                    <div className="p-1.5 sm:p-2.5 bg-white/5 rounded-lg sm:rounded-xl border border-white/5"><Clock size={window.innerWidth < 640 ? 14 : 18} className="text-blue-500" /></div>
                    <div className="text-left leading-none">
                      <p className="text-[6px] sm:text-[8px] font-black text-zinc-500 uppercase mb-0.5 sm:mb-1">Time</p>
                      <span className={`text-[10px] sm:text-base font-black font-mono tracking-tighter ${timeLeft < 300 ? 'text-rose-500 animate-pulse' : 'text-white'}`}>{formatTime(timeLeft)}</span>
                    </div>
                  </div>
                  <div className="hidden md:flex items-center gap-3 px-5 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                    <ShieldCheckIcon size={16} className="text-emerald-500" />
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">RSA-4096 Secure Link</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:gap-4 pointer-events-auto">
                <button onClick={() => setIsPopupOpen(true)} className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-[#121214BF] backdrop-blur-3xl border border-white/10 flex items-center justify-center text-white hover:bg-blue-600 hover:border-blue-500 transition-all shadow-2xl relative group">
                  <MessageCircle size={window.innerWidth < 640 ? 20 : 28} className="group-hover:scale-110 transition-transform" />
                  {messages.length > 0 && <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-red-600 rounded-full border-2 border-[#050505] flex items-center justify-center text-[9px] sm:text-[11px] font-black shadow-lg shadow-red-600/30 animate-bounce">!</div>}
                </button>
                <button onClick={() => setIsFloating(true)} className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-[#121214BF] backdrop-blur-3xl border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all shadow-2xl group"><Layout size={window.innerWidth < 640 ? 20 : 28} className="group-hover:scale-110 transition-transform" /></button>
              </div>
            </div>

            {/* 4. BOTTOM CONTROLS */}
            <div className="absolute bottom-6 sm:bottom-12 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 sm:gap-6 bg-[#121214BF] backdrop-blur-3xl border border-white/10 p-3 sm:p-5 rounded-full sm:rounded-[48px] shadow-[0_40px_100px_rgba(0,0,0,0.8)] w-[95%] sm:w-auto justify-center">
              <div className="flex items-center gap-2 sm:gap-4">
                <button onClick={toggleAudio} title="Microphone" className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full sm:rounded-3xl flex items-center justify-center transition-all active:scale-90 ${isMuted ? 'bg-rose-600 text-white border-rose-500 shadow-rose-600/30' : 'bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'}`}>
                  {isMuted ? <MicOff size={window.innerWidth < 640 ? 20 : 24} /> : <Mic size={window.innerWidth < 640 ? 20 : 24} />}
                </button>
                <button onClick={toggleVideo} title="Camera" className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full sm:rounded-3xl flex items-center justify-center transition-all active:scale-90 ${isVideoOff ? 'bg-rose-600 text-white border-rose-500 shadow-rose-600/30' : 'bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'}`}>
                  {isVideoOff ? <VideoOff size={window.innerWidth < 640 ? 20 : 24} /> : <Video size={window.innerWidth < 640 ? 20 : 24} />}
                </button>
                <button title="Speaker" className="w-12 h-12 sm:w-16 sm:h-16 rounded-full sm:rounded-3xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-all active:scale-90"><Volume2 size={window.innerWidth < 640 ? 20 : 24} /></button>
              </div>

              <div className="w-px h-8 sm:h-10 bg-white/10 mx-1 sm:mx-2"></div>

              <button onClick={() => handleEndCall(false)} title="End Call" className="px-6 sm:px-12 h-12 sm:h-18 rounded-full sm:rounded-[36px] bg-[#EF4444] text-white flex items-center justify-center hover:bg-red-700 transition-all shadow-[0_20px_60px_rgba(239,68,68,0.4)] active:scale-95 border-2 border-white/10 group gap-2 sm:gap-4">
                <PhoneOff size={window.innerWidth < 640 ? 24 : 32} className="group-hover:rotate-12 transition-transform" />
                <div className="text-left leading-none hidden sm:block">
                  <p className="text-[11px] font-black uppercase tracking-widest leading-none">Purge Node</p>
                  <p className="text-[8px] font-bold uppercase opacity-60 mt-1">End Sync</p>
                </div>
              </button>
            </div>
          </div>

          <FloatingVideo
            remoteStream={remoteStream}
            isActive={isFloating}
            onExpand={() => setIsFloating(false)}
            onClose={() => handleEndCall(false)}
            isMinimized={isMinimized}
            setIsMinimized={setIsMinimized}
            doctorName={patientNameFromUrl || "Patient Node"}
            specialization="Awaiting Triage"
            timeLeft={timeLeft}
            formatTime={formatTime}
          />

          <CommLinkPopup
            isOpen={isPopupOpen}
            onClose={() => setIsPopupOpen(false)}
            messages={messages}
            onSendMessage={handleSendMessage}
            user={user}
            theme={theme}
            opinionData={opinionData}
            setOpinionData={setOpinionData}
            onFinalize={() => handleEndCall(false)}
            patientData={patient}
          />

          {isFloating && (
            <button
              onClick={() => setIsFloating(false)}
              className="fixed top-28 right-12 z-[500] px-10 py-5 bg-blue-600 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.3em] shadow-[0_20px_50px_rgba(37,99,235,0.4)] flex items-center gap-4 animate-bounce border-2 border-white/20 hover:bg-blue-700 transition-all"
            >
              <Maximize2 size={20} /> Restore Neural Arena
            </button>
          )}

        </main>
      </div>

      <AnimatePresence>
        {showOpinionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2200] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-2xl rounded-[56px] border shadow-2xl overflow-hidden transition-all duration-500 ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/5' : 'bg-white border-slate-100'}`}
            >
              <div className={`p-10 border-b flex items-center justify-between ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-50'}`}>
                <div className="text-left">
                  <h2 className={`text-2xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Consultation Synthesis</h2>
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mt-1">Archive Synchronization Mode</p>
                </div>
                <button onClick={() => setShowOpinionModal(false)} className={`p-4 rounded-[20px] transition-all border ${theme === 'dark' ? 'bg-zinc-900 border-white/5 text-zinc-500 hover:text-white' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'}`}><X size={24} strokeWidth={3} /></button>
              </div>
              <div className="p-10 space-y-8 text-left">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Final Diagnosis</label>
                    <input
                      className={`w-full p-5 rounded-3xl border outline-none font-black uppercase text-xs transition-all ${theme === 'dark' ? 'bg-zinc-900 border-white/5 text-white' : 'bg-slate-50 border-slate-100'}`}
                      placeholder="E.G. ACUTE PHARYNGITIS"
                      value={opinionData.diagnosis}
                      onChange={(e) => setOpinionData({ ...opinionData, diagnosis: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Urgency Node</label>
                    <select className={`w-full p-5 rounded-3xl border outline-none font-black text-xs transition-all ${theme === 'dark' ? 'bg-zinc-900 border-white/5 text-white' : 'bg-slate-50 border-slate-100'}`}>
                      <option>ROUTINE RECOVERY</option>
                      <option>HIGH ATTENTION</option>
                      <option>CRITICAL MONITORING</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Clinical Remarks</label>
                  <textarea
                    className={`w-full p-6 rounded-[32px] border outline-none text-sm font-bold min-h-[140px] transition-all ${theme === 'dark' ? 'bg-zinc-900 border-white/5 text-white' : 'bg-slate-50 border-slate-100'}`}
                    placeholder="ENTER DETAILED CLINICAL NOTES..."
                    value={opinionData.notes}
                    onChange={(e) => setOpinionData({ ...opinionData, notes: e.target.value })}
                  ></textarea>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setShowOpinionModal(false)} className={`flex-1 py-6 rounded-[32px] font-black uppercase text-[10px] tracking-[0.3em] transition-all border ${theme === 'dark' ? 'border-white/5 text-zinc-500 hover:bg-white/5' : 'border-slate-100 text-slate-400 hover:bg-slate-50'}`}>Abort Sync</button>
                  <button
                    onClick={submitOpinion}
                    className="flex-[2] bg-blue-600 text-white py-6 rounded-[32px] font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl shadow-blue-500/40 hover:bg-blue-700 transition-all flex items-center justify-center gap-4 active:scale-95"
                  >
                    <UserCheck size={20} strokeWidth={3} /> Synchronize & Finalize
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VideoConsultation;
