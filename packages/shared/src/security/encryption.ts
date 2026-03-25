import crypto from "crypto";

function normalizeKeyTo32Bytes(key: string): Buffer {
  const trimmed = key.trim();

  // Support hex (64 chars) or base64.
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return Buffer.from(trimmed, "hex");
  }

  const buf = Buffer.from(trimmed, "base64");
  if (buf.length === 32) return buf;

  // Fallback: treat as raw UTF-8 and hash to 32 bytes.
  return crypto.createHash("sha256").update(trimmed).digest();
}

export function encryptString(plaintext: string, key: string): string {
  const k = normalizeKeyTo32Bytes(key);
  const iv = crypto.randomBytes(12); // 96-bit recommended for GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", k, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString("base64");
}

export function decryptString(ciphertextB64: string, key: string): string {
  const k = normalizeKeyTo32Bytes(key);
  const raw = Buffer.from(ciphertextB64, "base64");
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const ciphertext = raw.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", k, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString("utf8");
}

