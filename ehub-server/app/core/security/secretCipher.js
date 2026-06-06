import crypto from "node:crypto";

const VERSION = "v1";
const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;

const deriveKey = (masterKey) => {
  const secret = String(masterKey || "").trim();
  if (!secret) throw new Error("missing_secret_encryption_key");
  return crypto.createHash("sha256").update(secret).digest();
};

export const canEncryptSecrets = (masterKey) => Boolean(String(masterKey || "").trim());

export const encryptSecret = (value, masterKey) => {
  const plaintext = String(value || "");
  if (!plaintext) throw new Error("missing_secret_value");

  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, deriveKey(masterKey), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [VERSION, iv.toString("base64"), tag.toString("base64"), encrypted.toString("base64")].join(":");
};

export const decryptSecret = (payload, masterKey) => {
  const parts = String(payload || "").split(":");
  if (parts.length !== 4 || parts[0] !== VERSION) throw new Error("invalid_secret_payload");

  const [, ivText, tagText, encryptedText] = parts;
  const decipher = crypto.createDecipheriv(ALGORITHM, deriveKey(masterKey), Buffer.from(ivText, "base64"));
  decipher.setAuthTag(Buffer.from(tagText, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedText, "base64")),
    decipher.final(),
  ]).toString("utf8");
};
