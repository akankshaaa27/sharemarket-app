import bcrypt from "bcryptjs";
import crypto from "crypto";

const SALT_ROUNDS = 12;
const PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789!@$%";

export async function hashPassword(plain) {
  if (!plain) {
    throw new Error("Password is required for hashing");
  }
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain, hash) {
  if (!plain || !hash) return false;
  return bcrypt.compare(plain, hash);
}

export function generateRandomPassword(length = 12) {
  const bytes = crypto.randomBytes(length);
  let password = "";
  for (let i = 0; i < length; i += 1) {
    password += PASSWORD_ALPHABET[bytes[i] % PASSWORD_ALPHABET.length];
  }
  return password;
}

export function generateUsernameFromName(name, fallback = "user") {
  const base = String(name || fallback)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 12);
  const random = crypto.randomBytes(2).toString("hex");
  return `${base || fallback}${random}`;
}

export function generateResetToken() {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashResetToken(token);
  return { token, tokenHash };
}

export function hashResetToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
