/**
 * ============================================================
 * EMAIL TYPES
 * ============================================================
 */

export interface SendEmailOptions {
  /**
   * Alamat email penerima.
   */
  to: string;

  /**
   * Subject email.
   */
  subject: string;

  /**
   * Konten plain text.
   */
  text: string;

  /**
   * Konten HTML.
   */
  html: string;
}

export interface EmailSendResult {
  /**
   * Apakah email berhasil dikirim.
   */
  success: boolean;

  /**
   * Message ID dari SMTP provider.
   */
  messageId?: string;

  /**
   * Error jika pengiriman gagal.
   */
  error?: string;
}