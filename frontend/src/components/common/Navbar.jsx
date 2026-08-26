import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, Search as SearchIcon, MoreVertical, Settings, LogOut, ShieldAlert, Sparkles, Pill, CheckCircle, Trash2, X, Loader2, User as UserIcon, ChevronRight, Menu, Star } from 'lucide-react';
import useStore from '../../store/useStore';
import { toast } from 'react-hot-toast';
import logoImg from '../../logo.png';
import api, { BACKEND_URL } from '../../utils/api';
import { fullMedicinesDataset } from '../../utils/medicinesData';

const Navbar = () => {
  const { user, theme, notifications, logout, clearNotification, clearAllNotifications, showNeuralDock, showSidebar, sidebarExpanded, setSidebarExpanded } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const menuRef = useRef(null);
  const notificationsRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 2 && user) {
        setIsSearching(true);
        try {
          if (user.role === 'doctor' || user.role === 'admin') {
            const endpoint = user.role === 'doctor' ? '/doctor/search-patient' : '/admin/patients';
            const { data } = await api.get(`${endpoint}?q=${searchQuery}`);
            const results = Array.isArray(data) ? data.filter(p =>
              p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              p.patientId.toLowerCase().includes(searchQuery.toLowerCase())
            ) : [];
            setSearchResults(results.slice(0, 5));
          } else if (user.role === 'patient') {
            // 1. Search Local Registry first
            const normalizedQuery = searchQuery.toLowerCase();
            const localResults = fullMedicinesDataset.filter(m =>
              m.name.toLowerCase().includes(normalizedQuery) ||
              m.genericName.toLowerCase().includes(normalizedQuery) ||
              m.brandNames.some(bn => bn.toLowerCase().includes(normalizedQuery))
            ).map(m => ({
               name: m.name,
               patientId: m.brandNames[0],
               isMedicine: true
            }));

            // 2. Combine with API suggestions (AI node)
            try {
              const { data } = await api.get(`/ai/medicine-suggestions?query=${searchQuery}`);
              const apiResults = Array.isArray(data) ? data.map(m => ({
                 name: m.name,
                 patientId: m.brandName,
                 isMedicine: true
              })) : [];

              // Deduplicate
              const combined = [...localResults];
              apiResults.forEach(apiRes => {
                if (!combined.find(s => s.name.toLowerCase() === apiRes.name.toLowerCase())) {
                  combined.push(apiRes);
                }
              });

              setSearchResults(combined.slice(0, 5));
            } catch (apiErr) {
              setSearchResults(localResults.slice(0, 5));
            }
          }
        } catch (err) {
          console.error(err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchResults([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success("Node Deactivated: Securely Logged Out");
  };

  const getProfilePath = () => {
    if (user?.role === 'doctor') return '/doctor/profile';
    if (user?.role === 'patient') return '/patient/profile';
    return '#';
  };

  const getNotificationStyles = (type) => {
    switch (type) {
      case 'info':
        return { Icon: Sparkles, color: 'text-blue-400' };
      case 'reminder':
        return { Icon: Pill, color: 'text-orange-400' };
      case 'sync':
      default:
        return { Icon: CheckCircle, color: 'text-emerald-400' };
    }
  };

  return (
    <nav className={`h-16 sm:h-20 backdrop-blur-3xl border-b px-4 sm:px-8 flex items-center justify-between sticky top-0 z-[100] transition-all duration-500 ${
      theme === 'dark'
        ? 'bg-zinc-950/90 border-white/10'
        : 'bg-white/90 border-slate-200 shadow-sm'
    }`}>

      <div className="flex items-center gap-4 shrink-0 mr-2 sm:mr-6">
        {showSidebar && (
           <button
             onClick={() => setSidebarExpanded(!sidebarExpanded)}
             className={`p-2.5 rounded-xl border transition-all ${
               theme === 'dark' ? 'bg-white/5 border-white/5 text-zinc-400' : 'bg-slate-50 border-slate-200 text-slate-500'
             }`}
           >
             <Menu size={20} />
           </button>
        )}
        <div className="cursor-pointer" onClick={() => navigate('/')}>
          <img
            src={logoImg}
            alt="Medi"
            className="h-7 sm:h-10 w-auto object-contain transition-all duration-300"
          />
        </div>
      </div>

      <div className="hidden sm:block flex-1 max-w-xl relative group" ref={searchRef}>
        <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all duration-300 ${
          theme === 'dark'
            ? 'bg-white/5 border-white/5 focus-within:border-blue-500/30'
            : 'bg-slate-100 border-slate-200 focus-within:border-blue-500/50'
        }`}>
          {isSearching ? <Loader2 className="w-5 h-5 text-blue-500 animate-spin" /> : <SearchIcon className={`w-5 h-5 ${theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'}`} />}
          <input
            type="text"
            placeholder="Search Registry..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`bg-transparent border-none outline-none text-sm font-medium w-full ${
              theme === 'dark' ? 'text-zinc-100 placeholder-zinc-500' : 'text-slate-800 placeholder-slate-400'
            }`}
          />
        </div>

        {searchResults.length > 0 && (
          <div className={`absolute top-full left-0 right-0 mt-3 rounded-[24px] border shadow-2xl overflow-hidden z-[1000] animate-in fade-in slide-in-from-top-2 duration-200 ${
            theme === 'dark' ? 'bg-zinc-900 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="p-2">
              {searchResults.map((p) => (
                <button
                  key={p.patientId + p.name}
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    if (p.isMedicine) {
                       navigate(`/patient/medicine-search?q=${p.name}`);
                    } else {
                       navigate(user?.role === 'doctor' ? `/doctor/patient/${p.patientId}` : `/admin/patients?search=${p.patientId}`);
                    }
                  }}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all ${
                    theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    theme === 'dark' ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-50 text-blue-600'
                  }`}>
                    {p.isMedicine ? <Pill size={18} /> : <UserIcon size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black uppercase truncate">{p.name}</p>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{p.patientId}</p>
                  </div>
                  <ChevronRight size={14} className="text-zinc-600" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

        <div className="hidden lg:flex items-center gap-6 mx-8">
        </div>

        <div className="flex items-center gap-3 sm:gap-6 shrink-0 relative">
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowMenu(false);
            }}
            className={`relative p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl transition-all group border ${
              theme === 'dark'
                ? 'bg-white/5 border-white/5 text-zinc-400 hover:text-white'
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-white'
            }`}
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            {notifications && notifications.length > 0 && (
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
            )}
          </button>

          {showNotifications && (
            <div className={`absolute right-0 mt-3 w-80 rounded-[24px] border shadow-2xl p-4 z-[1000] animate-in fade-in slide-in-from-top-2 duration-200 ${theme === 'dark' ? 'bg-zinc-900 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
              <div className="flex justify-between items-center pb-3 border-b border-white/5 mb-3 text-left">
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">System Notifications</span>
              </div>
              <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-3 pr-1">
                {notifications && notifications.length > 0 ? (
                  notifications.map((n) => {
                    const { Icon, color } = getNotificationStyles(n.type);
                    return (
                      <div key={n.id} className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-start gap-3 relative group/item">
                        <div className={`w-8 h-8 rounded-lg bg-white/5 ${color} flex items-center justify-center shrink-0`}><Icon size={16} /></div>
                        <div className="flex-1 text-left min-w-0">
                          <p className={`text-[8px] font-black uppercase tracking-widest ${color} mb-0.5`}>{n.title}</p>
                          <p className={`text-[10px] font-bold leading-snug break-words ${theme === 'dark' ? 'text-zinc-400' : 'text-slate-600'}`}>{n.text}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-8 text-center text-zinc-650 text-[10px] font-black uppercase tracking-widest">No active alerts</div>
                )}
              </div>
            </div>
          )}
        </div>

        <div
          className={`flex items-center gap-2 sm:gap-4 pl-3 sm:pl-6 border-l cursor-pointer group ${
            theme === 'dark' ? 'border-white/5' : 'border-slate-200'
          }`}
          onClick={() => {
            const path = getProfilePath();
            if (path !== '#') navigate(path);
          }}
        >
          <div className="text-right hidden md:block">
            <p className={`text-xs font-black uppercase group-hover:text-blue-400 transition-colors ${theme === 'dark' ? 'text-zinc-100' : 'text-slate-800'}`}>
              {user?.name || 'USER'}
            </p>
          </div>
          <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-black text-xs overflow-hidden ${!user?.profilePicture ? 'bg-gradient-to-tr from-blue-600 to-indigo-600' : ''}`}>
            {user?.profilePicture ? (
              <img src={`${BACKEND_URL}${user.profilePicture}`} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user?.name?.charAt(0) || 'U'
            )}
          </div>
        </div>

        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => {
              setShowMenu(!showMenu);
              setShowNotifications(false);
            }}
            className={`p-3 rounded-2xl border transition-all ${
              theme === 'dark'
                ? 'bg-white/5 border-white/5 text-zinc-400 hover:text-white'
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-white'
            }`}
          >
            <MoreVertical size={18} />
          </button>

          {showMenu && (
            <div className={`absolute right-0 mt-3 w-64 rounded-[24px] border shadow-2xl p-2 z-[1000] animate-in fade-in slide-in-from-top-2 duration-200 ${theme === 'dark' ? 'bg-zinc-900 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>

              {user?.role === 'patient' && (
                <button
                  onClick={() => { navigate('/patient/review'); setShowMenu(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-xs font-black uppercase tracking-wider transition-all ${theme === 'dark' ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-slate-50 text-slate-600'}`}
                >
                  <Star size={14} className="text-amber-500" /> Review Specialist
                </button>
              )}

              <button
                onClick={() => {
                  const settingsPath = user?.role === 'doctor' ? '/doctor/settings' : user?.role === 'admin' ? '/admin/system-settings' : '/settings';
                  navigate(settingsPath);
                  setShowMenu(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-xs font-black uppercase tracking-wider transition-all ${theme === 'dark' ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-slate-50 text-slate-600'}`}
              >
                <Settings size={14} className="text-zinc-500" /> Settings
              </button>

              <button
                onClick={() => { handleLogout(); setShowMenu(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-xs font-black uppercase tracking-wider transition-all text-red-400 hover:bg-red-500/10"
              >
                <LogOut size={14} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
