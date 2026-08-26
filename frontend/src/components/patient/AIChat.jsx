import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../common/Navbar';
import api from '../../utils/api';
import useStore from '../../store/useStore';
import { Home, Send, User as UserIcon, Loader2, Plus, Brain, Trash2, MessageSquare, Menu, X, Sparkles, Pill, Activity, ChevronRight, Settings, LogOut } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { fullMedicinesDataset } from '../../utils/medicinesData';

const AIChat = () => {
  const store = useStore();
  const user = store.user;
  const theme = store.theme;
  
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    const stored = localStorage.getItem(`mediconsult_chats_${user.userId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setConversations(parsed);
        if (parsed.length > 0) {
          setActiveChatId(parsed[0].id);
        }
      } catch (e) {
        console.error("Failed to parse conversations history", e);
      }
    } else {
      const defaultChat = {
        id: Date.now().toString(),
        title: 'Welcome Chat',
        messages: [{ role: 'bot', content: 'Neural link established. How can I assist you with your health today?' }],
        timestamp: new Date().toISOString()
      };
      setConversations([defaultChat]);
      setActiveChatId(defaultChat.id);
    }
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, activeChatId, loading]);

  const saveConversations = (updated) => {
    setConversations(updated);
    if (user) {
      localStorage.setItem(`mediconsult_chats_${user.userId}`, JSON.stringify(updated));
    }
  };

  const handleNewChat = () => {
    const newChat = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [{ role: 'bot', content: 'Neural link established. How can I assist you with your health today?' }],
      timestamp: new Date().toISOString()
    };
    const updated = [newChat, ...conversations];
    saveConversations(updated);
    setActiveChatId(newChat.id);
    setSidebarOpen(false);
  };

  const handleDeleteChat = (e, chatId) => {
    e.stopPropagation();
    const updated = conversations.filter(c => c.id !== chatId);
    saveConversations(updated);
    if (activeChatId === chatId) {
      setActiveChatId(updated.length > 0 ? updated[0].id : null);
    }
    toast.success("Conversation deleted");
  };

  const handleClearHistory = () => {
    if (window.confirm("Delete all conversations? This cannot be undone.")) {
      saveConversations([]);
      setActiveChatId(null);
      toast.success("History cleared");
    }
  };

  const handleSend = async (e, customText = null) => {
    if (e) e.preventDefault();
    const textToSend = customText || input;
    if (!textToSend.trim() || loading) return;

    let currentChatId = activeChatId;
    let updatedConversations = [...conversations];

    if (!currentChatId) {
      const newChat = {
        id: Date.now().toString(),
        title: textToSend.slice(0, 24) + (textToSend.length > 24 ? '...' : ''),
        messages: [],
        timestamp: new Date().toISOString()
      };
      updatedConversations = [newChat, ...updatedConversations];
      currentChatId = newChat.id;
      setActiveChatId(currentChatId);
    }

    let activeChat = updatedConversations.find(c => c.id === currentChatId);
    if (!activeChat) return;

    const userMsg = { role: 'user', content: textToSend };
    activeChat.messages = [...activeChat.messages, userMsg];

    const userMsgCount = activeChat.messages.filter(m => m.role === 'user').length;
    if (userMsgCount === 1) {
      activeChat.title = textToSend.slice(0, 24) + (textToSend.length > 24 ? '...' : '');
    }

    setInput('');
    saveConversations(updatedConversations);
    setLoading(true);

    // 1. SMART REGISTRY SCAN: Search local data first to avoid AI Node jitter
    const lowerInput = textToSend.toLowerCase();

    // Scan input for any medicine name or brand in the registry
    const localMedMatch = fullMedicinesDataset.find(m =>
      lowerInput.includes(m.name.toLowerCase()) ||
      m.brandNames.some(bn => lowerInput.includes(bn.toLowerCase()))
    );

    if (localMedMatch) {
      console.log("[SWARM_CORE] Registry Match Identified:", localMedMatch.name);
      setTimeout(() => {
        const botMsg = {
          role: 'bot',
          content: `### 🛡️ VERIFIED REGISTRY DATA FOUND\n\nI've synchronized with the institutional pharmacology registry for **${localMedMatch.name}**:\n\n` +
                   `--- \n` +
                   `#### CLINICAL PROFILE\n` +
                   `* **Category**: ${localMedMatch.category}\n` +
                   `* **Primary Use**: ${localMedMatch.usedFor}\n` +
                   `* **Mechanism**: ${localMedMatch.howItWorks}\n\n` +
                   `#### ADMINISTRATION\n` +
                   `* **Dosage**: ${localMedMatch.dosage}\n` +
                   `* **Storage**: ${localMedMatch.storage}\n\n` +
                   `#### SAFETY NODE\n` +
                   `* **Side Effects**: ${localMedMatch.sideEffects.join(', ')}\n` +
                   `* **Precautions**: ${localMedMatch.precautions.join(', ')}\n\n` +
                   `*Note: This data is retrieved from a validated clinical node. Would you like me to attempt an AI Synthesis for more speculative health advice?*`
        };

        const latestConversations = [...updatedConversations];
        const latestChat = latestConversations.find(c => c.id === currentChatId);
        if (latestChat) {
          latestChat.messages = [...latestChat.messages, botMsg];
          saveConversations(latestConversations);
        }
        setLoading(false);
      }, 600);
      return;
    }

    // 2. AI FALLBACK
    try {
      console.log("[SWARM_CORE] No local match. Requesting AI Synthesis...");
      const { data } = await api.post('/ai/chat', { message: textToSend });
      const botMsg = { role: 'bot', content: data.content };
      
      const latestConversations = [...updatedConversations];
      const latestChat = latestConversations.find(c => c.id === currentChatId);
      if (latestChat) {
        latestChat.messages = [...latestChat.messages, botMsg];
        saveConversations(latestConversations);
      }
    } catch (error) {
      toast.error("Swarm node timed out. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const activeChat = conversations.find(c => c.id === activeChatId);

  const STARTER_PROMPTS = [
    { text: "Suggest home remedies for a mild sore throat", desc: "Practical precautions & home tips", icon: Sparkles, color: 'text-purple-600', bg: 'bg-purple-50' },
    { text: "Interpret standard components of a blood report", desc: "Understand ranges and abbreviations", icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
    { text: "What are the common side effects of Paracetamol?", desc: "Pharmacology & safety information", icon: Pill, color: 'text-rose-600', bg: 'bg-rose-50' }
  ];

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

  const renderMessageContent = (content) => {
    if (!content) return null;

    let displayContent = content;
    try {
      const jsonStart = content.indexOf('{');
      const jsonEnd = content.lastIndexOf('}') + 1;
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        const rawJson = content.substring(jsonStart, jsonEnd);
        const parsed = JSON.parse(rawJson);
        displayContent = formatJsonToText(parsed);
      }
    } catch (e) {
      // Use original content if not JSON
    }

    const lines = displayContent.split('\n');
    return (
      <div className={`space-y-3 text-xs sm:text-sm leading-relaxed font-semibold ${theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'}`}>
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed && line !== "---") return null;

          if (line === "---") {
            return <div key={idx} className="border-t border-white/10 my-4" />;
          }

          if (trimmed.startsWith('####')) {
            return <h4 key={idx} className="text-sm font-black uppercase text-blue-500 mt-6 mb-2">{trimmed.replace(/#/g, '').trim()}</h4>;
          }

          // Remove bullet points from text before processing components
          const cleanLine = trimmed.replace(/^[*|-]\s*/, '');
          const parts = cleanLine.split(/\*\*(.*?)\*\*/g);
          const renderedLine = parts.map((part, i) => {
            if (i % 2 === 1) return <strong key={i} className={`font-black ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{part}</strong>;
            return part;
          });

          if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
            return (
              <div key={idx} className="flex gap-2 pl-4 text-left">
                <span className="text-blue-500 font-bold">•</span>
                <div className="flex-1">{renderedLine}</div>
              </div>
            );
          }

          return <p key={idx} className="text-left">{renderedLine}</p>;
        })}
      </div>
    );
  };

  return (
    <div className={`flex h-screen transition-colors duration-500 overflow-hidden text-left ${theme === 'dark' ? 'bg-[#050505] text-zinc-300' : 'bg-[#F8FAFC] text-slate-600'}`}>
      
      <div className={`fixed inset-y-0 left-0 z-50 w-72 border-r flex flex-col transform transition-transform duration-300 ease-out md:relative md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${theme === 'dark' ? 'bg-zinc-950 border-zinc-900' : 'bg-white border-slate-200'}`}>
        
        <div className={`p-6 border-b flex items-center justify-between ${theme === 'dark' ? 'border-zinc-900' : 'border-slate-100'}`}>
          <div className="flex items-center gap-3">
            <Brain className="text-blue-500 animate-pulse" size={24} />
            <span className={`font-black uppercase tracking-[0.2em] text-xs ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Swarm Core</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-zinc-900 rounded-xl md:hidden text-slate-400">
            <X size={18} />
          </button>
        </div>

        <div className="p-4">
          <button 
            onClick={handleNewChat}
            className="w-full py-4 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-[20px] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-blue-950/50 transition-all hover:scale-[1.02] active:scale-95"
          >
            <Plus size={16} strokeWidth={3} />
            New Session
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 custom-scrollbar">
          <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-2 mb-2">Recent Synchronizations</p>
          {conversations.length === 0 ? (
            <div className="text-center p-8 text-zinc-600 text-xs font-black uppercase tracking-wider">No history</div>
          ) : (
            conversations.map((c) => {
              const isActive = c.id === activeChatId;
              return (
                <div
                  key={c.id}
                  onClick={() => { setActiveChatId(c.id); setSidebarOpen(false); }}
                  className={`w-full p-4 rounded-2xl flex items-center justify-between gap-3 group cursor-pointer transition-all border ${isActive ? (theme === 'dark' ? 'bg-zinc-900/60 border-blue-500/20 text-white font-black' : 'bg-slate-50 border-blue-200 text-blue-700 font-black') : 'bg-transparent border-transparent hover:bg-zinc-900/30 text-zinc-400 hover:text-zinc-200'}`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <MessageSquare size={16} className={isActive ? 'text-blue-400' : 'text-zinc-500'} />
                    <span className="text-xs truncate uppercase tracking-tight">{c.title}</span>
                  </div>
                  <button 
                    onClick={(e) => handleDeleteChat(e, c.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-zinc-800 text-zinc-600 hover:text-red-500 rounded-lg transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className={`p-6 border-t space-y-4 ${theme === 'dark' ? 'border-zinc-900' : 'border-slate-100'}`}>
          <button 
            onClick={() => navigate('/patient/dashboard')}
            className={`w-full py-4 text-center rounded-[20px] font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 shadow-md ${theme === 'dark' ? 'bg-zinc-900/60 hover:bg-zinc-800 hover:text-white text-zinc-300 border border-zinc-800' : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'}`}
          >
            <Home size={14} className="text-blue-500" />
            Dashboard
          </button>
          <button 
            onClick={handleClearHistory}
            className="w-full py-4 text-center rounded-[20px] bg-transparent hover:text-red-400 font-black uppercase tracking-widest text-[9px] text-zinc-500 transition-all"
          >
            Clear All History
          </button>
        </div>
      </div>

      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
        ></div>
      )}

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Navbar />

        <div className={`p-4 border-b flex items-center gap-3 md:hidden shrink-0 ${theme === 'dark' ? 'bg-zinc-950 border-zinc-900' : 'bg-white border-slate-100'}`}>
          <button 
            onClick={() => setSidebarOpen(true)}
            className={`p-3 rounded-xl transition-all ${theme === 'dark' ? 'bg-zinc-900 text-zinc-400' : 'bg-slate-50 text-slate-600'}`}
          >
            <Menu size={18} />
          </button>
          <span className="font-black text-xs uppercase tracking-widest">
            {activeChat ? activeChat.title : 'AI Chat'}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-8 md:p-10 space-y-8 custom-scrollbar relative z-10">
          <div className="max-w-4xl mx-auto w-full space-y-8 pb-56">
            
            {activeChat && activeChat.messages.length > 0 ? (
              activeChat.messages.map((m, i) => {
                const isUser = m.role === 'user';
                return (
                  <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                    <div className={`flex gap-4 max-w-[85%] items-start ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                      
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                        isUser 
                          ? 'bg-blue-600 border-blue-500 text-white shadow-lg' 
                          : theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-blue-400' : 'bg-white border-slate-100 text-blue-600 shadow-sm'
                      }`}>
                        {isUser ? <UserIcon size={18} /> : <Brain size={18} className="animate-pulse" />}
                      </div>

                      <div className={`p-6 rounded-[28px] border shadow-sm ${
                        isUser 
                          ? 'bg-blue-600 border-blue-500 text-white rounded-tr-none' 
                          : theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-300 rounded-tl-none' : 'bg-white border-slate-100 text-slate-700 rounded-tl-none'
                      }`}>
                        {isUser ? (
                          <p className="text-xs sm:text-sm font-semibold leading-relaxed text-left">{m.content}</p>
                        ) : (
                          renderMessageContent(m.content)
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-16 text-center space-y-12 animate-in fade-in duration-700">
                <div className="space-y-4 text-center flex flex-col items-center">
                  <div className={`w-20 h-20 rounded-[32px] border flex items-center justify-center shadow-inner transition-all ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-blue-50 border-blue-100'}`}>
                    <Brain size={40} className="text-blue-600 animate-pulse" />
                  </div>
                  <h2 className={`text-3xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Swarm Consultation Node</h2>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest max-w-sm mx-auto leading-relaxed">
                    Ask questions, verify prescriptions, or interpret symptoms using the clinical neural net.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left max-w-3xl mx-auto">
                  {STARTER_PROMPTS.map((prompt, i) => (
                    <button 
                      key={i} 
                      onClick={() => handleSend(null, prompt.text)}
                      className={`p-6 border rounded-[32px] transition-all flex flex-col justify-between h-44 text-left group active:scale-95 shadow-sm ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 hover:border-blue-500/50' : 'bg-white border-slate-100 hover:border-blue-300 hover:shadow-xl'}`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${prompt.bg} ${prompt.color} transition-transform group-hover:scale-110`}>
                        <prompt.icon size={18} />
                      </div>
                      <div>
                        <p className={`text-[11px] font-black uppercase tracking-tight leading-snug mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{prompt.text}</p>
                        <p className="text-[9px] font-medium text-slate-400 uppercase tracking-tighter">{prompt.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {loading && (
              <div className="flex justify-start animate-pulse">
                <div className="flex gap-4 max-w-[85%] items-start">
                  <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center text-blue-600 shadow-sm ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-100'}`}>
                    <Loader2 size={18} className="animate-spin" />
                  </div>
                  <div className={`p-6 border rounded-[28px] rounded-tl-none flex items-center gap-3 ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-100'}`}>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Consulting Swarm...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className={`absolute bottom-0 left-0 right-0 pt-6 px-6 pb-8 z-50 shrink-0 bg-gradient-to-t ${theme === 'dark' ? 'from-[#050505] via-[#050505]/95' : 'from-[#F8FAFC] via-[#F8FAFC]/95'} to-transparent`}>
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSend} className={`border p-3 rounded-[32px] shadow-2xl flex items-center gap-4 transition-all ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 focus-within:border-blue-500/50' : 'bg-white border-slate-200/60 focus-within:border-blue-600/30'}`}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message Swarm AI..."
                className={`flex-1 px-5 py-4 outline-none font-bold text-xs sm:text-sm bg-transparent ${theme === 'dark' ? 'text-white placeholder-zinc-600' : 'text-slate-800 placeholder-slate-400'}`}
              />
              <button 
                type="submit" 
                disabled={!input.trim() || loading}
                className="w-12 h-12 bg-blue-600 hover:bg-blue-700 disabled:opacity-30 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95"
              >
                <Send size={18} />
              </button>
            </form>
            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest text-center mt-3">
              Swarm AI can make mistakes. Consider consulting a doctor for clinical diagnosis.
            </p>
          </div>
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 0px; }
      `}</style>
    </div>
  );
};

export default AIChat;
