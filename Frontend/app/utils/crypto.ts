import CryptoJS from 'crypto-js';

export const encryptMessage = (text: string, secretKey: string) => {
  return CryptoJS.AES.encrypt(text, secretKey).toString();
};

export const decryptMessage = (cipherText: string, secretKey: string) => {
  const bytes = CryptoJS.AES.decrypt(cipherText, secretKey);
  return bytes.toString(CryptoJS.enc.Utf8);
};