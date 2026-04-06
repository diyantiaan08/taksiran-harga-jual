const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const bytesToBase64Url = (bytes: Uint8Array) => {
  const binary = String.fromCharCode(...bytes);
  const b64 = btoa(binary);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const base64UrlToBytes = (b64url: string) => {
  const padded = b64url.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((b64url.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

const deriveKey = async (secret: string) => {
  const secretBytes = textEncoder.encode(secret);
  const hash = await crypto.subtle.digest("SHA-256", secretBytes);
  return crypto.subtle.importKey("raw", hash, "AES-GCM", false, ["encrypt", "decrypt"]);
};

export const encryptQrPayload = async (payload: Record<string, unknown>, secret: string) => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(secret);
  const plaintext = textEncoder.encode(JSON.stringify(payload));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
  const cipherBytes = new Uint8Array(ciphertext);
  const combined = new Uint8Array(iv.length + cipherBytes.length);
  combined.set(iv, 0);
  combined.set(cipherBytes, iv.length);
  return bytesToBase64Url(combined);
};

export const decryptQrPayload = async (token: string, secret: string) => {
  const bytes = base64UrlToBytes(token);
  if (bytes.length < 13) throw new Error("QR token tidak valid");
  const iv = bytes.slice(0, 12);
  const data = bytes.slice(12);
  const key = await deriveKey(secret);
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
  const json = textDecoder.decode(new Uint8Array(plaintext));
  return JSON.parse(json) as Record<string, unknown>;
};
