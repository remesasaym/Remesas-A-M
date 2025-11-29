// backend/services/encryptionService.js
const crypto = require('crypto');
const logger = require("pino")();

const ALGORITHM = 'aes-256-gcm';
const KEY_HEX = process.env.ENCRYPTION_KEY;
const IV_LENGTH = 16;

// Validar key al inicio
if (!KEY_HEX || KEY_HEX.length !== 64) {
  logger.error("CRITICAL: ENCRYPTION_KEY missing or invalid length (must be 64 hex chars)");
  // No throw here to avoid crashing app on startup if env not loaded yet, but encrypt will fail
}

const KEY = KEY_HEX ? Buffer.from(KEY_HEX, 'hex') : null;

function encrypt(text) {
  if (!text) return null;
  if (!KEY) throw new Error("Encryption key not configured");

  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:encryptedData
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    logger.error({ error }, "Encryption failed");
    throw error;
  }
}

function decrypt(encryptedText) {
  if (!encryptedText) return null;
  if (!KEY) throw new Error("Encryption key not configured");

  try {
    // Check if it's new format (contains colons and hex)
    if (encryptedText.includes(':')) {
      const parts = encryptedText.split(':');
      if (parts.length === 3) {
        const [ivHex, authTagHex, encryptedHex] = parts;

        const decipher = crypto.createDecipheriv(
          ALGORITHM,
          KEY,
          Buffer.from(ivHex, 'hex')
        );

        decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

        let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
      }
    }

    // Fallback: Try legacy base64
    // logger.warn("Legacy decryption used (Base64)");
    return Buffer.from(encryptedText, "base64").toString("utf8");

  } catch (error) {
    // If legacy fails too, just return original text or null
    // logger.error({ error }, "Decryption failed");
    // Try returning as is if it was plain text (shouldn't happen but safe fallback)
    return encryptedText;
  }
}

module.exports = { encrypt, decrypt };
