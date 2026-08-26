import { create } from 'zustand';
import { io } from 'socket.io-client';
import { toast } from 'react-hot-toast';
import { BACKEND_URL } from '../utils/api';
import { auth } from '../utils/firebase';

const getInitialUser = () => {
  try {
    const user = localStorage.getItem('user');
    if (!user || user === 'undefined') return null;
    const parsed = JSON.parse(user);
    if (!parsed || parsed.name === 'undefined' || !parsed.name) return null;
    return parsed;
  } catch (err) {
    return null;
  }
};

const getInitialTheme = () => {
  try {
    const theme = localStorage.getItem('theme');
    return theme ? theme : 'dark';
  } catch (err) {
    return 'dark';
  }
};

const initialNotifications = [
  { id: '1', title: 'ANALYSIS READY', text: 'AI swarm is ready to analyze your archived lab reports.', time: '2m ago', type: 'info' },
  { id: '2', title: 'MEDICATION REMINDER', text: 'Dose scheduled: Take 1x Paracetamol in 30 minutes.', time: '30m ago', type: 'reminder' },
  { id: '3', title: 'REGISTRY SYNC', text: 'Patient profile synchronized with Central Medical Node.', time: '1h ago', type: 'sync' },
];

const getInitialNotifications = () => {
  try {
    const stored = localStorage.getItem('notifications');
    if (stored !== null) return JSON.parse(stored);
    return initialNotifications;
  } catch (err) {
    return initialNotifications;
  }
};

const getInitialSettings = () => {
  try {
    const preference = localStorage.getItem('navigationType') || 'dock';
    const sidebarExpanded = localStorage.getItem('sidebarExpanded') !== 'false';
    const uiDensity = localStorage.getItem('uiDensity') || 'Comfortable';
    return {
      showNavbar: true,
      showNeuralDock: preference === 'dock',
      showSidebar: preference === 'sidebar',
      sidebarExpanded: false, // Default to hidden
      navigationType: preference,
      uiDensity: uiDensity
    };
  } catch (err) {
    return { showNavbar: true, showNeuralDock: true, showSidebar: false, sidebarExpanded: false, navigationType: 'dock', uiDensity: 'Comfortable' };
  }
};

const useStore = create((set, get) => ({
  user: getInitialUser(),
  theme: getInitialTheme(),
  notifications: getInitialNotifications(),
  ...getInitialSettings(),
  incomingCall: null,
  socket: null,

  setIncomingCall: (call) => set({ incomingCall: call }),

  registerUserSockets: () => {
    const { socket, user } = get();
    if (!socket || !user) return;
    const ids = [
      user?.userId,
      user?._id,
      user?.id,
      user?.patientId,
      user?.doctorId,
      user?.adminId,
      user?.email
    ].filter(Boolean).map(id => id.toString());
    const uniqueIds = [...new Set(ids)];
    console.log(`[STORE_SOCKET] Active. Registering nodes:`, uniqueIds);
    uniqueIds.forEach(id => {
      socket.emit('register-user', id);
    });
  },

  initializeGlobalSocket: () => {
    const { socket, user } = get();
    if (socket || !user) {
      if (socket && user) get().registerUserSockets();
      return;
    }

    console.log(`[STORE_SOCKET] Initializing neural link on origin: ${BACKEND_URL || 'Auto'}`);

    // Config for robust mobile connection
    const socketOptions = {
      transports: ['websocket', 'polling'], // Prefer websocket for speed
      reconnectionAttempts: 20,
      reconnectionDelay: 3000,
      withCredentials: true,
      forceNew: true,
      timeout: 10000
    };

    const newSocket = io(BACKEND_URL || undefined, socketOptions);

    newSocket.on('connect', () => {
      console.log("[STORE_SOCKET] Neural Link Active:", newSocket.id);
      get().registerUserSockets();
      if (user?.role === 'patient') {
        toast.success("Neural Link Synchronized", { id: 'socket-sync' });
      }
    });

    newSocket.on('connect_error', (err) => {
      console.error("[STORE_SOCKET] Connection Failure:", err.message);

      // DIAGNOSTIC TOAST
      toast.error(`Neural Link Sync Error: ${err.message}`, { id: 'socket-error' });

      // If we are on mobile (using IP) and it fails, it's likely a network/IP issue
      if (BACKEND_URL && BACKEND_URL.includes('192.168')) {
          console.warn("[STORE_SOCKET] Mobile Node Sync Error. Ensure phone is on same WiFi as PC and IP matches.");
      }

      // Fallback to Dev Node (Port 5001) if Port 5000 is blocked by SSL
      if (newSocket.io.uri.includes(':5000')) {
        const fallbackURL = newSocket.io.uri.replace(':5000', ':5001').replace('https', 'http');
        console.log(`[STORE_SOCKET] SSL Block detected. Falling back to Dev Node: ${fallbackURL}`);
        newSocket.io.uri = fallbackURL;
        newSocket.connect();
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.warn("[STORE_SOCKET] Node Disconnected:", reason);
      if (reason === "io server disconnect") {
        newSocket.connect();
      }
    });

    newSocket.on('call-made', (data) => {
      const currentUser = get().user;
      const myIds = [
        currentUser?.userId,
        currentUser?._id,
        currentUser?.id,
        currentUser?.patientId,
        currentUser?.doctorId,
        currentUser?.adminId
      ].filter(Boolean).map(id => id.toString());

      if (data?.from && myIds.includes(data.from.toString())) {
        console.log("[STORE_SOCKET] Suppressing self-emitted call-made event");
        return;
      }

      console.log("[STORE_SOCKET] Incoming handshake received. Target ID:", currentUser?.userId, "Data:", data);
      set({ incomingCall: { ...data, timestamp: Date.now() } }); // Force new object ref
    });

    newSocket.on('call-declined', () => {
      set({ incomingCall: null });
    });

    set({ socket: newSocket });
  },

  setSocket: (socket) => set({ socket }),

  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    set({ theme });
  },

  setNavigationType: (type) => {
    localStorage.setItem('navigationType', type);
    set({
      navigationType: type,
      showNeuralDock: type === 'dock',
      showSidebar: type === 'sidebar'
    });
  },

  setSidebarExpanded: (expanded) => {
    localStorage.setItem('sidebarExpanded', expanded);
    set({ sidebarExpanded: expanded });
  },

  setShowNavbar: (show) => {
    localStorage.setItem('showNavbar', show);
    set({ showNavbar: show });
  },

  setShowNeuralDock: (show) => {
    localStorage.setItem('showNeuralDock', show);
    set({ showNeuralDock: show });
  },

  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
    if (user) {
      const { socket } = get();
      if (!socket) {
        get().initializeGlobalSocket();
      } else {
        get().registerUserSockets();
      }
    }
  },

  setNotifications: (notifications) => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
    set({ notifications });
  },

  clearNotification: (id) => {
    set((state) => {
      const updated = state.notifications.filter(n => n.id !== id);
      localStorage.setItem('notifications', JSON.stringify(updated));
      return { notifications: updated };
    });
  },

  clearAllNotifications: () => {
    localStorage.setItem('notifications', JSON.stringify([]));
    set({ notifications: [] });
  },

  logout: async () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
    }

    try {
      await auth.signOut();
    } catch (err) {
      console.warn("[STORE_LOGOUT] Firebase signout failed:", err);
    }

    localStorage.removeItem('mediconsult_token');
    localStorage.removeItem('user');
    set({ user: null, socket: null });
  },
}));

export default useStore;
