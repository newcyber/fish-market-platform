/**
 * Environment Loader
 *
 * Seluruh aplikasi WAJIB mengambil environment variable
 * melalui file ini.
 *
 * Jangan gunakan process.env secara langsung
 * di file lain.
 */

function required(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}`
    );
  }

  return value;
}

function optional(name: string, defaultValue = ""): string {
  return process.env[name] ?? defaultValue;
}

export const env = {
  /**
   * Application
   */
  NODE_ENV: optional("NODE_ENV", "development"),

  /**
   * Database
   */
  DATABASE_URL: required("DATABASE_URL"),

  /**
   * Auth.js
   */
  AUTH_SECRET: required("AUTH_SECRET"),

  AUTH_URL: optional("AUTH_URL"),

  /**
   * Upload (Future)
   */
  STORAGE_ENDPOINT: optional("STORAGE_ENDPOINT"),

  STORAGE_BUCKET: optional("STORAGE_BUCKET"),

  STORAGE_ACCESS_KEY: optional("STORAGE_ACCESS_KEY"),

  STORAGE_SECRET_KEY: optional("STORAGE_SECRET_KEY"),

  /**
   * Email (Future)
   */
  SMTP_HOST: optional("SMTP_HOST"),

  SMTP_PORT: optional("SMTP_PORT"),

  SMTP_USER: optional("SMTP_USER"),

  SMTP_PASSWORD: optional("SMTP_PASSWORD"),
} as const;