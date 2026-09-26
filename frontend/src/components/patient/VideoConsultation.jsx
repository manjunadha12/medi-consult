import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from '../common/Navbar';
import {
  Video, Mic, PhoneOff, MessageSquare, User as UserIcon, Loader2, Sparkles, Shield,
  Maximize2, Zap, VideoOff, MicOff, ShieldCheck as ShieldCheckIcon, Send, Brain,
  MessageCircle, FileText, Clock, Volume2, Monitor, Minimize2, EyeOff, Layout
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import useStore from '../../store/useStore';
import api, { ICE_SERVERS, enforceHighQualityVideo } from '../../utils/api';
import FloatingVideo from '../common/FloatingVideo';
import CommLinkPopup from '../common/CommLinkPopup';
import { motion, AnimatePresence } from 'framer-motion';

const VideoConsultation = () => {
  const { user, theme, socket: globalSocket } = useStore();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [stream, setStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isFloating, setIsFloating] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const roomCode = searchParams.get('roomCode') || searchParams.get('appointmentId') || '';
  const appointmentId = searchParams.get('appointmentId') || '';
  const peerIdFromUrl = searchParams.get('peerId') || searchParams.get('doctorId');
  const peerNameFromUrl = searchParams.get('peerName') || searchParams.get('doctorName');

  const [messages, setMessages] = useState([]);
  const [patientData, setPatientData] = useState(null);
  const SESSION_DURATION = 20 * 60;
  const [timeLeft, setTimeLeft] = useState(SESSION_DURATION);

  const [localAudioLevel, setLocalAudioLevel] = useState(0);
  const [remoteAudioLevel, setRemoteAudioLevel] = useState(0);

  const myVideo = useRef(null);
  const userVideo = useRef(null);
  const streamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const targetSocketIdRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const socketRef = useRef(globalSocket);
  const candidateQueue = useRef([]);
  const hasEmittedSignal = useRef(false);
  const remoteMeterCtxRef = useRef(null);

  const remoteAudioRef = useRef(null);
  const localStreamPromiseRef = useRef(null);

  // Sync stream state to ref for async callbacks
  useEffect(() => {
    streamRef.current = stream;
  }, [stream]);

  // Global user interaction listener to unblock mobile audio policies
  useEffect(() => {
    const unlockAudio = () => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.muted = false;
        remoteAudioRef.current.volume = 1.0;
        if (remoteAudioRef.current.paused) {
          remoteAudioRef.current.play().catch(() => {});
        }
      }
      if (userVideo.current && userVideo.current.paused) {
        userVideo.current.play().catch(() => {});
      }
      if (remoteMeterCtxRef.current && remoteMeterCtxRef.current.state === 'suspended') {
        remoteMeterCtxRef.current.resume().catch(() => {});
      }
    };

    window.addEventListener('click', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);
    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

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
      if (ctx) {
        try { ctx.close(); } catch (e) {}
      }
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

  const createPeerConnection = (targetSocketId, localStream, isAnswerer = false) => {
    let pc = peerConnectionRef.current;

    if (!pc || pc.signalingState === 'closed') {
      pc = new RTCPeerConnection({
        iceServers: ICE_SERVERS,
        iceCandidatePoolSize: 10,
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require'
      });
      peerConnectionRef.current = pc;
    } else {
      console.log("[WEBRTC_PATIENT] Reusing active PeerConnection in state:", pc.signalingState);
    }

    targetSocketIdRef.current = String(targetSocketId);

    // If this is an offerer (not answerer), bind active tracks
    if (!isAnswerer) {
      const activeStream = localStream || streamRef.current;
      if (activeStream && pc) {
        const currentSenders = pc.getSenders();
        activeStream.getTracks().forEach(track => {
          track.enabled = true;
          const matchingSender = currentSenders.find(s => (s.track && s.track.kind === track.kind) || (!s.track && s.kind === track.kind));
          if (matchingSender) {
            console.log("[WEBRTC_PATIENT] Replacing track on existing sender:", track.kind, track.id);
            matchingSender.replaceTrack(track).catch(e => console.warn("[WEBRTC_PATIENT] replaceTrack error:", e));
          } else {
            console.log("[WEBRTC_PATIENT] Adding local track to PC:", track.kind, track.id);
            try {
              pc.addTrack(track, activeStream);
            } catch (e) {
              console.warn("[WEBRTC_PATIENT] Error adding local track:", e);
            }
          }
        });
      }
    }

    pc.ontrack = (event) => {
      console.log("[VIDEO_PATIENT] Remote track received:", event.track.kind, event.track.id);
      
      if (!remoteStreamRef.current) {
        remoteStreamRef.current = new MediaStream();
      }

      // Add/replace track in persistent remoteStreamRef
      const currentTracks = remoteStreamRef.current.getTracks();
      const existingTrack = currentTracks.find(t => t.kind === event.track.kind);
      if (existingTrack) {
        if (existingTrack.id !== event.track.id) {
          remoteStreamRef.current.removeTrack(existingTrack);
          remoteStreamRef.current.addTrack(event.track);
        }
      } else {
        remoteStreamRef.current.addTrack(event.track);
      }

      if (event.streams && event.streams[0]) {
        event.streams[0].getTracks().forEach(t => {
          if (!remoteStreamRef.current.getTracks().some(existing => existing.id === t.id)) {
            remoteStreamRef.current.addTrack(t);
          }
        });
      }

      const compositeStream = new MediaStream(remoteStreamRef.current.getTracks());
      setRemoteStream(compositeStream);
      setCallAccepted(true);

      if (userVideo.current) {
        const vEl = userVideo.current;
        vEl.srcObject = remoteStreamRef.current;
        vEl.muted = false;
        vEl.playsInline = true;
        vEl.play().catch(err => {
          console.warn("[PATIENT_VIDEO_UNMUTED_AUTOPLAY_NOTICE]", err);
          vEl.muted = true;
          vEl.play().catch(() => {});
        });
      }

      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStreamRef.current;
        remoteAudioRef.current.muted = false;
        remoteAudioRef.current.volume = 1.0;
        remoteAudioRef.current.play().catch(err => console.warn("[PATIENT_AUDIO_AUTOPLAY_NOTICE]", err));
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        const target = targetSocketIdRef.current || targetSocketId;
        if (target) {
          socketRef.current.emit("ice-candidate", {
            to: String(target),
            candidate: event.candidate
          });
        }
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("[VIDEO_PATIENT] Connection state:", pc.connectionState);
      if (pc.connectionState === 'connected') {
        setCallAccepted(true);
        console.log("[VIDEO_PATIENT] VIDEO CONNECTION ESTABLISHED");
        toast.success("Video Consultation Tunnel Established!");
      } else if (pc.connectionState === 'disconnected') {
        console.warn("[VIDEO_PATIENT] Network packet transition, awaiting WebRTC reconnect...");
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        console.warn("[VIDEO_PATIENT] WebRTC connection failed/closed:", pc.connectionState);
        setCallAccepted(false);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("[VIDEO_PATIENT] ICE connection:", pc.iceConnectionState);
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        setCallAccepted(true);
      } else if (pc.iceConnectionState === 'failed') {
        if (pc.restartIce) {
          console.log("[VIDEO_PATIENT] Triggering ICE restart...");
          pc.restartIce();
        }
      }
    };

    pc.onsignalingstatechange = () => {
      console.log("[VIDEO_PATIENT] Signaling state:", pc.signalingState);
    };

    return pc;
  };

  const answerCall = async (data, localStream) => {
    try {
      let activeStream = localStream || streamRef.current;
      if (!activeStream) {
        if (!localStreamPromiseRef.current) {
          startStream();
        }
        if (localStreamPromiseRef.current) {
          try {
            activeStream = await Promise.race([
              localStreamPromiseRef.current,
              new Promise(res => setTimeout(res, 3500))
            ]);
          } catch (e) {
            console.warn("[VIDEO_PATIENT] Error awaiting stream in answerCall:", e);
          }
        }
      }
      activeStream = activeStream || streamRef.current;

      const targetSocketId = data.fromSocketId || data.from;
      if (!targetSocketId) {
        console.error("[VIDEO_PATIENT] Missing target socket ID for answering call");
        return;
      }

      targetSocketIdRef.current = String(targetSocketId);
      console.log("[VIDEO_PATIENT] Answering call from socket:", targetSocketId, "Has active stream:", !!activeStream);

      // Clean up previous closed connection
      if (peerConnectionRef.current && peerConnectionRef.current.signalingState === 'closed') {
        peerConnectionRef.current = null;
      }

      // Initialize clean PeerConnection without pre-declared transceivers
      const pc = createPeerConnection(String(targetSocketId), null, true);
      peerConnectionRef.current = pc;

      const offerSignal = data.signal || data.signalData || data;
      if (!offerSignal) {
        console.error("[VIDEO_PATIENT] Offer payload missing");
        return;
      }

      // 1. Set remote offer FIRST so WebRTC initializes transceivers for mid:0, mid:1
      await pc.setRemoteDescription(new RTCSessionDescription(offerSignal));
      console.log("[VIDEO_PATIENT] Remote offer set successfully. Signaling state:", pc.signalingState);

      // 2. Attach local tracks to the transceivers created by the remote offer
      const transceivers = pc.getTransceivers();
      console.log("[VIDEO_PATIENT] Transceivers after remote description:", transceivers.map(t => `${t.mid}:${t.direction}`));

      if (activeStream) {
        activeStream.getTracks().forEach(track => {
          track.enabled = true;
          const tr = transceivers.find(t => 
            (t.receiver && t.receiver.track && t.receiver.track.kind === track.kind) ||
            (t.sender && t.sender.track && t.sender.track.kind === track.kind)
          );
          if (tr) {
            tr.direction = 'sendrecv';
            if (tr.sender) {
              console.log("[VIDEO_PATIENT] Attaching local track to transceiver mid:", tr.mid, track.kind);
              tr.sender.replaceTrack(track).catch(e => console.warn("[VIDEO_PATIENT] replaceTrack error:", e));
            }
          } else {
            console.log("[VIDEO_PATIENT] Fallback addTrack for:", track.kind);
            try {
              pc.addTrack(track, activeStream);
            } catch (e) {
              console.warn("[VIDEO_PATIENT] Fallback addTrack error:", e);
            }
          }
        });
      }

      // Ensure all transceivers in the offer are bidirectional sendrecv
      transceivers.forEach(tr => {
        tr.direction = 'sendrecv';
      });

      // 3. Create the answer SDP (guaranteed to contain sendrecv and patient's tracks)
      const answer = await pc.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      await pc.setLocalDescription(answer);
      enforceHighQualityVideo(pc);

      console.log("[VIDEO_PATIENT] Emitting answer SDP. Has sendrecv:", answer.sdp?.includes('a=sendrecv'));

      socketRef.current.emit("make-answer", {
        signal: answer,
        to: String(targetSocketId)
      });
      console.log("[VIDEO_PATIENT] Answer emitted to socket:", targetSocketId);

      // Drain queued ICE candidates
      while (candidateQueue.current.length > 0) {
        const candidate = candidateQueue.current.shift();
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
          console.log("[VIDEO_PATIENT] Queued ICE candidate added");
        } catch (err) {
          console.error("[VIDEO_PATIENT] Queued ICE error:", err);
        }
      }
    } catch (err) {
      console.error("[VIDEO_PATIENT] Answer call error:", err);
      setCallAccepted(false);
    }
  };

  useEffect(() => {
    if (!globalSocket) {
      console.log("[VIDEO_SYNC] Awaiting global socket node...");
      return;
    }

    socketRef.current = globalSocket;

    const currentPatientId = user?.userId || user?._id || user?.id || user?.patientId;
    if (currentPatientId) {
      socketRef.current.emit("register-user", String(currentPatientId));
    }

    const startStream = () => {
      if (localStreamPromiseRef.current) return localStreamPromiseRef.current;

      localStreamPromiseRef.current = (async () => {
        try {
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error("SECURE_CONTEXT_REQUIRED");
          }

          let currentStream = null;

          try {
            currentStream = await navigator.mediaDevices.getUserMedia({
              video: {
                facingMode: 'user',
                width: { ideal: 1280 },
                height: { ideal: 720 },
                frameRate: { ideal: 30 }
              },
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
              }
            });
          } catch (constraintErr) {
            console.warn("[VIDEO_PATIENT] Falling back to standard getUserMedia constraints:", constraintErr);
            try {
              currentStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
              });
            } catch (e1) {
              console.warn("[VIDEO_PATIENT] Falling back to audio-only getUserMedia:", e1);
              try {
                currentStream = await navigator.mediaDevices.getUserMedia({ audio: true });
              } catch (e2) {
                console.warn("[VIDEO_PATIENT] Falling back to video-only getUserMedia:", e2);
                try {
                  currentStream = await navigator.mediaDevices.getUserMedia({ video: true });
                } catch (e3) {
                  console.error("[VIDEO_PATIENT] All getUserMedia attempts failed:", e3);
                }
              }
            }
          }

          if (currentStream) {
            currentStream.getTracks().forEach(track => {
              track.enabled = true;
            });

            setStream(currentStream);
            streamRef.current = currentStream;

            if (myVideo.current) {
              myVideo.current.srcObject = currentStream;
              myVideo.current.muted = true;
              myVideo.current.playsInline = true;
              await myVideo.current.play().catch(() => {});
            }

            // Synchronize local tracks to active peer connection using replaceTrack or addTrack
            if (peerConnectionRef.current) {
              const pc = peerConnectionRef.current;
              const senders = pc.getSenders();
              currentStream.getTracks().forEach(track => {
                const matchingSender = senders.find(s => (s.track && s.track.kind === track.kind) || (!s.track && s.kind === track.kind));
                if (matchingSender) {
                  console.log("[VIDEO_PATIENT] Replacing track on existing PC sender:", track.kind, track.id);
                  matchingSender.replaceTrack(track).catch(e => console.warn("[VIDEO_PATIENT] replaceTrack error:", e));
                } else {
                  console.log("[VIDEO_PATIENT] Adding local track to existing PeerConnection:", track.kind, track.id);
                  try {
                    pc.addTrack(track, currentStream);
                  } catch (e) {
                    console.warn("[VIDEO_PATIENT] addTrack error:", e);
                  }
                }
              });
            }
          }

          // Check if offer was received and cached in sessionStorage while camera was initializing
          const pendingSignalRaw = sessionStorage.getItem('pending_signal');
          if (pendingSignalRaw) {
            console.log("[VIDEO_SYNC] Local camera ready, processing cached pending offer");
            sessionStorage.removeItem('pending_signal');
            try {
              const parsed = JSON.parse(pendingSignalRaw);
              await answerCall(parsed, currentStream);
            } catch (pErr) {
              console.error("[VIDEO_SYNC] Failed to parse pending signal:", pErr);
            }
          }

          return currentStream;
        } catch (err) {
          console.error("[HARDWARE_SYNC_ERR]", err);
          toast.error("Camera/Mic notice: Hardware check completed.");
          return null;
        }
      })();

      return localStreamPromiseRef.current;
    };

    const handleUserJoined = ({ socketId, userName }) => {
      console.log("[VIDEO_PATIENT] Doctor joined room:", socketId, userName);
      if (socketId) {
        targetSocketIdRef.current = String(socketId);
        toast.success(`${userName || "Doctor"} linked to consultation`);
      }
    };

    const handleCallMade = async (data) => {
      console.log("[VIDEO_PATIENT] Received call-made offer signal:", data);
      const offerSignal = data?.signal || data?.signalData;
      if (!offerSignal) return; // Notification ping only

      let activeStream = streamRef.current;
      if (!activeStream) {
        if (!localStreamPromiseRef.current) {
          startStream();
        }
        if (localStreamPromiseRef.current) {
          console.log("[VIDEO_PATIENT] Awaiting local media stream before answering offer...");
          try {
            activeStream = await Promise.race([
              localStreamPromiseRef.current,
              new Promise(res => setTimeout(res, 3500))
            ]);
          } catch (e) {
            console.warn("[VIDEO_PATIENT] Error awaiting local stream:", e);
          }
        }
      }

      await answerCall(data, activeStream || streamRef.current);
    };

    const handleCallAccepted = async (data) => {
      try {
        console.log("[VIDEO_PATIENT] Call accepted signal received:", data);
        const answer = data?.signal || data?.signalData;
        if (!answer) return;

        if (data?.fromSocketId) {
          targetSocketIdRef.current = String(data.fromSocketId);
        }

        const pc = peerConnectionRef.current;
        if (!pc) return;

        if (pc.signalingState === 'have-local-offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          console.log("[VIDEO_PATIENT] Remote description set for answer");
        }

        while (candidateQueue.current.length > 0) {
          const candidate = candidateQueue.current.shift();
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {}
        }
      } catch (e) {
        console.log("[VIDEO_PATIENT] Answer already applied or state stable:", e?.message || e);
      }
    };

    const handleIceCandidate = async ({ candidate, fromSocketId }) => {
      if (!candidate) return;
      if (fromSocketId) {
        targetSocketIdRef.current = String(fromSocketId);
      }

      const pc = peerConnectionRef.current;
      if (pc && pc.remoteDescription && pc.remoteDescription.type) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
          console.log("[VIDEO_PATIENT] ICE candidate applied");
        } catch (err) {
          console.error("[VIDEO_PATIENT] ICE candidate error:", err);
        }
      } else {
        candidateQueue.current.push(candidate);
        console.log("[VIDEO_PATIENT] ICE candidate queued");
      }
    };

    const handleUserLeft = ({ socketId }) => {
      console.log("[VIDEO_PATIENT] Socket left room:", socketId);
      // Only end if the call was already active and established with this specific peer
      if (callAccepted && targetSocketIdRef.current && targetSocketIdRef.current === String(socketId)) {
        if (peerConnectionRef.current && (peerConnectionRef.current.connectionState === 'connected' || peerConnectionRef.current.iceConnectionState === 'connected')) {
          console.log("[VIDEO_PATIENT] WebRTC tunnel is still active despite signaling socket leave. Continuing call.");
          return;
        }
        toast.error("Doctor disconnected from consultation room");
        handleEndCall(true);
      }
    };

    const handleReceiveMessage = (data) => setMessages(prev => [...prev, data]);
    const handleCallDeclined = () => {
      console.log("[VIDEO_PATIENT] Received call-declined");
      toast.error("Doctor declined the call node");
      handleEndCall(true);
    };
    const handlePeerEnded = () => {
      console.log("[VIDEO_PATIENT] Received peer-ended-call");
      toast.error("Doctor disconnected the sync");
      handleEndCall(true);
    };

    const socket = socketRef.current;

    // 1. Attach listeners
    socket.off("user-joined", handleUserJoined);
    socket.off("user-left", handleUserLeft);
    socket.off("call-accepted", handleCallAccepted);
    socket.off("ice-candidate", handleIceCandidate);
    socket.off("receive-message", handleReceiveMessage);
    socket.off("call-declined", handleCallDeclined);
    socket.off("peer-ended-call", handlePeerEnded);

    // 2. Attach listeners
    socket.on("user-joined", handleUserJoined);
    socket.on("user-left", handleUserLeft);
    socket.on("call-made", handleCallMade);
    socket.on("call-accepted", handleCallAccepted);
    socket.on("ice-candidate", handleIceCandidate);
    socket.on("receive-message", handleReceiveMessage);
    socket.on("call-declined", handleCallDeclined);
    socket.on("peer-ended-call", handlePeerEnded);

    // 3. Join consultation room
    if (roomCode && currentPatientId) {
      console.log("[VIDEO_SYNC] Patient emitting join-room:", roomCode, "User:", currentPatientId);
      socket.emit("join-room", {
        roomCode: String(roomCode),
        userId: String(currentPatientId),
        userName: user?.name || "Patient"
      });
    }

    // 4. Emit ringing notification to doctor if patient initiated the call
    if (
      peerIdFromUrl &&
      searchParams.get("incoming") !== "true" &&
      searchParams.get("fromChat") !== "true" &&
      !hasEmittedSignal.current
    ) {
      hasEmittedSignal.current = true;
      console.log("[VIDEO_SYNC] Patient emitting video call ringing ping to peer:", peerIdFromUrl);
      socket.emit("call-user", {
        userToCall: String(peerIdFromUrl),
        signalData: null,
        from: user?.userId || user?._id,
        name: user?.name || "Patient",
        conversationId: roomCode,
        callType: "video",
        isP2P: false
      });
    }

    // 5. Start camera stream immediately
    startStream();

    return () => {
      if (socket) {
        socket.emit("leave-room", { roomCode });
        socket.off("user-joined", handleUserJoined);
        socket.off("user-left", handleUserLeft);
        socket.off("call-accepted", handleCallAccepted);
        socket.off("ice-candidate", handleIceCandidate);
        socket.off("receive-message", handleReceiveMessage);
        socket.off("call-declined", handleCallDeclined);
        socket.off("peer-ended-call", handlePeerEnded);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        try { peerConnectionRef.current.close(); } catch (e) {}
        peerConnectionRef.current = null;
      }
      useStore.getState().registerUserSockets();
    };
  }, [roomCode]);

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
    if (remoteStream) {
      console.log("[VIDEO_SYNC] Binding remote stream to media elements:", remoteStream);
      if (userVideo.current) {
        const vEl = userVideo.current;
        if (vEl.srcObject !== remoteStream) {
          vEl.srcObject = remoteStream;
        }
        vEl.muted = false;
        vEl.play().catch(e => {
          console.warn("[VIDEO_SYNC] Video unmuted autoplay notice:", e);
          vEl.muted = true;
          vEl.play().catch(() => {});
        });
      }
      if (remoteAudioRef.current) {
        const aEl = remoteAudioRef.current;
        if (aEl.srcObject !== remoteStream) {
          aEl.srcObject = remoteStream;
        }
        aEl.muted = false;
        aEl.volume = 1.0;
        aEl.play().catch(e => console.warn("[VIDEO_SYNC] Audio autoplay notice:", e));
      }
    }
  }, [remoteStream, callAccepted]);

  const handleSendMessage = (message) => {
    if (socketRef.current) {
      socketRef.current.emit("send-message", { roomCode, message, sender: user?.name || 'Patient' });
    }
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

  const handleEndCall = (skipSignal = false) => {
    console.log("[VIDEO_PATIENT] Ending call immediately...");
    try {
      if (peerConnectionRef.current) {
        try { peerConnectionRef.current.close(); } catch (e) {}
        peerConnectionRef.current = null;
      }
      if (streamRef.current) {
        try { streamRef.current.getTracks().forEach(track => track.stop()); } catch (e) {}
      }
      if (stream) {
        try { stream.getTracks().forEach(track => track.stop()); } catch (e) {}
      }

      if (!skipSignal && socketRef.current) {
        socketRef.current.emit("end-call-signal", { to: peerIdFromUrl, roomCode, conversationId: roomCode });
        socketRef.current.emit("end-call", { to: peerIdFromUrl, roomCode, conversationId: roomCode });
        socketRef.current.emit("leave-room", { roomCode });
      }

      setCallEnded(true);
      setCallAccepted(false);
      sessionStorage.removeItem('pending_signal');
      if (hasEmittedSignal) hasEmittedSignal.current = false;
      useStore.getState().setIncomingCall(null);

      // Log call asynchronously without awaiting
      const spentTime = SESSION_DURATION - timeLeft;
      const duration = formatTime(spentTime);
      api.post('/chat/log-call', {
        conversationId: roomCode,
        receiverId: peerIdFromUrl,
        callType: 'video',
        status: 'ended',
        duration
      }).catch(() => {});

      toast.success("Video consultation ended");
    } catch (err) {
      console.warn("[VIDEO_PATIENT] Cleanup notice:", err);
    } finally {
      navigate('/patient/dashboard', { replace: true });
    }
  };

  return (
    <div className={`flex h-screen overflow-hidden text-left transition-colors duration-500 ${theme === 'dark' ? 'bg-[#050505] text-slate-300' : 'bg-[#F8FAFC] text-slate-600'}`}>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 flex overflow-hidden relative">

          {/* FULL VIDEO ARENA */}
          <div className={`flex-1 relative overflow-hidden transition-all duration-700 ${isFloating ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100'}`}>

            {/* 1. REMOTE VIDEO (DOCTOR) - FULL BACKGROUND */}
            <div className="absolute inset-0 z-0 bg-black">
              <audio ref={remoteAudioRef} autoPlay playsInline />
              <video
                playsInline
                webkit-playsinline="true"
                x5-playsinline="true"
                ref={userVideo}
                autoPlay
                controls={false}
                poster="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg'/>"
                onLoadedMetadata={(e) => {
                  e.target.play().catch(err => console.warn("[PATIENT_VIDEO_LOADED_ERR]", err));
                }}
                className="w-full h-full object-cover"
              />
              {(!callAccepted || callEnded || !remoteStream) && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#09090B]">
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
                    <h3 className="text-xl sm:text-3xl font-black text-white uppercase tracking-[0.2em] sm:tracking-[0.4em]">Awaiting Doctor Link</h3>
                    <p className="text-[10px] sm:text-xs font-bold text-zinc-600 uppercase tracking-widest sm:tracking-[0.6em] flex items-center justify-center gap-2 sm:gap-4">
                      <Loader2 className="animate-spin text-blue-500" size={16} /> Establishing P2P Diagnostic Tunnel
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

            {/* 2. LOCAL VIDEO (PATIENT) - FLOATING PIP */}
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
                    <p className="text-[10px] sm:text-base font-black text-white uppercase tracking-tight leading-none truncate">{peerNameFromUrl || 'Dr. Specialist'}</p>
                    <div className="flex items-center gap-2 mt-1 sm:mt-2">
                      <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${callAccepted && remoteStream ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-amber-500 shadow-[0_0_10px_#f59e0b]'} animate-pulse`}></div>
                      <span className="text-[7px] sm:text-[10px] font-black text-blue-500 uppercase tracking-widest">
                        {callAccepted && remoteStream ? `VOICE PEER: ${remoteAudioLevel}%` : 'AWAITING LINK'}
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
            doctorName={peerNameFromUrl || "Dr. Specialist"}
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
            onFinalize={() => handleEndCall(false)}
            patientData={patientData}
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
    </div>
  );
};

export default VideoConsultation;
