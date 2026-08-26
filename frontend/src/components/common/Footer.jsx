import React from 'react';
import { Shield, ShieldCheck as ShieldCheckIcon, Cpu, Globe, Scale } from 'lucide-react';
import useStore from '../../store/useStore';

const Footer = () => {
  const { theme } = useStore();

  const isNative = typeof window !== 'undefined' && (
    window.location.origin.startsWith('capacitor:') ||
    (window.location.origin.includes('://localhost') && !window.location.port)
  );

  if (isNative) return null;

  return (
    <footer className={`mt-auto border-t py-16 px-6 sm:px-10 transition-all duration-700 relative overflow-hidden ${
      theme === 'dark'
        ? 'bg-[#09090B] border-white/5 text-zinc-500'
        : 'bg-white border-slate-200 text-slate-400'
    }`}>
      {/* Dynamic Color Transmission Background */}
      {theme === 'dark' && (
        <>
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 blur-[150px] rounded-full -translate-y-1/2 opacity-50"></div>
          <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-purple-600/10 blur-[150px] rounded-full -translate-y-1/2 opacity-50"></div>
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-blue-500/[0.03] to-transparent"></div>
        </>
      )}

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-16 relative z-10">

        {/* Brand & Mission */}
        <div className="md:col-span-2 space-y-6 text-left">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white shadow-[0_8px_30px_rgba(37,99,235,0.4)] transition-transform hover:scale-110 duration-500">
              <Cpu size={24} />
            </div>
            <h2 className={`text-2xl font-black uppercase tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Medi Consult <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-cyan-400">Ultra</span>
            </h2>
          </div>
          <p className={`text-xs font-bold leading-relaxed uppercase tracking-widest max-w-sm ${theme === 'dark' ? 'text-zinc-500' : 'text-slate-500'}`}>
            AI-Integrated Clinical Registry & Swarm Diagnostic Interface.
            Designed for decentralized medical synchronization and advanced patient telemetry.
          </p>
          <div className="flex items-center gap-4 pt-4 border-t border-white/5 w-fit">
             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500/80">HIPAA COMPLIANT NODE ACTIVE</span>
          </div>
        </div>

        {/* Legal & Licenses */}
        <div className="space-y-6 text-left">
           <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>Security Node</h3>
           <ul className="space-y-3">
              <li className="flex items-center gap-3 group cursor-pointer hover:text-blue-400 transition-colors">
                 <Scale size={14} />
                 <span className="text-[9px] font-black uppercase tracking-widest">End User License Agreement</span>
              </li>
              <li className="flex items-center gap-3 group cursor-pointer hover:text-blue-400 transition-colors">
                 <Shield size={14} />
                 <span className="text-[9px] font-black uppercase tracking-widest">Privacy Protocol 4.1</span>
              </li>
              <li className="flex items-center gap-3 group cursor-pointer hover:text-blue-400 transition-colors">
                 <Globe size={14} />
                 <span className="text-[9px] font-black uppercase tracking-widest">Global Medical Data Rights</span>
              </li>
           </ul>
        </div>

        {/* Node Information */}
        <div className="space-y-6 text-left">
           <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>System Metadata</h3>
           <div className="space-y-2 p-4 rounded-2xl bg-white/5 border border-white/5">
              <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest">
                 <span>Status</span>
                 <span className="text-emerald-500">Operational</span>
              </div>
              <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest">
                 <span>Build</span>
                 <span>v2.4.1-Stable</span>
              </div>
              <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest">
                 <span>Encryption</span>
                 <span>AES-256 GCM</span>
              </div>
           </div>
        </div>

      </div>

      {/* Copyright Line */}
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-[9px] font-black uppercase tracking-[0.4em]">
          © {new Date().getFullYear()} MEDI CONSULT GLOBAL REGISTRY. ALL RIGHTS RESERVED.
        </p>
        <div className="flex items-center gap-6">
           <span className="text-[8px] font-bold uppercase tracking-widest opacity-50 cursor-pointer hover:opacity-100 transition-opacity">Cloud Synchronization</span>
           <span className="text-[8px] font-bold uppercase tracking-widest opacity-50 cursor-pointer hover:opacity-100 transition-opacity">Neural Core Logs</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
