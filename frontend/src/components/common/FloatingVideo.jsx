import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Maximize2, Minimize2, X, User, ShieldCheck,
  Clock, Activity, MoreVertical, Camera, Mic, MicOff, VideoOff, PhoneOff
} from 'lucide-react';
import useStore from '../../store/useStore';

const FloatingVideo = ({
  remoteStream,
  isActive,
  onExpand,
  onClose,
  isMinimized,
  setIsMinimized,
  doctorName,
  specialization,
  timeLeft,
  formatTime
}) => {
  const { theme } = useStore();
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem('floating_video_pos');
    return saved ? JSON.parse(saved) : { x: window.innerWidth - 350, y: window.innerHeight - 250 };
  });

  const constraintsRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('floating_video_pos', JSON.stringify(position));
  }, [position]);

  const snapToCorner = (event, info) => {
    const { x, y } = info.point;
    const midX = window.innerWidth / 2;
    const midY = window.innerHeight / 2;

    let targetX = x < midX ? 24 : window.innerWidth - (isMinimized ? 104 : 344);
    let targetY = y < midY ? 24 : window.innerHeight - (isMinimized ? 104 : 220);

    setPosition({ x: targetX, y: targetY });
  };

  if (!isActive) return null;

  return (
    <motion.div
      drag
      dragMomentum={false}
      onDragEnd={snapToCorner}
      initial={position}
      animate={position}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{ position: 'fixed', zIndex: 1000 }}
      className="touch-none"
    >
      <AnimatePresence mode="wait">
        {isMinimized ? (
          /* MINIMIZED BUBBLE (80x80) */
          <motion.div
            key="minimized"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={() => setIsMinimized(false)}
            className="w-20 h-20 rounded-full bg-[#121214BF] backdrop-blur-2xl border border-white/10 shadow-2xl flex items-center justify-center cursor-pointer group"
          >
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-black">
                {doctorName?.charAt(0) || 'D'}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#121214] shadow-lg"></div>
              {/* Unread Badge Placeholder */}
              <div className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-red-500 text-white text-[8px] font-black rounded-full border-2 border-[#121214]">3</div>
            </div>
          </motion.div>
        ) : (
          /* ADVANCED FLOATING WINDOW */
          <motion.div
            key="expanded"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className={`w-[240px] sm:w-[320px] rounded-[24px] sm:rounded-[28px] overflow-hidden backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.45)] border border-white/10 flex flex-col ${theme === 'dark' ? 'bg-[#121214BF]' : 'bg-white/80 border-slate-200'}`}
          >
            {/* Header */}
            <div className="p-3 sm:p-4 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-[8px] sm:text-xs font-black">
                  {doctorName?.charAt(0)}
                </div>
                <div className="text-left overflow-hidden">
                   <p className="text-[8px] sm:text-[10px] font-black text-white uppercase leading-none truncate w-16 sm:w-24">{doctorName}</p>
                   <p className="text-[6px] sm:text-[8px] font-bold text-zinc-500 uppercase mt-0.5 truncate">{specialization}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5">
                <div className="px-1.5 py-0.5 bg-red-500/10 text-red-500 rounded-md text-[6px] sm:text-[7px] font-black tracking-tighter flex items-center gap-1 border border-red-500/20">
                   <div className="w-0.5 h-0.5 sm:w-1 sm:h-1 bg-red-500 rounded-full animate-pulse"></div> LIVE
                </div>
                <span className="text-[8px] sm:text-[10px] font-black text-zinc-400 font-mono tracking-tighter">{formatTime(timeLeft)}</span>
                <button onClick={() => setIsMinimized(true)} className="p-1 sm:p-1.5 hover:bg-white/5 rounded-lg text-zinc-500 transition-all"><Minimize2 size={12}/></button>
                <button onClick={onExpand} className="p-1 sm:p-1.5 hover:bg-white/5 rounded-lg text-zinc-500 transition-all"><Maximize2 size={12}/></button>
              </div>
            </div>

            {/* Video Body */}
            <div className="aspect-video bg-black relative group">
               {remoteStream ? (
                  <video
                    playsInline
                    autoPlay
                    ref={el => { if(el) el.srcObject = remoteStream }}
                    className="w-full h-full object-cover"
                  />
               ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2 sm:space-y-4">
                     <div className="w-10 h-10 sm:w-16 sm:h-16 bg-blue-600/10 border border-blue-500/20 rounded-full flex items-center justify-center relative">
                        <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping"></div>
                        <User size={20} className="sm:w-8 sm:h-8 text-blue-500 relative z-10" />
                     </div>
                     <div className="text-center">
                        <p className="text-[7px] sm:text-[9px] font-black text-zinc-400 uppercase tracking-widest animate-pulse">Connecting...</p>
                     </div>
                  </div>
               )}
            </div>

            {/* Controls Bar */}
            <div className="p-2 sm:p-3 bg-black/40 flex items-center justify-between px-4 sm:px-6">
               <button className="text-zinc-500 hover:text-white transition-all"><Mic size={14}/></button>
               <button className="text-zinc-500 hover:text-white transition-all"><Camera size={14}/></button>
               <button onClick={onClose} className="p-2 sm:p-2.5 bg-red-600 text-white rounded-xl shadow-lg shadow-red-600/20 active:scale-90 transition-all"><PhoneOff size={14}/></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default FloatingVideo;
