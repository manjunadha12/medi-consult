import { URL } from 'url';

const BLOCKED_HOSTS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '169.254.169.254', // Metadata service
  'metadata.google.internal',
  'instance-data'
];

const BLOCKED_IP_RANGES = [
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[01])\./,
  /^192\.168\./
];

export const ssrfShield = (req, res, next) => {
  const checkUrl = (value) => {
    if (typeof value !== 'string') return;
    if (!value.startsWith('http')) return;

    try {
      const url = new URL(value);
      const host = url.hostname.toLowerCase();

      if (BLOCKED_HOSTS.includes(host)) {
        throw new Error(`SSRF Blocked: Prohibited Host ${host}`);
      }

      for (const range of BLOCKED_IP_RANGES) {
        if (range.test(host)) {
          throw new Error(`SSRF Blocked: Private IP Range Detected`);
        }
      }
    } catch (err) {
      return err.message;
    }
  };

  // Recursively check body for URLs
  const searchBody = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        const err = searchBody(obj[key]);
        if (err) return err;
      } else {
        const err = checkUrl(obj[key]);
        if (err) return err;
      }
    }
    return null;
  };

  const error = searchBody(req.body);
  if (error) {
    return res.status(403).json({ message: "Security Violation: External reference node rejected." });
  }

  next();
};
