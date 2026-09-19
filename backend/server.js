import express from 'express'; // Node Trigger: 00:15 - Health Progress Engine Active
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import connectDB from './config/db.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createHttpServer } from 'http';
import { createServer as createHttpsServer } from 'https';
import fs from 'fs';
import { Server } from 'socket.io';

import authRoutes from './routes/auth.js';
import aiRoutes from './routes/ai.js';
import reportRoutes from './routes/reports.js';
import doctorRoutes from './routes/doctors.js';
import adminRoutes from './routes/admin.js';
import patientRoutes from './routes/patients.js';
import medicineRoutes from './routes/medicines.js';
import healthRoutes from './routes/healthRoutes.js';
import appointmentRoutes from './routes/appointments.js';
import referralRoutes from './routes/referrals.js';
import chatRoutes from './routes/chat.js';
import diagnosisRoutes from './routes/diagnosis.js';
import offlineAppointmentRoutes from './routes/offlineAppointments.js';
import { standardLimiter } from './middleware/rateLimit.js';
import { ssrfShield } from './middleware/ssrfShield.js';
import { institutionalLogger } from './middleware/institutionalLogger.js';

// MediConsult Node Initialization

dotenv.config();
connectDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.disable('x-powered-by'); // Security hardening
app.use(helmet()); // Basic security headers
app.use(helmet.hidePoweredBy());
app.use(helmet.noSniff());
app.use(helmet.xssFilter());
app.use(helmet.referrerPolicy({ policy: 'strict-origin-when-cross-origin' }));

let httpServer;
const sslPath = {
  key: path.join(__dirname, 'key.pem'),
  cert: path.join(__dirname, 'cert.pem')
};

if (fs.existsSync(sslPath.key) && fs.existsSync(sslPath.cert)) {
  try {
    const options = {
      key: fs.readFileSync(sslPath.key),
      cert: fs.readFileSync(sslPath.cert),
      minVersion: 'TLSv1.2' // Hardening against ERR_SSL_VERSION_OR_CIPHER_MISMATCH
    };
    httpServer = createHttpsServer(options, app);
    console.log('[CORE] Secure HTTPS Handshake Protocol Active (TLS 1.2+)');
  } catch (sslErr) {
    console.error(`[CORE] SSL Initialization Failed: ${sslErr.message}. Falling back to HTTP.`);
    httpServer = createHttpServer(app);
  }
} else {
  httpServer = createHttpServer(app);
  console.warn('[CORE] Running on Insecure HTTP Node. Camera/Mic might be blocked on mobile.');
}

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const allowedOrigins = [
  'http://localhost:5173',
  'https://localhost:5173',
  'http://127.0.0.1:5173',
  'https://127.0.0.1:5173',
  'http://192.168.1.6:5173',
  'https://192.168.1.6:5173',
  'http://192.168.1.6:5001',
  'http://192.168.1.6:5000',
  'http://10.241.68.15:5173',
  'https://10.241.68.15:5173',
  'http://10.241.68.15:5001',
  'http://10.241.68.15:5000',
  'http://10.84.153.15:5173',
  'https://10.84.153.15:5173',
  'http://10.80.61.15:5173',
  'https://10.80.61.15:5173',
  'http://192.168.1.17:5173',
  'https://192.168.1.17:5173',
  'http://localhost',
  'https://localhost',
  'capacitor://localhost',
  'https://127.0.0.1'
];

