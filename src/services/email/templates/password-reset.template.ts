/**
 * ============================================================
 * PASSWORD RESET EMAIL TEMPLATE
 * ============================================================
 */

interface PasswordResetEmailParams {
  userName: string;
  resetUrl: string;
}

/**
 * ============================================================
 * PASSWORD RESET EMAIL
 * ============================================================
 */

export function createPasswordResetEmail(
  params: PasswordResetEmailParams
) {
  const {
    userName,
    resetUrl,
  } = params;

  const subject =
    "Atur Ulang Password - Pisjo Market Platform";

  const text = `
Halo, ${userName},

Kami menerima permintaan untuk mengatur ulang password akun Pisjo Market Platform Anda.

Silakan buka link berikut untuk membuat password baru:

${resetUrl}

Link ini hanya dapat digunakan satu kali dan akan kedaluwarsa setelah masa berlaku token berakhir.

Jika Anda tidak meminta pengaturan ulang password, abaikan email ini. Password akun Anda tidak akan berubah.

Pisjo Market Platform
`.trim();

  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />
  <title>Atur Ulang Password</title>
</head>

<body
  style="
    margin: 0;
    padding: 0;
    background-color: #f5f5f5;
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
    style="
      width: 100%;
      background-color: #f5f5f5;
      padding: 40px 16px;
    "
  >
    <tr>
      <td align="center">

        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
          style="
            max-width: 600px;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
          "
        >

          <tr>
            <td
              style="
                padding: 32px;
                text-align: center;
                background-color: #0f172a;
              "
            >
              <h1
                style="
                  margin: 0;
                  color: #ffffff;
                  font-size: 24px;
                "
              >
                Pisjo Market Platform
              </h1>
            </td>
          </tr>

          <tr>
            <td
              style="
                padding: 40px 32px;
                color: #334155;
              "
            >

              <h2
                style="
                  margin-top: 0;
                  color: #0f172a;
                  font-size: 24px;
                "
              >
                Atur Ulang Password
              </h2>

              <p
                style="
                  line-height: 1.7;
                  font-size: 16px;
                "
              >
                Kami menerima permintaan untuk mengatur ulang
                password akun Anda.
              </p>

              <p
                style="
                  line-height: 1.7;
                  font-size: 16px;
                "
              >
                Klik tombol di bawah ini untuk membuat password baru.
              </p>

              <table
                role="presentation"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="
                  margin: 32px 0;
                "
              >
                <tr>
                  <td
                    style="
                      border-radius: 8px;
                      background-color: #0f172a;
                    "
                  >
                    <a
                      href="${resetUrl}"
                      target="_blank"
                      rel="noopener noreferrer"
                      style="
                        display: inline-block;
                        padding: 14px 24px;
                        color: #ffffff;
                        text-decoration: none;
                        font-weight: bold;
                      "
                    >
                      Atur Ulang Password
                    </a>
                  </td>
                </tr>
              </table>

              <p
                style="
                  line-height: 1.7;
                  font-size: 14px;
                  color: #64748b;
                "
              >
                Link ini hanya dapat digunakan satu kali.
              </p>

              <p
                style="
                  line-height: 1.7;
                  font-size: 14px;
                  color: #64748b;
                "
              >
                Jika Anda tidak meminta pengaturan ulang password,
                abaikan email ini. Password Anda tidak akan berubah.
              </p>

              <hr
                style="
                  border: none;
                  border-top: 1px solid #e2e8f0;
                  margin: 32px 0;
                "
              />

              <p
                style="
                  margin-bottom: 0;
                  font-size: 12px;
                  color: #94a3b8;
                "
              >
                © Pisjo Market Platform
              </p>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>
`.trim();

  return {
    subject,
    html,
    text,
  };
}