export function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

export function arrayToBase64(uint8Array: Uint8Array): string {
  const binaryString = Array.from(uint8Array)
    .map((byte: number) => String.fromCharCode(byte))
    .join('');
  return window.btoa(binaryString);
}

async function saveToDB(data: any) {
  const request = indexedDB.open("SecureMessengerDB", 1);
  request.onupgradeneeded = (e: any) => e.target.result.createObjectStore("secure_store");
  return new Promise((resolve) => {
    request.onsuccess = (e: any) => {
      const db = e.target.result;
      const tx = db.transaction("secure_store", "readwrite");
      tx.objectStore("secure_store").put(data, "encrypted_bundle");
      resolve(true);
    };
  });
}

async function deriveMasterKey(password: string, salt: Uint8Array, serverSeed: Uint8Array) {
  const encoder = new TextEncoder();
  
  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const intermediateBits = await window.crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: 600000,
      hash: "SHA-256",
    },
    baseKey,
    256
  );

  const intermediateKey = await window.crypto.subtle.importKey(
    "raw",
    intermediateBits,
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const finalBits = await window.crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: serverSeed as BufferSource,
      iterations: 1000,
      hash: "SHA-256",
    },
    intermediateKey,
    256
  );

  return await window.crypto.subtle.importKey(
    "raw",
    finalBits,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

export { deriveMasterKey };

export async function generateAndLockKeysWithServer(password: string, serverSeed: Uint8Array) {
  const keyPair = await window.crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey"]
  );

  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const seedIv = window.crypto.getRandomValues(new Uint8Array(12));
  
  const masterKey = await deriveMasterKey(password, salt, serverSeed);

  const exportedPrivateKey = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
  
  const encryptedPrivateKey = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    masterKey,
    exportedPrivateKey
  );

  const encryptedServerSeed = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: seedIv },
    masterKey,
    serverSeed as BufferSource,
  );

  const exportedPublicKey = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);

  // 데이터 인코딩 후 전송
  const publicKeyB64 = arrayToBase64(new Uint8Array(exportedPublicKey));
  const encryptedPrivateKeyB64 = arrayToBase64(new Uint8Array(encryptedPrivateKey));
  const encryptedServerSeedB64 = arrayToBase64(new Uint8Array(encryptedServerSeed));
  const saltB64 = arrayToBase64(salt);
  const ivB64 = arrayToBase64(iv);
  const seedIvB64 = arrayToBase64(seedIv);

  const result = {
    publicKey: publicKeyB64,
    encryptedPrivateKey: encryptedPrivateKeyB64,
    encryptedServerSeed: encryptedServerSeedB64,
    salt: saltB64,
    iv: ivB64,
    seedIv: seedIvB64,
  };
  
  await saveToDB(result);
  return result;
}

export async function unlockPrivateKey(encryptedData: any, password: string, serverSeed: Uint8Array) {
  const saltB64 = encryptedData.salt;
  const salt = new Uint8Array(atob(saltB64).split("").map(c => c.charCodeAt(0)));

  const ivB64 = encryptedData.iv;
  const iv = new Uint8Array(atob(ivB64).split("").map(c => c.charCodeAt(0)));

  const encryptedPrivateKeyB64 = encryptedData.encryptedPrivateKey;
  const encryptedPrivateKey = new Uint8Array(atob(encryptedPrivateKeyB64).split("").map(c => c.charCodeAt(0)));

  const masterKey = await deriveMasterKey(password, salt, serverSeed);

  const decryptedRawKey = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv },
    masterKey,
    encryptedPrivateKey
  );

  const importedKey = await window.crypto.subtle.importKey(
    "pkcs8",
    decryptedRawKey,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey"]
  );
  return importedKey;
}