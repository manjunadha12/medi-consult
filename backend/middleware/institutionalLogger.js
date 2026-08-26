import fs from 'fs';
import path from 'path';

const logFile = path.join(path.resolve(), 'security_audit.log');

export const institutionalLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logEntry = `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} | Status: ${res.statusCode} | IP: ${req.ip} | Time: ${duration}ms | Node: MediConsult-Institutional\n`;

    // Only log failures or sensitive paths for production performance
    if (res.statusCode >= 400 || req.originalUrl.includes('auth') || req.originalUrl.includes('admin')) {
        fs.appendFile(logFile, logEntry, (err) => {
          if (err) console.error('Failed to write to security log:', err);
        });
    }
  });

  next();
};
