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
