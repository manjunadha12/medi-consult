import axios from 'axios';
import { URL } from 'url';

const ALLOWED_HOSTS = [
  'api.openrouter.ai',
  'api.razorpay.com',
  'checkout.razorpay.com',
  'mediconsult-backend-w2sn.onrender.com'
];

export const safeFetch = async (config) => {
  const { url } = config;
  if (!url) throw new Error("Target node required");

  try {
    const targetUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
    const host = targetUrl.hostname.toLowerCase();

    if (!ALLOWED_HOSTS.includes(host)) {
      console.warn(`[SSRF_BLOCK] Unauthorized host node: ${host}`);
      throw new Error(`Access Denied: Neural node ${host} is not in the institutional allowlist.`);
    }

    return await axios(config);
  } catch (error) {
    throw new Error(`Neural Link Error: ${error.message}`);
  }
};
