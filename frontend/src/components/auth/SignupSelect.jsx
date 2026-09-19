import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User as UserIcon, Stethoscope, Sparkles, ShieldCheck as ShieldCheckIcon, Shield, Activity,
  Globe, Headphones, Plus, ChevronRight, Users, ArrowRight
} from 'lucide-react';
import logoImg from '../../logo.png';

const SignupSelect = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-[#000] font-sans overflow-x-hidden relative text-left">
      {/* 1. Outer Container */}

      {/* GLOBAL BACKGROUND */}
      <div className="absolute inset-0 z-0 overflow-hidden">
          <img src="/login-bg.png" alt="Hand Sync" className="w-full h-full object-cover opacity-50 scale-105" />
          <div className="absolute top-[40%] md:top-[50%] left-[50%] md:left-[55%] -translate-x-1/2 -translate-y-1/2 z-10">
             <div className="relative flex items-center justify-center">
                <div className="absolute w-20 h-20 bg-blue-500/40 rounded-full blur-2xl animate-pulse"></div>
                <div className="absolute w-40 h-40 bg-blue-600/10 rounded-full blur-3xl"></div>
                <Plus size={48} strokeWidth={4} className="text-blue-400 drop-shadow-[0_0_15px_rgba(96,165,250,0.8)]" />
             </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black md:bg-gradient-to-r md:from-black/60 md:to-transparent z-[15]"></div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row relative z-20">
         {/* 2. Main Wrapper */}

         {/* LEFT SECTION - Branding */}
         <div className="hidden md:flex flex-[1.3] p-12 lg:p-20 flex flex-col h-full w-full text-left">
             <div className="flex items-center gap-3 mb-16">
               <img src="/logo.png" onError={(e) => { e.currentTarget.src = '/logo.jpeg'; }} alt="Logo" className="w-12 h-12 object-contain" />
               <div className="text-left">
                  <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">MEDI <span className="text-blue-500 font-black">CONSULT</span></h2>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">Clinical Authentication Gateway</p>
               </div>
             </div>

             <div className="max-w-lg space-y-10">
               <div className="space-y-6">
                 <h1 className="text-5xl lg:text-7xl font-black text-white leading-[1.05] tracking-tighter uppercase">Initialize Your <span className="text-blue-500">Account</span>,<br /> Portal</h1>
                 <div className="w-24 h-1.5 bg-blue-600 rounded-[20px]"></div>
                 <p className="text-base font-bold text-zinc-400 max-w-sm leading-relaxed uppercase tracking-[0.15em]">Select your node interface to begin clinical synchronization.</p>
               </div>
             </div>

             <div className="mt-auto">
               <div className="inline-flex items-center gap-4 p-5 px-6 bg-white/5 backdrop-blur-xl rounded-[20px] border border-white/10">
                  <div className="w-10 h-10 rounded-[20px] border-2 border-blue-500 flex items-center justify-center text-blue-500"><Shield size={18} /></div>
                  <div className="text-left">
                     <p className="text-[11px] font-black text-blue-400 uppercase tracking-widest">HIPAA Compliant</p>
                     <p className="text-[10px] font-bold text-zinc-500 uppercase leading-none mt-1">Your privacy and security are our top priority.</p>
                  </div>
               </div>
             </div>
         </div>

         {/* RIGHT SECTION - Selection Card */}
         <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-14 relative z-30">
           {/* 3. Right Section Wrapper */}
           <div className="max-w-[520px] w-full bg-white/5 backdrop-blur-2xl p-8 lg:p-12 rounded-[20px] shadow-2xl border border-white/10 flex flex-col items-center">
              {/* 4. Selection Card */}

              <div className="mb-8 flex justify-center">
                 <img src="/logo.png" onError={(e) => { e.currentTarget.src = '/logo.jpeg'; }} alt="Medi Consult Logo" className="w-32 sm:w-36 h-auto object-contain" />
              </div>

              <div className="text-center mb-8">
                 <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">Register Account</h2>
                 <p className="text-[9px] sm:text-[10px] font-black text-zinc-500 mt-3 uppercase tracking-widest">Select your network node interface</p>
              </div>

              <div className="w-full space-y-6">
                 {/* Patient Account */}
                 <Link to="/register/patient" className="w-full flex items-center gap-5 p-6 bg-white/5 border border-white/10 rounded-[20px] hover:bg-white/10 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 transition-all group">
                    <div className="w-14 h-14 bg-blue-600/10 border border-blue-500/20 rounded-[20px] flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0">
                       <UserIcon size={24} />
                    </div>
                    <div className="text-left">
                       <h3 className="text-lg font-black text-white uppercase tracking-tight leading-none">Patient Account</h3>
                       <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-2 leading-relaxed">Consult specialists & Review reports</p>
                    </div>
                    <ChevronRight size={20} className="ml-auto text-zinc-600 group-hover:text-blue-500" />
                 </Link>

                 {/* Doctor Account */}
                 <Link to="/register/doctor" className="w-full flex items-center gap-5 p-6 bg-white/5 border border-white/10 rounded-[20px] hover:bg-white/10 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 transition-all group">
                    <div className="w-14 h-14 bg-blue-600/10 border border-blue-500/20 rounded-[20px] flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0">
                       <Stethoscope size={24} />
                    </div>
                    <div className="text-left">
                       <h3 className="text-lg font-black text-white uppercase tracking-tight leading-none">Doctor Account</h3>
                       <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-2 leading-relaxed">Coordinate care & Host video streams</p>
                    </div>
                    <ChevronRight size={20} className="ml-auto text-zinc-600 group-hover:text-blue-500" />
                 </Link>

                 <div className="relative my-8 flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                    <span className="relative px-3 bg-black/40 text-[9px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-widest whitespace-nowrap">Already have a node?</span>
                 </div>

                 <Link to="/" className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-[20px] font-black text-xs sm:text-sm uppercase tracking-[0.2em] shadow-xl shadow-blue-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-3">Sign In Terminal <ArrowRight size={18} /></Link>
              </div>
           </div>
           {/* Close 4. Selection Card */}
         </div>
         {/* Close 3. Right Section Wrapper */}
      </div>
      {/* Close 2. Main Wrapper */}

      {/* FOOTER STATS */}
      <div className="bg-zinc-950/50 backdrop-blur-xl border-t border-white/5 py-8 px-6 lg:px-20 z-30 relative text-left">
         <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
               { icon: ShieldCheckIcon, label: '256-bit', sub: 'Data Encryption', color: 'text-blue-500', bg: 'bg-blue-500/10' },
               { icon: Users, label: '10K+', sub: 'Happy Users', color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
               { icon: Globe, label: '500+', sub: 'Hospitals', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
               { icon: Headphones, label: '24/7', sub: 'Support', color: 'text-emerald-500', bg: 'bg-emerald-500/10' }
            ].map((s, i) => (
               <div key={i} className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center ${s.color} shrink-0 shadow-sm border border-white/5`}><s.icon size={20} /></div>
                  <div className="text-left"><p className="text-base font-black text-white leading-none">{s.label}</p><p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1.5">{s.sub}</p></div>
               </div>
            ))}
         </div>
      </div>

    </div>
    /* Close 1. Outer Container */
  );
};

export default SignupSelect;
