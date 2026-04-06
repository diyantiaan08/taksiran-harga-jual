#!/usr/bin/env node
const { webcrypto } = require("crypto");

const textEncoder = new TextEncoder();

const bytesToBase64Url = (bytes) => {
  const b64 = Buffer.from(bytes).toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const deriveKey = async (secret) => {
  const secretBytes = textEncoder.encode(secret);
  const hash = await webcrypto.subtle.digest("SHA-256", secretBytes);
  return webcrypto.subtle.importKey("raw", hash, "AES-GCM", false, ["encrypt"]);
};

const encryptPayload = async (payload, secret) => {
  const iv = webcrypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(secret);
  const plaintext = textEncoder.encode(JSON.stringify(payload));
  const ciphertext = await webcrypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return bytesToBase64Url(combined);
};

const getArg = (name) => {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return null;
  return process.argv[idx + 1] || null;
};

const main = async () => {
  const base = getArg("base") || process.env.QR_BASE_URL;
  const kode = getArg("kode") || process.env.KODE_TOKO;
  const secret = getArg("secret") || process.env.VITE_QR_SECRET || process.env.QR_SECRET;

  if (!base || !kode || !secret) {
    console.error("Usage: node scripts/generate-qr-link.js --base https://domain --kode KODE_TOKO --secret SECRET");
    process.exit(1);
  }

  const token = await encryptPayload({ kode_toko: kode }, secret);
  const url = new URL(base);
  url.searchParams.set("qr", token);
  console.log(url.toString());
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
