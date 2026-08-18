import { EmailService } from "@/services/email/email.service";

/**
 * ============================================================
 * EMAIL VERIFICATION EMAIL SERVICE
 * ============================================================
 *
 * Bertanggung jawab untuk menyusun dan mengirim email
 * verifikasi OTP.
 */

export class EmailVerificationEmailService {
  /**
   * ============================================================
   * SEND VERIFICATION OTP
   * ============================================================
   */

  static async sendVerificationOtp({
    to,
    name,
    otp,
    expiresAt,
  }: {
    to: string;
    name: string | null;
    otp: string;
    expiresAt: Date;
  }) {
    const expiresInMinutes = Math.max(
      1,
      Math.ceil(
        (expiresAt.getTime() - Date.now()) /
          (1000 * 60)
      )
    );

    const greetingName =
      name?.trim() || "Pelanggan";

    const subject =
      `${otp} adalah kode verifikasi Fish Market`;

    const text = [
      `Halo ${greetingName},`,
      "",
      "Terima kasih telah mendaftar di Fish Market.",
      "",
      `Kode verifikasi email Anda: ${otp}`,
      "",
      `Kode ini berlaku selama ${expiresInMinutes} menit.`,
      "",
      "Jangan bagikan kode ini kepada siapa pun.",
      "",
      "Jika Anda tidak merasa melakukan pendaftaran, abaikan email ini.",
    ].join("\n");

    const html = `
      <!DOCTYPE html>
      <html lang="id">
        <head>
          <meta charset="UTF-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <title>Verifikasi Email Fish Market</title>
        </head>

        <body
          style="
            margin: 0;
            padding: 0;
            background: #f4f7f6;
            font-family:
              Arial,
              Helvetica,
              sans-serif;
          "
        >
          <table
            role="presentation"
            width="100%"
            cellspacing="0"
            cellpadding="0"
            border="0"
          >
            <tr>
              <td
                align="center"
                style="
                  padding:
                    40px
                    16px;
                "
              >
                <table
                  role="presentation"
                  width="100%"
                  cellspacing="0"
                  cellpadding="0"
                  border="0"
                  style="
                    max-width: 600px;
                    background: #ffffff;
                    border-radius: 16px;
                    overflow: hidden;
                  "
                >
                  <tr>
                    <td
                      style="
                        padding:
                          32px
                          32px
                          20px;
                        text-align: center;
                      "
                    >
                      <h1
                        style="
                          margin: 0;
                          font-size: 28px;
                        "
                      >
                        Fish Market
                      </h1>

                      <p
                        style="
                          margin:
                            12px
                            0
                            0;
                          color: #666666;
                        "
                      >
                        Verifikasi alamat email Anda
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td
                      style="
                        padding:
                          16px
                          32px
                          32px;
                        color: #333333;
                        line-height: 1.6;
                      "
                    >
                      <p>
                        Halo
                        <strong>${greetingName}</strong>,
                      </p>

                      <p>
                        Terima kasih telah mendaftar
                        di Fish Market.
                      </p>

                      <p>
                        Gunakan kode berikut
                        untuk memverifikasi email Anda:
                      </p>

                      <div
                        style="
                          margin:
                            28px
                            0;
                          padding:
                            20px;
                          background: #f4f7f6;
                          border-radius: 12px;
                          text-align: center;
                        "
                      >
                        <span
                          style="
                            font-size: 32px;
                            font-weight: 700;
                            letter-spacing: 8px;
                          "
                        >
                          ${otp}
                        </span>
                      </div>

                      <p>
                        Kode ini berlaku selama
                        <strong>
                          ${expiresInMinutes} menit
                        </strong>.
                      </p>

                      <p
                        style="
                          color: #c0392b;
                          font-size: 14px;
                        "
                      >
                        Jangan bagikan kode ini
                        kepada siapa pun.
                      </p>

                      <p
                        style="
                          margin-top: 32px;
                          font-size: 13px;
                          color: #888888;
                        "
                      >
                        Jika Anda tidak merasa
                        melakukan pendaftaran,
                        Anda dapat mengabaikan
                        email ini.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    return EmailService.send({
      to,
      subject,
      html,
      text,
    });
  }
}

export default EmailVerificationEmailService;