import bcrypt from "bcryptjs";

/**
 * Jumlah salt rounds untuk hashing password.
 *
 * Nilai 12 memberikan keseimbangan yang baik antara
 * keamanan dan performa untuk aplikasi production.
 */
const SALT_ROUNDS = 12;

/**
 * Hash password sebelum disimpan ke database.
 *
 * @param password Password asli (plain text)
 * @returns Password yang sudah di-hash
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password) {
    throw new Error("Password is required.");
  }

  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Membandingkan password plain text dengan hash di database.
 *
 * @param password Password yang diinput user
 * @param hashedPassword Password hash dari database
 * @returns true jika cocok
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  if (!password || !hashedPassword) {
    return false;
  }

  return bcrypt.compare(password, hashedPassword);
}