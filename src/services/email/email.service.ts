import nodemailer, {
  type Transporter,
} from "nodemailer";

/**
 * ============================================================
 * EMAIL TYPES
 * ============================================================
 */

export interface SendEmailOptions {
  to: string;

  subject: string;

  html: string;

  text: string;
}

export interface SendEmailResult {
  messageId: string;
}

/**
 * ============================================================
 * EMAIL SERVICE
 * ============================================================
 *
 * Service reusable untuk seluruh kebutuhan email:
 *
 * - Password Reset
 * - Email Verification
 * - Order Notification
 * - Payment Notification
 * - Shipping Notification
 * - Security Notification
 *
 * Provider SMTP dapat diganti melalui environment variable.
 */

export class EmailService {
  private static transporter:
    | Transporter
    | null = null;

  /**
   * ==========================================================
   * GET TRANSPORTER
   * ==========================================================
   */

  private static getTransporter(): Transporter {
    if (this.transporter) {
      return this.transporter;
    }

    const host =
      process.env.SMTP_HOST;

    const port =
      Number(
        process.env.SMTP_PORT ?? 587
      );

    const secure =
      process.env.SMTP_SECURE === "true";

    const user =
      process.env.SMTP_USER;

    const pass =
      process.env.SMTP_PASS;

    /**
     * Pastikan konfigurasi SMTP tersedia.
     */

    if (!host) {
      throw new Error(
        "SMTP_HOST belum dikonfigurasi."
      );
    }

    if (!user) {
      throw new Error(
        "SMTP_USER belum dikonfigurasi."
      );
    }

    if (!pass) {
      throw new Error(
        "SMTP_PASS belum dikonfigurasi."
      );
    }

    /**
     * Membuat SMTP transporter.
     *
     * Port 465:
     * secure=true
     *
     * Port 587:
     * secure=false
     * STARTTLS akan digunakan jika tersedia.
     */

    this.transporter =
      nodemailer.createTransport({
        host,

        port,

        secure,

        auth: {
          user,
          pass,
        },

        /**
         * Mencegah Nodemailer mengambil
         * file atau URL dari input email.
         */

        disableFileAccess: true,

        disableUrlAccess: true,
      });

    return this.transporter;
  }

  /**
   * ==========================================================
   * SEND EMAIL
   * ==========================================================
   */

  static async send(
    options: SendEmailOptions
  ): Promise<SendEmailResult> {
    const transporter =
      this.getTransporter();

    const from =
      process.env.EMAIL_FROM;

    if (!from) {
      throw new Error(
        "EMAIL_FROM belum dikonfigurasi."
      );
    }

    const info =
      await transporter.sendMail({
        from,

        to: options.to,

        subject: options.subject,

        html: options.html,

        text: options.text,
      });

    return {
      messageId: info.messageId,
    };
  }

  /**
   * ==========================================================
   * VERIFY CONNECTION
   * ==========================================================
   *
   * Berguna untuk health check atau testing SMTP.
   */

  static async verify(): Promise<boolean> {
    const transporter =
      this.getTransporter();

    await transporter.verify();

    return true;
  }
}