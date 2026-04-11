import CryptoJS from 'crypto-js';

export const generateHmacHeaders = (payload: any, secret: string) => {
  const timestamp = Date.now().toString();
  const bodyString = payload ? JSON.stringify(payload) : '{}';
  
  const message = `${timestamp}:${bodyString}`;
  
  const signature = CryptoJS.HmacSHA256(message, secret).toString(CryptoJS.enc.Hex);

  return {
    'x-hmac-signature': signature,
    'x-hmac-timestamp': timestamp,
  };
};