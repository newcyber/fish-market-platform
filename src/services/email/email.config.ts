/**
 * ============================================================
 * EMAIL CONFIGURATION
 * ============================================================
 */

function getRequiredEnv(
  name: string
): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `[EMAIL_CONFIG_ERROR] Missing environment variable: ${name}`
    );
  }

  return value;
}

function parseBoolean(
  value: string | undefined
): boolean {
  return value === "true";
}

function parsePort(
  value: string | undefined
): number {
  const port = Number(value ?? "587");

  if (
    !Number.isInteger(port) ||
    port <= 0 ||
    port > 65535
  ) {
    throw new Error(
      "[EMAIL_CONFIG_ERROR] SMTP_PORT tidak valid."
    );
  }

  return port;
}

export const EmailConfig = {
  get host() {
    return getRequiredEnv("SMTP_HOST");
  },

  get port() {
    return parsePort(
      process.env.SMTP_PORT
    );
  },

  get secure() {
    return parseBoolean(
      process.env.SMTP_SECURE
    );
  },

  get user() {
    return getRequiredEnv("SMTP_USER");
  },

  get password() {
    return getRequiredEnv("SMTP_PASS");
  },

  get from() {
    return (
      process.env.EMAIL_FROM ??
      "Fish Market <no-reply@localhost>"
    );
  },
};