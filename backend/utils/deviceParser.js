/**
 * Lightweight parser for extracting device type, OS, and browser from User-Agent.
 */
export const parseUserAgent = (userAgent = '') => {
  let deviceType = 'Desktop';
  let os = 'Unknown OS';
  let browser = 'Unknown Browser';
  let deviceName = 'Personal Computer';

  const ua = userAgent || '';

  // 1. Device Type Detection
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) {
    deviceType = 'Tablet';
    deviceName = 'Tablet Device';
  } else if (/mobile|iphone|ipod|android/i.test(ua)) {
    deviceType = 'Mobile';
    deviceName = 'Smartphone';
  } else {
    deviceType = 'Desktop';
    deviceName = 'Desktop PC';
  }

  // 2. OS Detection
  if (/windows phone/i.test(ua)) {
    os = 'Windows Phone';
    deviceName = 'Windows Phone';
  } else if (/windows nt 10.0/i.test(ua)) {
    os = 'Windows 10 / 11';
    deviceName = 'Windows PC';
  } else if (/windows nt 6.3/i.test(ua)) {
    os = 'Windows 8.1';
    deviceName = 'Windows PC';
  } else if (/windows/i.test(ua)) {
    os = 'Windows';
    deviceName = 'Windows PC';
  } else if (/iphone/i.test(ua)) {
    os = 'iOS';
    deviceName = 'Apple iPhone';
  } else if (/ipad/i.test(ua)) {
    os = 'iPadOS';
    deviceName = 'Apple iPad';
  } else if (/macintosh|mac os x/i.test(ua)) {
    os = 'macOS';
    deviceName = 'Apple Mac';
  } else if (/android/i.test(ua)) {
    os = 'Android';
    deviceName = 'Android Device';
  } else if (/linux/i.test(ua)) {
    os = 'Linux';
    deviceName = 'Linux Workstation';
  }

  // 3. Browser Detection
  if (/edg\//i.test(ua)) {
    browser = 'Microsoft Edge';
  } else if (/chrome|crios/i.test(ua) && !/opr|opera/i.test(ua)) {
    browser = 'Google Chrome';
  } else if (/firefox|fxios/i.test(ua)) {
    browser = 'Mozilla Firefox';
  } else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) {
    browser = 'Apple Safari';
  } else if (/opr|opera/i.test(ua)) {
    browser = 'Opera';
  } else {
    browser = 'Web Browser';
  }

  return {
    deviceType,
    deviceName,
    os,
    browser,
    userAgent: ua
  };
};

/**
 * Extracts normalized IP address from Express request.
 */
export const getClientIp = (req) => {
  let ip = req.headers['x-forwarded-for'] || 
           req.socket?.remoteAddress || 
           req.connection?.remoteAddress || 
           req.ip || 
           '127.0.0.1';

  if (typeof ip === 'string' && ip.includes(',')) {
    ip = ip.split(',')[0].trim();
  }
  if (ip === '::1' || ip === '::ffff:127.0.0.1') {
    ip = '127.0.0.1 (Localhost)';
  }
  return ip;
};

