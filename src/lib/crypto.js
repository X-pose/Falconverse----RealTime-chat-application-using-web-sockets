class KeyPairManager {
  constructor() {
    if (KeyPairManager.instance) {
      return KeyPairManager.instance;
    }
    this.keyPair = null;

    KeyPairManager.instance = this;
  }

  async getKeyPair() {
    if (!this.keyPair) {
      this.keyPair = await crypto.subtle.generateKey(
        {
          name: "RSA-OAEP",
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: "SHA-256",
        },
        true,
        ["encrypt", "decrypt"]
      );
    }
    return this.keyPair;
  }

  clearKeyPair() {
    this.keyPair = null;
  }
}

const keyPairManager = new KeyPairManager();

export async function generateKeyPair() {
  return await keyPairManager.getKeyPair();
}


export async function encryptMessage(publicKey, message) {
  const encodedMessage = new TextEncoder().encode(message);
  const encrypted = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    publicKey,
    encodedMessage
  );
  return Array.from(new Uint8Array(encrypted));
}

export async function decryptMessage(privateKey, encryptedMessage) {
  const encryptedBuffer = new Uint8Array(encryptedMessage).buffer;
  const decrypted = await crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    encryptedBuffer
  );
  return new TextDecoder().decode(decrypted);
}

export async function exportPublicKey(publicKey) {
  const exported = await crypto.subtle.exportKey("spki", publicKey);
  return Array.from(new Uint8Array(exported));
}

export async function importPublicKey(exportedKey) {
  const keyBuffer = new Uint8Array(exportedKey).buffer;
  return await crypto.subtle.importKey(
    "spki",
    keyBuffer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"]
  );
}

// Add new utility functions
export function clearExistingKeyPair() {
  keyPairManager.clearKeyPair();
}

export function hasExistingKeyPair() {
  return !!keyPairManager.keyPair;
}