app.use(cors({
  origin: function (origin, callback) {
    // 1. Allow mobile apps & requests without origin header (Postman, native webview)
    if (!origin || origin === 'null' || origin === 'localhost' || origin.startsWith('capacitor://') || origin.startsWith('http://localhost') || origin.startsWith('https://localhost')) {
      return callback(null, true);
    }

    // 2. Allow known IP-based origins (both HTTP and HTTPS)
    const isLocalIP = origin.startsWith('http://10.') || origin.startsWith('https://10.') ||
                      origin.startsWith('http://172.') || origin.startsWith('https://172.') ||
                      origin.startsWith('http://192.168.') || origin.startsWith('https://192.168.') ||
                      origin.startsWith('http://127.0.0.1') || origin.startsWith('https://127.0.0.1');

    if (allowedOrigins.indexOf(origin) !== -1 || isLocalIP) {
      callback(null, true);
    } else {
      console.warn(`[CORS_BLOCK] Origin unauthorized: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(mongoSanitize()); // Prevent NoSQL Injection
app.use(institutionalLogger); // Audit logging for compliance
app.use(ssrfShield); // Prevent Server-Side Request Forgery
app.use('/api', standardLimiter);

// Heartbeat for Mobile
app.get('/api', (req, res) => res.json({ status: 'online', message: 'MediConsult API Node' }));
app.get('/api/', (req, res) => res.json({ status: 'online', message: 'MediConsult API Node' }));

// Institutional Security Configuration (Helmet)
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "https://checkout.razorpay.com"],
    connectSrc: ["'self'", "https://api.openrouter.ai", "https://api.razorpay.com"],
    imgSrc: ["'self'", "data:", "https://images.unsplash.com", "https://*.razorpay.com"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    frameSrc: ["'self'", "https://api.razorpay.com"]
  }
}));

// Log ALL requests
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url} from ${req.ip}`);
  next();
});

app.use('/uploads', cors(), express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

// Root Route
app.get('/', (req, res) => {
  res.json({
    message: "MediConsult Neural Backend Operational",
    status: "online",
    protocol: httpServer instanceof createHttpsServer ? "https" : "http",
    port: PORT
  });
});

// Routes
app.use('/api/patients', patientRoutes);
app.use('/api/clinical-diagnosis', diagnosisRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/offline-appointments', offlineAppointmentRoutes);
app.use('/api/chat', chatRoutes);

// Catch-all 404
app.use('/api/*', (req, res) => {
  console.warn(`[404_DETECTED] Unmatched API request: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: `API Endpoint ${req.originalUrl} not found on this node.` });
});

// Socket.IO Logic
io.on("connection", (socket) => {
  console.log(`[SOCKET] Handshake Initialized: ${socket.id}`);

  socket.on("register-user", (userId) => {
    socket.userId = String(userId);
    socket.join(String(userId));
    console.log(`[SOCKET] User registered in personal room: ${userId}`);
  });

  socket.on("join-room", ({ roomCode, userId, userName }) => {
    socket.userId = String(userId);
    socket.userName = userName;
    socket.currentRoom = String(roomCode);

    // 1. Get raw sockets in the room before joining
    const rawSockets = Array.from(io.sockets.adapter.rooms.get(String(roomCode)) || []);

    // 2. Filter out dead/disconnected or duplicate sockets for the same user
    const activeExistingSockets = [];
    rawSockets.forEach(sId => {
      if (sId === socket.id) return;
      const s = io.sockets.sockets.get(sId);
      if (s && s.connected) {
        // If this existing socket belongs to the exact same userId, remove the stale socket from room
        if (s.userId && socket.userId && s.userId === socket.userId) {
          console.log(`[ROOM_SYNC] Removing older duplicate socket ${sId} for user ${userId} from room ${roomCode}`);
          s.leave(String(roomCode));
        } else {
          activeExistingSockets.push(s);
        }
      }
    });

    socket.join(String(roomCode));
    console.log(`[ROOM_SYNC] ${userName} (${userId}, socket: ${socket.id}) joined room: ${roomCode}. Active peers:`, activeExistingSockets.map(s => s.id));

    // Notify other users already in the room about this new user
    socket.to(String(roomCode)).emit("user-joined", { 
      userId, 
      userName, 
      socketId: socket.id 
    });

    // Notify this newly joined user ONLY about currently active/connected peers
    activeExistingSockets.forEach((peerSocket) => {
      console.log(`[ROOM_SYNC] Informing new joiner ${socket.id} about active existing peer ${peerSocket.id} (${peerSocket.userName || 'Peer'})`);
      socket.emit("user-joined", { 
        userId: peerSocket.userId || null, 
        userName: peerSocket.userName || "Peer", 
        socketId: peerSocket.id 
      });
    });
  });

  socket.on("chat-message", (data) => {
    const { receiverId } = data;
    io.to(receiverId).emit("new-chat-message", data);
  });

  socket.on("typing", ({ conversationId, senderId, receiverId, isTyping }) => {
    io.to(receiverId).emit("user-typing", { conversationId, senderId, isTyping });
  });

  socket.on("message-read", ({ conversationId, senderId, receiverId }) => {
    io.to(receiverId).emit("messages-seen", { conversationId, senderId });
  });

  socket.on("call-user", ({ userToCall, signalData, from, name, conversationId, callType, isP2P }) => {
    console.log(`[CALL_SIGNAL] ${name || from} (${socket.id}) calling user/room: ${userToCall} (${callType || 'video'}, signal: ${signalData ? 'offer' : 'ping'})`);
    io.to(String(userToCall)).emit("call-made", {
      signal: signalData,
      from,
      fromSocketId: socket.id,
      name,
      conversationId,
      callType,
      isP2P
    });
  });

  socket.on("make-answer", ({ to, signal }) => {
    console.log(`[CALL_SIGNAL] Socket ${socket.id} answering call to ${to}`);
    io.to(String(to)).emit("call-accepted", { signal, fromSocketId: socket.id });
  });

  socket.on("ice-candidate", ({ to, candidate }) => {
    io.to(String(to)).emit("ice-candidate", { candidate, fromSocketId: socket.id });
  });

  socket.on("decline-call", ({ to, roomCode }) => {
    console.log(`[CALL_SIGNAL] Socket ${socket.id} declined call to ${to} / room ${roomCode}`);
    if (to) io.to(String(to)).emit("call-declined");
    if (roomCode) io.to(String(roomCode)).emit("call-declined");
  });

  socket.on("end-call", ({ to, roomCode, conversationId }) => {
    if (to) io.to(String(to)).emit("peer-ended-call");
    const room = roomCode || conversationId;
    if (room) {
      io.to(String(room)).emit("peer-ended-call");
      socket.leave(String(room));
    }
  });

  socket.on("leave-room", ({ roomCode }) => {
    const room = roomCode || socket.currentRoom;
    if (room) {
      console.log(`[ROOM_SYNC] Socket ${socket.id} explicitly left room ${room}`);
      socket.leave(String(room));
      socket.to(String(room)).emit("user-left", { socketId: socket.id, userId: socket.userId });
      socket.currentRoom = null;
    }
  });

  socket.on("disconnect", (reason) => {
    console.log(`[SOCKET] User disconnected: ${socket.id} (reason: ${reason})`);
    if (socket.currentRoom) {
      socket.to(String(socket.currentRoom)).emit("user-left", { socketId: socket.id, userId: socket.userId });
    }
  });
});

app.use((err, req, res, next) => {
  console.error(`[CRITICAL_FAIL] ${err.message}`);
  res.status(err.status || 500).json({
    message: "Internal Neural Node Failure",
    status: "error"
  });
});

const PORT = process.env.PORT || 5000;
const HTTP_PORT = 5001;

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`[CORE] Secure Node: https://0.0.0.0:${PORT}`);
});

const devApp = express();
devApp.use(cors());
devApp.use(express.json());
devApp.use('/', app);

const devServer = createHttpServer(devApp);
io.attach(devServer);

devServer.listen(HTTP_PORT, '0.0.0.0', () => {
  console.log(`[CORE] Dev Node: http://0.0.0.0:${HTTP_PORT}`);
});
