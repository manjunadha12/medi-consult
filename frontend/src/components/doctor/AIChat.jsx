import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../common/Navbar';
import {
  Send, Brain, User as UserIcon, Sparkles, Shield,
  MessageSquare, History as HistoryIcon, Trash2, Plus,
  ChevronRight, Search as SearchIcon, Zap, Loader2, Bot, Info, Maximize2
} from 'lucide-react';
import useStore from '../../store/useStore';
import api from '../../utils/api';
import { toast } from 'react-hot-toast';
import { useLocation } from 'react-router-dom';

const DoctorAIChat = () => {
  const { user, theme } = useStore();
  const location = useLocation();
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Dr. " + (user?.name?.split(' ')[0] || 'Specialist') + ", Medi AI Swarm initialized. I am ready to assist with differential diagnosis, clinical research, or biometric analysis.", time: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (location.state?.initialMsg) {
      setInput(location.state.initialMsg);
      // Automatically send if needed, or just pre-fill
    }
  }, [location.state]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    { id: 1, title: 'PAT1005: Lipid Analysis', date: '2 hours ago' },
    { id: 2, title: 'CABG Recovery Protocol', date: 'Yesterday' },
    { id: 3, title: 'Neural Swarm Research', date: '2 days ago' }
  ]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user', content: input, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await api.post('/ai/chat', { message: input });
      setMessages(prev => [...prev, { role: 'assistant', content: data.content, time: new Date() }]);
    } catch (err) {
      toast.error("AI Node Timeout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-500 ${theme === 'dark' ? 'bg-[#050505] text-zinc-300' : 'bg-[#F8FAFC] text-slate-600'}`}>

      {/* SIDEBAR: HISTORY */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 border-r flex flex-col transform transition-transform duration-300 ease-out md:relative md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${theme === 'dark' ? 'bg-zinc-950 border-zinc-900' : 'bg-white border-slate-200'}`}>
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                 <Brain size={18} />
              </div>
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em]">Swarm Archive</h2>
           </div>
           <button onClick={() => setSidebarOpen(false)} className="md:hidden p-2 hover:bg-white/5 rounded-xl"><Plus className="rotate-45" size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
           <button className="w-full p-4 rounded-2xl border-2 border-dashed border-blue-500/20 text-blue-500 font-black text-[9px] uppercase tracking-widest hover:bg-blue-500/5 transition-all mb-6 flex items-center justify-center gap-2">
              <Plus size={14} /> Initialize New Node
           </button>

           {chatHistory.map(chat => (
              <div key={chat.id} className={`p-4 rounded-2xl border transition-all cursor-pointer group ${theme === 'dark' ? 'bg-white/5 border-white/5 hover:border-blue-500/30' : 'bg-slate-50 border-slate-100 hover:bg-white'}`}>
                 <p className="text-[10px] font-black uppercase tracking-tight truncate">{chat.title}</p>
                 <p className="text-[8px] font-bold text-zinc-500 uppercase mt-1">{chat.date}</p>
              </div>
           ))}
        </div>

        <div className="p-4 border-t border-white/5">
           <div className={`p-4 rounded-2xl border flex items-center gap-4 ${theme === 'dark' ? 'bg-zinc-900 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                 <Shield size={20} />
              </div>
              <div>
                 <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Medical Compliance</p>
                 <p className="text-[9px] font-bold text-zinc-500 uppercase">HIPAA/HiTRUST SYNC</p>
              </div>
           </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col relative">
        <Navbar />

        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 custom-scrollbar pb-32">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-4 md:gap-6 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-lg ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white border-blue-400/20'
                  : 'bg-zinc-900 border-white/5 text-purple-500'
              }`}>
                {m.role === 'user' ? <UserIcon size={20} /> : <Bot size={24} />}
              </div>
              <div className={`max-w-[85%] md:max-w-[70%] space-y-2 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">
                  {m.role === 'user' ? 'OPERATOR: ' + user?.name : 'AI SWARM NODE'} ● {m.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <div className={`p-5 md:p-6 rounded-[32px] text-xs md:text-sm font-bold leading-relaxed shadow-sm border transition-all ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white border-blue-500 rounded-tr-none'
                    : (theme === 'dark' ? 'bg-zinc-950 border-white/5 text-zinc-300 rounded-tl-none' : 'bg-white border-slate-200 text-slate-700 rounded-tl-none')
                }`}>
                  {m.content}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-6 animate-pulse">
               <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center text-purple-500"><Loader2 className="animate-spin" /></div>
               <div className="space-y-3">
                  <div className="h-3 w-32 bg-white/5 rounded-full"></div>
                  <div className="h-10 w-64 bg-white/5 rounded-[20px]"></div>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT AREA */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-4xl px-6 z-50">
           <div className={`p-2 rounded-[32px] border shadow-2xl backdrop-blur-3xl transition-all duration-500 ${theme === 'dark' ? 'bg-zinc-950/80 border-white/10' : 'bg-white/90 border-slate-200 shadow-slate-200/50'}`}>
              <form onSubmit={handleSend} className="flex items-center gap-3">
                 <button type="button" onClick={() => setSidebarOpen(true)} className="md:hidden p-4 text-zinc-500"><HistoryIcon size={20}/></button>
                 <div className="flex-1 relative">
                    <input
                       type="text"
                       value={input}
                       onChange={(e) => setInput(e.target.value)}
                       placeholder="DESCRIBE BIOMETRIC ANOMALY OR REQUEST RESEARCH..."
                       className={`w-full bg-transparent border-none outline-none py-4 px-4 text-[10px] sm:text-xs font-black uppercase tracking-widest placeholder:opacity-50 ${theme === 'dark' ? 'text-white' : 'text-slate-700'}`}
                    />
                 </div>
                 <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="w-14 h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-[24px] flex items-center justify-center shadow-xl shadow-blue-500/30 transition-all active:scale-90 disabled:opacity-50"
                 >
                    <Send size={20} />
                 </button>
              </form>
           </div>
        </div>

      </div>
    </div>
  );
};

export default DoctorAIChat;
