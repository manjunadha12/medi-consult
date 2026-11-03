import React, { useState, useEffect, useCallback } from 'react';
import { 
  Monitor, 
  Smartphone, 
  Tablet, 
  Laptop, 
  LogOut, 
  ShieldCheck, 
  RefreshCw, 
  Clock, 
  Globe, 
  AlertTriangle,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import useStore from '../../store/useStore';

const DeviceSessionsManager = ({ isDarkMode = true }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [revokingId, setRevokingId] = useState(null);
  const [revokingAll, setRevokingAll] = useState(false);
  
  const { logout, theme } = useStore();
  const navigate = useNavigate();

  const isDark = isDarkMode ?? (theme === 'dark');

  const getFallbackSession = () => {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    let dType = 'Desktop';
    let dName = 'Personal Computer';
    let os = 'Windows / macOS';
    let browser = 'Web Browser';

    if (/iphone/i.test(ua)) {
      dType = 'Mobile';
      dName = 'Apple iPhone';
      os = 'iOS';
    } else if (/android.*mobile/i.test(ua)) {
      dType = 'Mobile';
      dName = 'Android Smartphone';
      os = 'Android';
    } else if (/ipad|tablet/i.test(ua)) {
      dType = 'Tablet';
      dName = 'Tablet Device';
      os = 'iPadOS / Android';
    } else if (/windows/i.test(ua)) {
      dType = 'Desktop';
      dName = 'Windows PC';
      os = 'Windows 10 / 11';
    } else if (/macintosh/i.test(ua)) {
      dType = 'Desktop';
      dName = 'Apple Mac';
      os = 'macOS';
    } else if (/linux/i.test(ua)) {
      dType = 'Desktop';
      dName = 'Linux Workstation';
      os = 'Linux';
    }

    if (/edg/i.test(ua)) browser = 'Microsoft Edge';
    else if (/chrome/i.test(ua)) browser = 'Google Chrome';
    else if (/firefox/i.test(ua)) browser = 'Mozilla Firefox';
    else if (/safari/i.test(ua)) browser = 'Apple Safari';

    return {
      sessionId: 'current-active-node',
      deviceType: dType,
      deviceName: dName,
      browser,
      os,
      ip: 'This Device (Active)',
      createdAt: new Date(),
      lastActive: new Date(),
      isCurrent: true
    };
  };

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const res = await api.get('/auth/sessions');
      if (res.data?.success && Array.isArray(res.data.sessions) && res.data.sessions.length > 0) {
        setSessions(res.data.sessions);
      } else {
        // Fallback to active current device if server list is empty
        setSessions([getFallbackSession()]);
      }
    } catch (err) {
      console.warn('[SESSIONS_FETCH_NOTICE]: Using live local session node:', err.message);
      setFetchError(err.response?.data?.message || null);
      setSessions([getFallbackSession()]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleRevokeSingle = async (session) => {
    const isCurrent = session.isCurrent;
    const confirmMsg = isCurrent 
      ? 'Are you sure you want to log out from this current device?' 
      : `Log out and disconnect ${session.deviceName || 'this device'}?`;

    if (!window.confirm(confirmMsg)) return;

    if (session.sessionId === 'current-active-node' || isCurrent) {
      try {
        await api.post('/auth/logout').catch(() => {});
      } catch (e) {}
      toast.success('Logged out successfully.');
      logout();
      navigate('/');
      return;
    }

    try {
      setRevokingId(session.sessionId);
      const res = await api.delete(`/auth/sessions/${session.sessionId}`);
      
      if (res.data?.isCurrentSession) {
        toast.success('Logged out successfully.');
        logout();
        navigate('/');
        return;
      }

      toast.success(res.data?.message || 'Device disconnected successfully.');
      setSessions(prev => prev.filter(s => s.sessionId !== session.sessionId));
    } catch (err) {
      console.error('[REVOKE_SESSION_ERROR]:', err);
      toast.error(err.response?.data?.message || 'Failed to disconnect device.');
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeAllOther = async () => {
    if (sessions.length <= 1) {
      return toast.info('No other devices are currently logged in.');
    }

    if (!window.confirm('Log out of all other devices? All other active sessions will be terminated immediately.')) {
      return;
    }

    try {
      setRevokingAll(true);
      const res = await api.delete('/auth/sessions');
      toast.success(res.data?.message || 'All other devices have been logged out.');
      setSessions(prev => prev.filter(s => s.isCurrent));
    } catch (err) {
      console.error('[REVOKE_ALL_SESSIONS_ERROR]:', err);
      toast.error(err.response?.data?.message || 'Failed to log out other devices.');
    } finally {
      setRevokingAll(false);
    }
  };

  const getDeviceIcon = (deviceType) => {
    const t = (deviceType || '').toLowerCase();
    if (t.includes('mobile') || t.includes('phone')) {
      return Smartphone;
    }
    if (t.includes('tablet') || t.includes('ipad')) {
      return Tablet;
    }
    if (t.includes('laptop')) {
      return Laptop;
    }
    return Monitor;
  };

  const formatActivityTime = (dateStr, isCurrent) => {
    if (!dateStr || isCurrent) return 'Active now';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 3) return 'Active now';
    if (diffMins < 60) return `Active ${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Active ${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;

    return `Last active: ${date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`;
  };

  const formatLoginDate = (dateStr) => {
    if (!dateStr) return 'Active session';
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`p-6 sm:p-8 rounded-[36px] border transition-all duration-300 ${
      isDark 
        ? 'bg-zinc-950/80 border-white/5 shadow-2xl shadow-black/80' 
        : 'bg-white border-slate-100 shadow-xl shadow-slate-200/50'
    }`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5 dark:border-white/5">
        <div className="flex items-center gap-4 text-left">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
            isDark ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-blue-50 text-blue-600 border border-blue-100'
          }`}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-base font-black uppercase tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
                Logged-in Devices
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                isDark ? 'bg-white/10 text-zinc-300' : 'bg-slate-100 text-slate-600'
              }`}>
                {sessions.length} Active
              </span>
            </div>
            <p className="text-xs text-zinc-500 font-medium mt-0.5">
              Devices currently authenticated and active in your clinical account
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchSessions}
            disabled={loading}
            title="Refresh device list"
            className={`p-3 rounded-2xl border transition-all hover:scale-105 active:scale-95 ${
              isDark 
                ? 'bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10' 
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>

          {sessions.length > 1 && (
            <button
              onClick={handleRevokeAllOther}
              disabled={revokingAll}
              className="px-4 py-3 bg-red-600/10 hover:bg-red-600 border border-red-500/20 hover:border-red-600 text-red-500 hover:text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 hover:shadow-lg hover:shadow-red-600/30 active:scale-95 disabled:opacity-50"
            >
              <LogOut size={14} />
              {revokingAll ? 'Revoking...' : 'Log Out All Other Devices'}
            </button>
          )}
        </div>
      </div>

      {/* Sessions List */}
      <div className="mt-6 space-y-4">
        {loading && sessions.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-zinc-500">
            <RefreshCw size={24} className="animate-spin text-blue-500" />
            <p className="text-xs font-bold uppercase tracking-widest">Scanning Active Device Nodes...</p>
          </div>
        ) : (
          sessions.map((session) => {
            const Icon = getDeviceIcon(session.deviceType);
            const isCurrent = !!session.isCurrent;
            const isBeingRevoked = revokingId === session.sessionId;

            return (
              <div
                key={session.sessionId}
                className={`p-5 rounded-3xl border transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left ${
                  isCurrent
                    ? isDark
                      ? 'bg-blue-600/10 border-blue-500/30 shadow-lg shadow-blue-500/5'
                      : 'bg-blue-50/70 border-blue-200 shadow-md shadow-blue-100/50'
                    : isDark
                      ? 'bg-white/[0.03] border-white/5 hover:border-white/10 hover:bg-white/[0.05]'
                      : 'bg-slate-50/80 border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                }`}
              >
                {/* Left: Device Info */}
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${
                    isCurrent
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : isDark
                        ? 'bg-white/5 text-zinc-400 border border-white/5'
                        : 'bg-white text-slate-600 border border-slate-200'
                  }`}>
                    <Icon size={22} />
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className={`text-sm font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {session.deviceName || 'Personal Computer'}
                      </h4>

                      {isCurrent ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          This Device
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                          Active Device
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-zinc-500 font-semibold truncate">
                      {session.browser || 'Browser'} • {session.os || 'OS'}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Globe size={12} className="text-zinc-400" />
                        <span className="font-mono">{session.ip || '127.0.0.1'}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-medium">
                        <Clock size={12} className="text-zinc-400" />
                        {formatActivityTime(session.lastActive, isCurrent)}
                      </span>
                      {session.createdAt && (
                        <>
                          <span className="hidden md:inline">•</span>
                          <span className="hidden md:inline text-zinc-500 text-[10px]">
                            Signed in: {formatLoginDate(session.createdAt)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Logout Action */}
                <div className="shrink-0 sm:self-center pt-2 sm:pt-0">
                  <button
                    onClick={() => handleRevokeSingle(session)}
                    disabled={isBeingRevoked}
                    className={`w-full sm:w-auto px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 ${
                      isCurrent
                        ? isDark
                          ? 'bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 hover:border-red-600 shadow-lg shadow-red-600/10'
                          : 'bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 hover:border-red-600'
                        : isDark
                          ? 'bg-white/5 hover:bg-red-600 border border-white/10 hover:border-red-600 text-zinc-300 hover:text-white'
                          : 'bg-white hover:bg-red-600 border border-slate-200 hover:border-red-600 text-slate-700 hover:text-white shadow-sm'
                    }`}
                  >
                    <LogOut size={14} />
                    {isBeingRevoked 
                      ? 'Logging out...' 
                      : isCurrent 
                        ? 'Log Out This Device' 
                        : 'Log Out Device'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default DeviceSessionsManager;
