import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone as PhoneIcon, Video, PhoneOff, Zap, User, Bell } from 'lucide-react';
import { toast } from 'react-hot-toast';
import useStore from '../../store/useStore';
import api from '../../utils/api';
import { LocalNotifications } from '@capacitor/local-notifications';

const GlobalCallListener = () => {
  const { user, theme, socket, incomingCall, setIncomingCall, initializeGlobalSocket, registerUserSockets } = useStore();
  const navigate = useNavigate();
  const ringtoneRef = useRef(null);
  const [backendStatus, setBackendStatus] = useState('checking');

  useEffect(() => {
    if (user) {
      if (!socket) {
        initializeGlobalSocket();
      } else {
        registerUserSockets();
      }
    }
  }, [user, socket, window.location.pathname]);

  // Backend Heartbeat - Check if the server is actually reachable
  useEffect(() => {
    const checkBackend = async () => {
      try {
        await api.get('/', { timeout: 5000 });
        setBackendStatus('online');
      } catch (err) {
        // If it's a 401/403/etc, the server is still UP
        if (err.response) {
          setBackendStatus('online');
        } else {
          setBackendStatus('offline');
        }
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Request notification permissions and setup native channel
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    const initNativeNotifications = async () => {
      try {
        const status = await LocalNotifications.checkPermissions();
        if (status.display !== 'granted') {
          await LocalNotifications.requestPermissions();
        }

        await LocalNotifications.createChannel({
          id: 'incoming_calls_channel',
          name: 'Incoming Call Alerts',
          description: 'Heads-up notification alerts for incoming voice and video calls',
          importance: 5, // High/Max importance for heads-up banner on home screen
          visibility: 1, // Public lockscreen visibility
          vibration: true,
          sound: 'ringtone'
        });
      } catch (err) {
        console.warn("[NATIVE_NOTIF_INIT_ERR]", err);
      }
    };

    initNativeNotifications();

    // Setup ringtone sound
    ringtoneRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3');
    ringtoneRef.current.loop = true;

    return () => {
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (incomingCall) {
      const myIds = [
        user?.userId,
        user?._id,
        user?.id,
        user?.patientId,
        user?.doctorId,
        user?.adminId
      ].filter(Boolean).map(id => id.toString());

      if (incomingCall.from && myIds.includes(incomingCall.from.toString())) {
        console.log("[GLOBAL_CALL] Ignoring self call signal");
        setIncomingCall(null);
        return;
      }

      console.log("[GLOBAL_CALL] Incoming signal received:", incomingCall);

      // Play Ringtone
      if (ringtoneRef.current) {
        ringtoneRef.current.play().catch(e => console.warn("Autoplay blocked. Tap anywhere on screen to enable audio."));
      }

      // Vibrate mobile
      if (navigator.vibrate) navigator.vibrate([500, 200, 500, 200, 500]);

      // Show prominent visual toast alert
      toast.error(`INCOMING ${incomingCall.callType?.toUpperCase() || 'AUDIO'} CALL: ${incomingCall.name}`, {
        id: 'incoming-call-alert',
        duration: 12000,
        icon: '📞'
      });

      // Schedule Native Android Notification for Home Screen & Lock Screen
      try {
        LocalNotifications.schedule({
          notifications: [
            {
              title: `📞 Incoming ${incomingCall.callType?.toUpperCase() || 'VIDEO'} Call`,
              body: `${incomingCall.name} is calling you. Tap to join consultation.`,
              id: 99999,
              schedule: { at: new Date(Date.now() + 100) },
              channelId: 'incoming_calls_channel',
              extra: {
                incomingCallData: incomingCall
              }
            }
          ]
        }).catch(err => console.warn("[LOCAL_NOTIF_SCHEDULE_ERR]", err));
      } catch (err) {
        console.warn("[LOCAL_NOTIF_ERR]", err);
      }

      // Show system level notification safely
      if ("Notification" in window && Notification.permission === "granted") {
        try {
          new Notification(`Incoming ${incomingCall.callType} Call`, {
            body: `${incomingCall.name} is calling you.`,
            icon: '/logo.png'
          });
        } catch (nErr) {
          console.warn("[GLOBAL_CALL] System notification error:", nErr);
        }
      }

      // If on a consult page, only ignore if already inside the exact same active room
      if (window.location.pathname.includes('consult')) {
        const currentParams = new URLSearchParams(window.location.search);
        const currentRoom = currentParams.get('roomCode') || currentParams.get('appointmentId');
        if (currentRoom && currentRoom === incomingCall.conversationId) {
          console.log("[GLOBAL_CALL] Already in the exact same room. Ignoring duplicate ringing ping.");
          setIncomingCall(null);
          stopRinging();
          toast.dismiss('incoming-call-alert');
        }
      }
    } else {
      stopRinging();
      toast.dismiss('incoming-call-alert');
    }
  }, [incomingCall]);

  const stopRinging = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
    try {
      LocalNotifications.cancel({ notifications: [{ id: 99999 }] }).catch(() => {});
    } catch (err) {}
  };

  useEffect(() => {
    let listener = null;
    try {
      LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
        console.log("[NATIVE_NOTIF] User tapped native call notification:", notification);
        const data = notification.notification?.extra?.incomingCallData;
        if (data) {
          stopRinging();
          const { conversationId, callType, from, name, signal, fromSocketId } = data;
          if (signal) {
            sessionStorage.setItem('pending_signal', JSON.stringify({ signal, fromSocketId }));
          }
          setIncomingCall(null);
          const isPatient = user?.role === 'patient';
          const path = callType === 'video'
            ? (isPatient ? '/patient/video-consult' : '/doctor/video-consult')
            : (isPatient ? '/patient/voice-consult' : '/doctor/voice-consult');
          navigate(`${path}?roomCode=${conversationId}&peerName=${name}&peerId=${from}&incoming=true`);
        }
      }).then(res => { listener = res; });
    } catch (err) {}

    return () => {
      if (listener && listener.remove) {
        listener.remove();
      }
    };
  }, [user]);

  const handleAcceptCall = () => {
    if (!incomingCall) return;
    stopRinging();
    const { conversationId, callType, from, name, signal, fromSocketId } = incomingCall;

    if (signal) {
       sessionStorage.setItem('pending_signal', JSON.stringify({ signal, fromSocketId }));
    }

    setIncomingCall(null);
    const isPatient = user.role === 'patient';
    const path = callType === 'video'
      ? (isPatient ? '/patient/video-consult' : '/doctor/video-consult')
      : (isPatient ? '/patient/voice-consult' : '/doctor/voice-consult');

    navigate(`${path}?roomCode=${conversationId}&peerName=${name}&peerId=${from}&incoming=true`);
  };

  const handleDeclineCall = async () => {
    if (!incomingCall || !socket) return;
    stopRinging();
    socket.emit('decline-call', { to: incomingCall.from });

    try {
        await api.post('/chat/log-call', {
            conversationId: incomingCall.conversationId,
            receiverId: incomingCall.from,
            callType: incomingCall.callType,
            status: 'declined'
        });
    } catch (err) {
        console.error("Failed to log declined call", err);
    }

    setIncomingCall(null);
    toast.error("Call Declined");
  };

  return (
    <>
      <AnimatePresence>
        {incomingCall && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
              className="w-full max-w-sm pointer-events-auto shadow-[0_60px_120px_-20px_rgba(0,0,0,0.8)]"
            >
              <div className={`p-10 rounded-[56px] border backdrop-blur-3xl flex flex-col items-center gap-10 ${theme === 'dark' ? 'bg-[#0A0A0A]/95 border-blue-500/20 shadow-blue-900/10' : 'bg-white/95 border-blue-100 shadow-slate-200/50'}`}>
                <div className="relative">
                  <div className={`absolute inset-0 bg-blue-600/30 blur-[100px] rounded-full animate-pulse`}></div>
                  <div className={`w-32 h-32 rounded-[48px] bg-blue-600/10 border-2 border-blue-500/20 flex items-center justify-center relative z-10 shadow-2xl overflow-hidden`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent"></div>
                    <User size={64} className="text-blue-500 relative z-10" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-emerald-500 rounded-full border-4 border-[#0A0A0A] flex items-center justify-center shadow-lg animate-bounce z-20">
                     <Bell size={20} className="text-white" />
                  </div>
                </div>

                <div className="text-center space-y-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.5em] mb-2 animate-pulse">Establishing Node Sync</p>
                    <h3 className={`text-3xl font-black uppercase tracking-tighter leading-none ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                      {incomingCall.name}
                    </h3>
                    <p className="text-zinc-500 font-bold uppercase text-[9px] tracking-[0.3em] mt-3">Incoming {incomingCall.callType} call...</p>
                  </div>
                </div>

                <div className="flex flex-col gap-4 w-full">
                  <button
                    onClick={handleAcceptCall}
                    className="w-full bg-blue-600 text-white py-6 rounded-[32px] font-black uppercase text-xs tracking-[0.4em] shadow-[0_20px_50px_rgba(37,99,235,0.4)] hover:bg-blue-500 transition-all flex items-center justify-center gap-4 active:scale-95 group"
                  >
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                       <PhoneIcon size={18} strokeWidth={3} />
                    </div>
                    Accept Link
                  </button>
                  <button
                    onClick={handleDeclineCall}
                    className={`w-full py-5 rounded-[28px] font-black uppercase text-[10px] tracking-[0.2em] transition-all border ${theme === 'dark' ? 'bg-white/5 border-white/10 text-zinc-500 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20' : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-red-50'}`}
                  >
                    Decline Handshake
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-6 right-6 z-[10000] cursor-pointer group"
           onClick={() => {
             if (socket && !socket.connected) {
               toast.loading("Re-establishing Neural Link...", { id: 'manual-reconnect' });
               socket.connect();
             } else if (!socket) {
               initializeGlobalSocket();
             } else {
               toast.success("Link is Synchronized");
             }
           }}
      >
         <div className={`w-3.5 h-3.5 rounded-full shadow-2xl transition-all duration-500 relative z-10 ${socket?.connected && backendStatus === 'online' ? 'bg-emerald-500 shadow-[0_0_15px_#10b981] scale-110' : 'bg-red-500 animate-pulse scale-100 shadow-[0_0_15px_#ef4444]'}`}></div>
         <div className="absolute bottom-full right-0 mb-4 px-4 py-2 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all pointer-events-none translate-y-2 group-hover:translate-y-0 shadow-2xl">
            {socket?.connected && backendStatus === 'online' ? 'LINK SYNCHRONIZED' : 'LINK OFFLINE - TAP TO RE-SYNC'}
         </div>
      </div>
    </>
  );
};

export default GlobalCallListener;
