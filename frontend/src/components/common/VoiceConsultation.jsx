import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import {
  Mic, PhoneOff, MessageCircle, User as UserIcon, Shield,
  Loader2, MicOff, Volume2, Phone as PhoneIcon, Zap, Clock, ShieldCheck as ShieldCheckIcon, X, UserCheck
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import useStore from '../../store/useStore';
import api, { BACKEND_URL } from '../../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import CommLinkPopup from './CommLinkPopup';

const VoiceConsultation = () => {
  const { user, theme, socket: globalSocket } = useStore();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const roomCode = searchParams.get('roomCode');
  const appointmentId = searchParams.get('appointmentId');
  const peerIdFromUrl = searchParams.get('peerId');
  const peerNameFromUrl = searchParams.get('peerName');
  const isP2P = searchParams.get('isP2P') === 'true';

  const [stream, setStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [patient, setPatient] = useState(null);
  const SESSION_DURATION = 20 * 60;
  const [timeLeft, setTimeLeft] = useState(SESSION_DURATION);
  const [opinionData, setOpinionData] = useState({ diagnosis: '', symptoms: '', notes: '', remarks: '' });
  const [showOpinionModal, setShowOpinionModal] = useState(false);

  const [localAudioLevel, setLocalAudioLevel] = useState(0);
  const [remoteAudioLevel, setRemoteAudioLevel] = useState(0);

  const userVideo = useRef();
  const peerConnectionRef = useRef(null);
  const targetSocketIdRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const socketRef = useRef(globalSocket);
  const candidateQueue = useRef([]);
  const hasEmittedSignal = useRef(false);
  const callStartedRef = useRef(false);
  const initializedRef = useRef(false);
  const audioCtxRef = useRef(null);
  const remoteMeterCtxRef = useRef(null);
  const isActuallyConnected = peerConnectionRef.current?.connectionState === "connected" || (callAccepted && Boolean(remoteStream));

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

  // Measure remote audio stream level (Fix 9)
  useEffect(() => {
    if (!remoteStream) {
      setRemoteAudioLevel(0);
      return;
    }

    const audioTracks = remoteStream.getAudioTracks();
    if (audioTracks.length === 0) {
      setRemoteAudioLevel(0);
      return;
    }

    let interval = null;
    let ctx = null;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      ctx = new AudioCtx();

      remoteMeterCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(remoteStream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;

      source.connect(analyser);

      const data = new Uint8Array(analyser.frequencyBinCount);

      interval = setInterval(() => {
        analyser.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          sum += data[i];
        }
        const average = sum / data.length;
        const level = Math.min(100, Math.round((average / 128) * 100));
        setRemoteAudioLevel(level);
      }, 80);
    } catch (error) {
      console.error("[REMOTE_METER]", error);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }

      if (ctx) {
        try {
          ctx.close();
        } catch {}
      }

      remoteMeterCtxRef.current = null;
      setRemoteAudioLevel(0);
    };
  }, [remoteStream]);

  const playTestSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
      toast.success("Playing Hardware Test Tone 🎵");

      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      if (userVideo.current) {
        userVideo.current.muted = false;
        userVideo.current.volume = 1.0;
        userVideo.current.play().catch(e => console.warn("Audio play error:", e));
      }
    } catch (e) {
      console.error("Test sound error:", e);
    }
  };

  // Fix 4 — Explicit Audio createPeerConnection
  const createPeerConnection = (targetSocketId, localStream) => {
    if (peerConnectionRef.current) {
      try { peerConnectionRef.current.close(); } catch (e) {}
    }

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
      ]
    });

    peerConnectionRef.current = pc;
    targetSocketIdRef.current = String(targetSocketId);

    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      console.log("[WEBRTC] Local audio tracks:", audioTracks);
      audioTracks.forEach((track) => {
        console.log("[WEBRTC] Adding local audio track:", track.id, "enabled:", track.enabled);
        pc.addTrack(track, localStream);
      });
    }

    pc.ontrack = (event) => {
      console.log("================================");
      console.log("🔥🔥🔥 REMOTE TRACK RECEIVED 🔥🔥🔥");
      console.log("Track kind:", event.track.kind);
      console.log("Track id:", event.track.id);
      console.log("Track enabled:", event.track.enabled);
      console.log("Track muted:", event.track.muted);
      console.log("Track readyState:", event.track.readyState);
      console.log("Streams:", event.streams);
      console.log("================================");

      let streamToUse = event.streams?.[0];

      if (!streamToUse) {
        if (!remoteStreamRef.current) {
          remoteStreamRef.current = new MediaStream();
        }

        remoteStreamRef.current.addTrack(event.track);
        streamToUse = remoteStreamRef.current;
      }

      console.log(
        "🔥 REMOTE AUDIO TRACKS:",
        streamToUse.getAudioTracks()
      );

      setRemoteStream(streamToUse);
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
      console.log("🔥 CONNECTION STATE:", pc.connectionState);

      switch (pc.connectionState) {
        case "connected":
          console.log("🟢 WEBRTC CONNECTED");
          setCallAccepted(true);
          toast.success("Voice Tunnel Established!");
          break;

        case "connecting":
          console.log("🟡 WEBRTC CONNECTING");
          setCallAccepted(false);
          break;

        case "disconnected":
          console.warn("🟠 WEBRTC DISCONNECTED");
          break;

        case "failed":
          console.error("🔴 WEBRTC FAILED");
          setCallAccepted(false);
          break;

        case "closed":
          setCallAccepted(false);
          break;
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("🔥 ICE CONNECTION STATE:", pc.iceConnectionState);
    };

    pc.onsignalingstatechange = () => {
      console.log("🔥 SIGNALING STATE:", pc.signalingState);
    };

    return pc;
  };

  // Fix 8 — Improve callUser()
  const callUser = async (targetSocketId, localStream) => {
    try {
      if (!targetSocketId) {
        console.error("[WEBRTC] No target socket ID");
        return;
      }

      console.log("[WEBRTC] Calling socket:", targetSocketId);
      targetSocketIdRef.current = String(targetSocketId);
      const pc = createPeerConnection(String(targetSocketId), localStream);

      console.log("[WEBRTC] Creating offer...");
      const offer = await pc.createOffer({
        offerToReceiveAudio: true
      });

      await pc.setLocalDescription(offer);
      console.log("[WEBRTC] Local description created");

      socketRef.current.emit("call-user", {
        userToCall: String(targetSocketId),
        signalData: offer,
        from: user?.userId || user?._id,
        name: user?.name || "User",
        conversationId: roomCode,
        callType: "voice",
        isP2P
      });

      console.log("[WEBRTC] Offer sent");
    } catch (error) {
      console.error("[WEBRTC] Error creating offer:", error);
    }
  };

  // Fix 5 — Fix answerCall()
  const answerCall = async (data, localStream) => {
    try {
      console.log("🔥🔥🔥 PATIENT RECEIVED OFFER 🔥🔥🔥");
      console.log(data);

      const targetSocketId =
        data?.fromSocketId ||
        data?.from;

      if (!targetSocketId) {
        console.error("[WEBRTC] Missing caller socket ID");
        return;
      }

      targetSocketIdRef.current = String(targetSocketId);

      console.log("STEP 1: Create PeerConnection");
      const pc = createPeerConnection(
        String(targetSocketId),
        localStream
      );

      const offerSignal =
        data?.signal ||
        data?.signalData;

      if (!offerSignal) {
        console.error("[WEBRTC] Missing offer signal");
        return;
      }

      console.log("STEP 2: setRemoteDescription");
      await pc.setRemoteDescription(
        new RTCSessionDescription(offerSignal)
      );

      console.log("[WEBRTC] Remote offer applied");

      console.log("STEP 3: createAnswer");
      const answer = await pc.createAnswer();

      console.log("STEP 4: setLocalDescription");
      await pc.setLocalDescription(answer);

      console.log("STEP 5: emit make-answer");

      socketRef.current.emit("make-answer", {
        signal: answer,
        to: String(targetSocketId)
      });

      console.log("Answer sent to:", targetSocketId);

      while (candidateQueue.current.length > 0) {
        const candidate = candidateQueue.current.shift();
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (err) {
      console.error("PATIENT ANSWER ERROR:", err);
      setCallAccepted(false);
    }
  };

  useEffect(() => {
    if (!globalSocket) {
      console.log("[VOICE_SYNC] Awaiting global socket node...");
      return;
    }

    if (initializedRef.current) {
      console.log("[VOICE_SYNC] Stream & Socket connection already initialized - skipping duplicate mount effect.");
      return;
    }
    initializedRef.current = true;

    socketRef.current = globalSocket;

    const currentUserId =
      user?.userId ||
      user?._id ||
      user?.id ||
      user?.patientId ||
      user?.doctorId;

    if (!currentUserId) {
      console.error(
        "[VOICE_SYNC] No current user ID"
      );
      return;
    }

    socketRef.current.emit(
      "register-user",
      String(currentUserId)
    );

    console.log(
      "[VOICE_SYNC] Registered:",
      String(currentUserId)
    );

    if (peerIdFromUrl && user?.role === 'doctor' && !isP2P) {
      fetchPatient(peerIdFromUrl);
    }

    const startStream = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("SECURE_CONTEXT_REQUIRED");
        }

        const currentStream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: true
        });

        // Fix 11 — Verify microphone tracks
        const audioTracks = currentStream.getAudioTracks();
        console.log("================================");
        console.log("[MIC] Audio tracks:", audioTracks);
        audioTracks.forEach(track => {
          console.log("[MIC] Track:", {
            id: track.id,
            enabled: track.enabled,
            muted: track.muted,
            readyState: track.readyState
          });
        });
        console.log("================================");

        setStream(currentStream);

        if (roomCode) {
          socketRef.current.emit(
            "join-room",
            {
              roomCode: String(roomCode),
              userId: String(currentUserId),
              userName: user?.name || "User"
            }
          );

          console.log(
            "[VOICE_SYNC] Joined consultation room:",
            roomCode
          );
        }

        // Socket Event Handlers
        const handleUserJoined = ({ socketId, userId, userName }) => {
          console.log(
            "[VOICE_SYNC] USER JOINED:",
            {
              socketId,
              userId,
              userName,
              myRole: user?.role
            }
          );

          toast.success(`${userName} linked to voice session`);

          // ONLY DOCTOR creates the offer
          if (user?.role !== "doctor") {
            console.log("[VOICE_SYNC] Patient waiting for doctor's offer");
            return;
          }

          if (callStartedRef.current) {
            console.log("[VOICE_SYNC] Call already started - ignoring duplicate join");
            return;
          }

          if (!socketId) {
            console.error("[VOICE_SYNC] No peer socket ID");
            return;
          }

          callStartedRef.current = true;
          targetSocketIdRef.current = String(socketId);

          console.log("[VOICE_SYNC] STARTING ONE WEBRTC CALL:", socketId);

          callUser(String(socketId), currentStream);
        };

        const handleCallMade = async (data) => {
          console.log("🔥🔥🔥 PATIENT RECEIVED OFFER 🔥🔥🔥");
          console.log(data);
          try {
            await answerCall(data, currentStream);
          } catch (err) {
            console.error("PATIENT ANSWER ERROR:", err);
          }
        };

        const handleCallAccepted = async (data) => {
          console.log("🔥 DOCTOR GOT ANSWER 🔥");
          console.log(data);

          if (data?.fromSocketId) {
            targetSocketIdRef.current = String(data.fromSocketId);
          }
          const answer = data?.signal || data;
          if (peerConnectionRef.current && answer) {
            try {
              if (peerConnectionRef.current.signalingState === 'have-local-offer') {
                await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
                console.log("Doctor answer applied");
              }
              while (candidateQueue.current.length > 0) {
                const candidate = candidateQueue.current.shift();
                await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
              }
            } catch (e) {
              console.log("[NATIVE_WEBRTC] Answer already applied or state stable:", e?.message || e);
            }
          }
        };

        // Fix 10 — Keep ICE candidates queued correctly
        const handleIceCandidate = async ({ candidate, fromSocketId }) => {
          if (!candidate) return;
          if (fromSocketId) {
            targetSocketIdRef.current = String(fromSocketId);
          }

          const pc = peerConnectionRef.current;
          if (pc && pc.remoteDescription) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
              console.log("[WEBRTC] ICE candidate added");
            } catch (error) {
              console.error("[WEBRTC] ICE candidate error:", error);
            }
          } else {
            candidateQueue.current.push(candidate);
            console.log("[WEBRTC] ICE candidate queued");
          }
        };

        const handleReceiveMessage = (data) => setMessages(prev => [...prev, data]);
        const handleCallDeclined = () => {
          toast.error("Peer declined the voice node");
          navigate(user?.role === 'doctor' ? '/doc-dashboard' : '/patient/dashboard');
        };
        const handlePeerEnded = () => {
          toast.error("Peer disconnected the sync");
          handleEndCall(true);
        };

        // Remove duplicate listeners before attaching
        socketRef.current.off("user-joined");
        socketRef.current.off("call-made");
        socketRef.current.off("call-accepted");
        socketRef.current.off("ice-candidate");
        socketRef.current.off("receive-message");
        socketRef.current.off("call-declined");
        socketRef.current.off("peer-ended-call");

        socketRef.current.on("user-joined", handleUserJoined);
        socketRef.current.on("call-made", handleCallMade);
        socketRef.current.on("call-accepted", handleCallAccepted);
        socketRef.current.on("ice-candidate", handleIceCandidate);
        socketRef.current.on("receive-message", handleReceiveMessage);
        socketRef.current.on("call-declined", handleCallDeclined);
        socketRef.current.on("peer-ended-call", handlePeerEnded);

        // Initiate signaling after listeners are ready
        const pendingSignalRaw = sessionStorage.getItem('pending_signal');
        if (pendingSignalRaw && searchParams.get('incoming') === 'true') {
          const parsed = JSON.parse(pendingSignalRaw);
          sessionStorage.removeItem('pending_signal');
          const signal = parsed?.signal || parsed;
          const fromSocketId = parsed?.fromSocketId;
          answerCall({ signal, fromSocketId }, currentStream);
        } else if (
          user?.role === "doctor" &&
          peerIdFromUrl &&
          searchParams.get("incoming") !== "true" &&
          !hasEmittedSignal.current
        ) {
          hasEmittedSignal.current = true;
          console.log("[VOICE_SYNC] Doctor emitting call notification signal to peer:", peerIdFromUrl);
          socketRef.current.emit("call-user", {
            userToCall: String(peerIdFromUrl),
            signalData: null,
            from: user?.userId || user?._id,
            name: user?.name || "Doctor",
            conversationId: roomCode,
            callType: "voice"
          });
        }

        return () => {
          socketRef.current.off("user-joined", handleUserJoined);
          socketRef.current.off("call-made", handleCallMade);
          socketRef.current.off("call-accepted", handleCallAccepted);
          socketRef.current.off("ice-candidate", handleIceCandidate);
          socketRef.current.off("receive-message", handleReceiveMessage);
          socketRef.current.off("call-declined", handleCallDeclined);
          socketRef.current.off("peer-ended-call", handlePeerEnded);
        };
      } catch (err) {
        console.error("[VOICE_SYNC_ERR]", err);
        toast.error("Microphone handshake failed.");
      }
    };

    startStream();

    return () => {
      if (peerConnectionRef.current) peerConnectionRef.current.close();
      if (stream) stream.getTracks().forEach(track => track.stop());
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
    if (!remoteStream) {
      return;
    }

    if (!userVideo.current) {
      return;
    }

    const audio = userVideo.current;

    audio.srcObject = remoteStream;

    audio.muted = false;

    audio.volume = 1;

    const play = async () => {
      try {
        await audio.play();

        console.log(
          "🔊 REMOTE AUDIO PLAYING"
        );
      } catch (error) {
        console.warn(
          "Audio autoplay blocked:",
          error
        );
      }
    };

    play();
  }, [remoteStream]);

  // Fix 7 — Don't let fallback audio interfere during WebRTC testing
  /*
  useEffect(() => {
    if (!stream || !callAccepted || isMuted) return;

    try {
      const options = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? { mimeType: 'audio/webm;codecs=opus' }
        : {};
      const recorder = new MediaRecorder(stream, options);

      recorder.ondataavailable = (e) => {
        if (isMuted) return;
        if (e.data && e.data.size > 0 && socketRef.current && peerIdFromUrl) {
          e.data.arrayBuffer().then(buffer => {
            if (isMuted) return;
            socketRef.current.emit("send-audio-chunk", {
              to: peerIdFromUrl,
              chunk: buffer
            });
          });
        }
      };

      recorder.start(250);

      return () => {
        if (recorder && recorder.state !== 'inactive') recorder.stop();
      };
    } catch (err) {}
  }, [stream, callAccepted, isMuted, roomCode, peerIdFromUrl]);
  */

  // Listen to incoming socket audio chunks (fallback when WebRTC P2P is unavailable)
  useEffect(() => {
    if (!globalSocket) return;

    const handleReceiveChunk = ({ chunk }) => {
      if (remoteStream || !chunk || chunk.byteLength === 0) return;

      try {
        const approxVol = Math.min(100, Math.round((chunk.byteLength / 800) * 100));
        if (approxVol > 5) {
          setRemoteAudioLevel(approxVol);
          setTimeout(() => setRemoteAudioLevel(0), 200);
        }

        const blob = new Blob([chunk], { type: 'audio/webm;codecs=opus' });
        const url = URL.createObjectURL(blob);
        const tempAudio = new Audio();
        tempAudio.src = url;
        tempAudio.volume = 1.0;
        tempAudio.play().catch(() => {});
        setTimeout(() => URL.revokeObjectURL(url), 1500);
      } catch (e) {}
    };

    globalSocket.on("receive-audio-chunk", handleReceiveChunk);
    return () => {
      globalSocket.off("receive-audio-chunk", handleReceiveChunk);
    };
  }, [globalSocket, remoteStream]);

  const fetchPatient = async (id) => {
    try {
      const { data } = await api.get(`/doctor/patient/${id}`);
      setPatient(data);
      if (appointmentId) await api.put(`/appointments/start-session/${appointmentId}`);
    } catch (err) { console.error(err); }
  };

  const handleSendMessage = (message) => {
    if (!socketRef.current) return;
    const msgData = {
      roomCode,
      sender: user?.name || 'User',
      senderId: user?.userId || user?._id,
      text: message,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    socketRef.current.emit("send-message", msgData);
    setMessages(prev => [...prev, msgData]);
  };

  // Fix 12 — Make sure mute actually controls the track
  const toggleMute = () => {
    if (!stream) {
      toast.error("Microphone stream unavailable");
      return;
    }

    const nextMuteState = !isMuted;
    const audioTracks = stream.getAudioTracks();
    audioTracks.forEach(track => {
      track.enabled = !nextMuteState;
    });

    setIsMuted(nextMuteState);
    console.log("[MIC]", nextMuteState ? "MUTED" : "UNMUTED");

    if (nextMuteState) {
      setLocalAudioLevel(0);
      toast.error("Microphone muted");
    } else {
      toast.success("Microphone active");
    }
  };

  const handleEndCall = (isPeerEnded = false) => {
    if (peerConnectionRef.current) peerConnectionRef.current.close();
    if (stream) stream.getTracks().forEach(track => track.stop());

    if (!isPeerEnded && socketRef.current) {
      socketRef.current.emit("end-call", { to: peerIdFromUrl, roomCode, conversationId: roomCode });
      socketRef.current.emit("end-call-signal", { to: peerIdFromUrl, roomCode, conversationId: roomCode });
    }

    setCallEnded(true);
    setCallAccepted(false);
    sessionStorage.removeItem('pending_signal');
    hasEmittedSignal.current = false;
    callStartedRef.current = false;
    useStore.getState().setIncomingCall(null);

    if (user.role === 'doctor') {
      setShowOpinionModal(true);
    } else {
      toast.success("Voice consultation completed");
      navigate('/patient/dashboard');
    }
  };

  const submitOpinion = async () => {
    try {
      if (appointmentId) {
        await api.put(`/appointments/end-session/${appointmentId}`, opinionData);
      }
      toast.success("Clinical summary & prescription recorded successfully!");
      setShowOpinionModal(false);
      navigate('/doc-dashboard');
    } catch (err) {
      toast.error("Error committing medical record");
    }
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#050505] text-white' : 'bg-slate-50 text-slate-900'} flex flex-col font-sans relative overflow-hidden transition-colors duration-500`}>
      <Navbar />

      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-blue-600/15 to-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />

      <audio
        ref={userVideo}
        autoPlay
        playsInline
        muted={false}
        controls={false}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-between relative z-10">

        {/* Top Header Card */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-[32px] bg-white/5 border border-white/10 backdrop-blur-2xl shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Zap size={24} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${callAccepted ? 'bg-emerald-500 animate-ping' : 'bg-amber-500 animate-pulse'}`} />
                <span className={`text-xs font-black uppercase tracking-[0.2em] ${callAccepted ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {callAccepted ? "Neural Voice Tunnel Active" : "Ringing... Awaiting Peer Link"}
                </span>
              </div>
              <h1 className="text-lg font-bold tracking-tight mt-0.5">
                Voice Consultation Mode • {user.role === 'doctor' ? (patient?.name || peerNameFromUrl || 'Patient') : (peerNameFromUrl || 'Dr. Specialist')}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold font-mono">
              <Clock size={16} className="text-blue-400" />
              <span>{formatTime(timeLeft)}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
              <ShieldCheckIcon size={16} />
              <span>AES-256 Voice Link</span>
            </div>
            <button
              onClick={playTestSound}
              className="px-3.5 py-2 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-bold transition-all active:scale-95 flex items-center gap-2"
              title="Test hardware speakers"
            >
              <Volume2 size={16} />
              <span className="hidden md:inline">Test Sound</span>
            </button>
          </div>
        </div>

        {/* Central Consultation Stage */}
        <div className="w-full my-auto py-12 flex flex-col items-center justify-center">

          {/* Central Avatar Visualizer */}
          <div className="relative flex items-center justify-center">
            {/* Dynamic Pulsing Rings based on Remote Voice Volume */}
            {callAccepted && (
              <>
                <motion.div
                  animate={{ scale: [1, 1.15 + (remoteAudioLevel / 300), 1], opacity: [0.2, 0.5, 0.2] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  className="absolute w-72 h-72 rounded-full bg-blue-500/20 border border-blue-500/30 blur-sm pointer-events-none"
                />
                <motion.div
                  animate={{ scale: [1, 1.3 + (remoteAudioLevel / 200), 1], opacity: [0.1, 0.35, 0.1] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", delay: 0.2 }}
                  className="absolute w-96 h-96 rounded-full bg-indigo-500/15 border border-indigo-500/20 blur-md pointer-events-none"
                />
              </>
            )}

            {/* Avatar Sphere Container */}
            <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-gradient-to-b from-blue-600/30 to-indigo-900/40 p-2 border-2 border-white/20 shadow-[0_0_80px_rgba(37,99,235,0.3)] backdrop-blur-3xl flex items-center justify-center group">
              <div className="w-full h-full rounded-full bg-[#0a0f1d] border border-white/10 flex flex-col items-center justify-center relative overflow-hidden">

                {!callAccepted && !callEnded ? (
                  <div className="flex flex-col items-center gap-3 p-4 text-center">
                    <Loader2 size={44} className="text-amber-400 animate-spin" />
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-widest animate-pulse">Ringing Peer...</span>
                    <span className="text-[10px] text-slate-400">Awaiting peer to accept link</span>
                  </div>
                ) : (
                  <>
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl mb-2">
                      <UserIcon size={48} className="text-white" />
                    </div>
                    <h3 className="font-bold text-base tracking-tight text-white">
                      {user.role === 'doctor' ? (patient?.name || peerNameFromUrl || 'Patient') : (peerNameFromUrl || 'Dr. Specialist')}
                    </h3>
                    <p className="text-[11px] text-emerald-400 font-semibold uppercase tracking-wider">
                      Live Audio Connected
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Level Meters Section */}
          <div className="mt-12 w-full max-w-xl grid grid-cols-1 sm:grid-cols-2 gap-6">

            {/* Local Mic Volume Progress Bar & Equalizer */}
            <div className="p-5 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-2 text-slate-300">
                  {isMuted ? <MicOff size={16} className="text-rose-400" /> : <Mic size={16} className="text-blue-400" />}
                  <span>Your Microphone</span>
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase font-mono ${isMuted ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
                  {isMuted ? 'MUTED (0%)' : `${localAudioLevel}%`}
                </span>
              </div>

              {/* Gradient Progress Track */}
              <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/10 relative">
                <motion.div
                  className={`h-full rounded-full ${isMuted ? 'bg-rose-500/40' : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400'}`}
                  animate={{ width: `${isMuted ? 0 : localAudioLevel}%` }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              </div>

              {/* Bouncing Equalizer Bars */}
              <div className="flex items-center justify-center gap-1.5 h-6 mt-1">
                {[0.8, 1.2, 0.6, 1.5, 1.0, 0.7].map((factor, i) => (
                  <motion.div
                    key={i}
                    className={`w-1.5 rounded-full ${isMuted ? 'bg-rose-500/30' : 'bg-blue-400'}`}
                    animate={{
                      height: isMuted ? 4 : Math.max(4, Math.min(24, localAudioLevel * 0.24 * factor))
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  />
                ))}
              </div>
            </div>

            {/* Remote Peer Voice Output Progress Bar & Equalizer */}
            <div className="p-5 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-2 text-slate-300">
                  <Volume2 size={16} className="text-emerald-400" />
                  <span>Peer Voice Output</span>
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase font-mono ${isActuallyConnected ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : (stream ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30')}`}>
                  {isActuallyConnected ? `${remoteAudioLevel}%` : (stream ? 'CONNECTING...' : 'OFFLINE')}
                </span>
              </div>

              {/* Gradient Progress Track */}
              <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/10 relative">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400"
                  animate={{ width: `${isActuallyConnected ? remoteAudioLevel : 0}%` }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              </div>

              {/* Bouncing Equalizer Bars */}
              <div className="flex items-center justify-center gap-1.5 h-6 mt-1">
                {[1.1, 0.7, 1.4, 0.9, 1.3, 0.6].map((factor, i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 rounded-full bg-emerald-400"
                    animate={{
                      height: !isActuallyConnected ? 4 : Math.max(4, Math.min(24, remoteAudioLevel * 0.24 * factor))
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  />
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="w-full max-w-xl p-4 rounded-[32px] bg-white/5 border border-white/10 backdrop-blur-2xl shadow-2xl flex items-center justify-around gap-4">
          <button
            onClick={toggleMute}
            className={`p-5 rounded-full border transition-all active:scale-95 shadow-xl flex items-center justify-center ${
              isMuted
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 hover:bg-rose-500/30'
                : 'bg-white/10 border-white/15 text-white hover:bg-white/20'
            }`}
            title={isMuted ? "Unmute Mic" : "Mute Mic"}
          >
            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </button>

          <button
            onClick={() => setIsPopupOpen(true)}
            className="p-5 rounded-full bg-white/10 border border-white/15 text-white hover:bg-white/20 transition-all active:scale-95 shadow-xl flex items-center justify-center relative"
            title="Open Chat Overlay"
          >
            <MessageCircle size={24} />
            {messages.length > 0 && (
              <span className="absolute top-1 right-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-[#050505]" />
            )}
          </button>

          <button
            onClick={() => handleEndCall(false)}
            className="px-8 py-5 rounded-full bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(225,29,72,0.4)] transition-all active:scale-95 flex items-center gap-3"
          >
            <PhoneOff size={20} />
            <span>End Call</span>
          </button>
        </div>

      </main>

      {/* Interactive Chat Overlay Modal */}
      <CommLinkPopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        messages={messages}
        onSendMessage={handleSendMessage}
        roomCode={roomCode}
        userName={user.name}
      />

      {/* Clinical Opinion Summary Modal for Doctors */}
      {showOpinionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-xl bg-[#0d1322] border border-white/15 rounded-[40px] p-8 shadow-2xl flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-xl font-extrabold text-white">Record Clinical Summary</h3>
                <p className="text-xs text-slate-400 mt-1">Finalize voice consultation notes for patient records</p>
              </div>
              <button onClick={() => navigate('/doc-dashboard')} className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">Primary Diagnosis</label>
                <input
                  type="text"
                  placeholder="e.g. Acute Pharyngitis / Viral Fever"
                  value={opinionData.diagnosis}
                  onChange={(e) => setOpinionData({ ...opinionData, diagnosis: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">Symptoms Reported</label>
                <input
                  type="text"
                  placeholder="e.g. Sore throat, mild fever for 2 days"
                  value={opinionData.symptoms}
                  onChange={(e) => setOpinionData({ ...opinionData, symptoms: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">Prescription & Clinical Remarks</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Paracetamol 500mg BD, Warm water gargles twice daily"
                  value={opinionData.remarks}
                  onChange={(e) => setOpinionData({ ...opinionData, remarks: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => navigate('/doc-dashboard')}
                className="flex-1 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs uppercase tracking-wider transition-all"
              >
                Skip Summary
              </button>
              <button
                onClick={submitOpinion}
                className="flex-1 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
              >
                <UserCheck size={18} />
                <span>Save Medical Record</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceConsultation;
