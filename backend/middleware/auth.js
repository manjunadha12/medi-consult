import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log(`[AUTH_NODE] Token decoded for ID: ${decoded.id}`);

      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        console.warn(`[AUTH_NODE] User not found in registry for ID: ${decoded.id}`);
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }
      if (req.user.isActive === false) {
        console.warn(`[AUTH_NODE] Blocked user attempted API access: ${decoded.id}`);
        return res.status(403).json({ message: 'Access Denied: This account node has been blocked by the hospital administrator.' });
      }

      // Session Verification
      if (decoded.sessionId) {
        const sessionExists = (req.user.activeSessions || []).some(s => s.sessionId === decoded.sessionId);
        if (req.user.activeSessions && req.user.activeSessions.length > 0 && !sessionExists) {
          console.warn(`[AUTH_NODE] Session revoked or expired for User: ${req.user.email} (Session: ${decoded.sessionId})`);
          return res.status(401).json({ 
            message: 'Session has been logged out from this device.',
            sessionTerminated: true 
          });
        }

        // Throttle updating lastActive (once every 3 minutes)
        const currentSession = (req.user.activeSessions || []).find(s => s.sessionId === decoded.sessionId);
        if (currentSession && (Date.now() - new Date(currentSession.lastActive).getTime() > 3 * 60 * 1000)) {
          currentSession.lastActive = new Date();
          req.user.save().catch(err => console.error('[AUTH_SESSION_UPDATE_FAIL]', err.message));
        }

        req.sessionId = decoded.sessionId;
      } else {
        req.sessionId = 'legacy-session';
      }

      return next();
    } catch (error) {
      console.error(`[AUTH_NODE] JWT Verification Failed: ${error.message}`);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};
