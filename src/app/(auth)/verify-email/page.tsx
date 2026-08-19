"use client";

import {
  Suspense,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";

import Link from "next/link";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import { verifyEmailVerificationAction } from "@/actions/auth/verify-email-verification";
import { resendEmailVerificationAction } from "@/actions/auth/resend-email-verification";

/**
 * ============================================================
 * VERIFY EMAIL PAGE
 * ============================================================
 */

const OTP_LENGTH = 6;
const INITIAL_COOLDOWN = 60;

function VerifyEmailContent() {
  const router = useRouter();

  const searchParams =
    useSearchParams();

  const email =
    searchParams.get("email") ?? "";

  const inputRefs =
    useRef<
      Array<HTMLInputElement | null>
    >([]);

  const [otp, setOtp] =
    useState<string[]>(
      Array(OTP_LENGTH).fill("")
    );

  const [isLoading, setIsLoading] =
    useState(false);

  const [isResending, setIsResending] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [isSuccess, setIsSuccess] =
    useState(false);

  const [cooldown, setCooldown] =
    useState(INITIAL_COOLDOWN);

  /**
   * ==========================================================
   * REDIRECT IF EMAIL IS MISSING
   * ==========================================================
   */

  useEffect(() => {
    if (!email) {
      router.replace("/register");
    }
  }, [email, router]);

  /**
   * ==========================================================
   * AUTO FOCUS
   * ==========================================================
   */

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  /**
   * ==========================================================
   * COOLDOWN TIMER
   * ==========================================================
   */

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }

    const timer =
      window.setInterval(() => {
        setCooldown((current) => {
          if (current <= 1) {
            window.clearInterval(timer);

            return 0;
          }

          return current - 1;
        });
      }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [cooldown]);

  /**
   * ==========================================================
   * HANDLE OTP CHANGE
   * ==========================================================
   */

  const handleChange = (
    index: number,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const value =
      event.target.value.replace(/\D/g, "");

    if (!value) {
      const nextOtp = [...otp];

      nextOtp[index] = "";

      setOtp(nextOtp);

      return;
    }

    const nextOtp = [...otp];

    nextOtp[index] =
      value[value.length - 1];

    setOtp(nextOtp);

    if (index < OTP_LENGTH - 1) {
      inputRefs.current[
        index + 1
      ]?.focus();
    }
  };

  /**
   * ==========================================================
   * HANDLE KEYBOARD
   * ==========================================================
   */

  const handleKeyDown = (
    index: number,
    event: KeyboardEvent<HTMLInputElement>
  ) => {
    if (
      event.key === "Backspace" &&
      !otp[index] &&
      index > 0
    ) {
      event.preventDefault();

      const nextOtp = [...otp];

      nextOtp[index - 1] = "";

      setOtp(nextOtp);

      inputRefs.current[
        index - 1
      ]?.focus();
    }

    if (
      event.key === "ArrowLeft" &&
      index > 0
    ) {
      event.preventDefault();

      inputRefs.current[
        index - 1
      ]?.focus();
    }

    if (
      event.key === "ArrowRight" &&
      index < OTP_LENGTH - 1
    ) {
      event.preventDefault();

      inputRefs.current[
        index + 1
      ]?.focus();
    }
  };

  /**
   * ==========================================================
   * HANDLE PASTE
   * ==========================================================
   */

  const handlePaste = (
    event: ClipboardEvent<HTMLInputElement>
  ) => {
    event.preventDefault();

    const pastedCode =
      event.clipboardData
        .getData("text")
        .replace(/\D/g, "")
        .slice(0, OTP_LENGTH);

    if (!pastedCode) {
      return;
    }

    const nextOtp =
      Array(OTP_LENGTH).fill("");

    pastedCode
      .split("")
      .forEach(
        (digit, index) => {
          nextOtp[index] = digit;
        }
      );

    setOtp(nextOtp);

    const focusIndex =
      Math.min(
        pastedCode.length,
        OTP_LENGTH - 1
      );

    inputRefs.current[
      focusIndex
    ]?.focus();
  };

  /**
   * ==========================================================
   * VERIFY OTP
   * ==========================================================
   */

  const handleVerify = async () => {
    const code =
      otp.join("");

    if (code.length !== OTP_LENGTH) {
      setIsSuccess(false);

      setMessage(
        "Masukkan 6 digit kode verifikasi."
      );

      return;
    }

    if (!email) {
      setIsSuccess(false);

      setMessage(
        "Email tidak ditemukan. Silakan daftar kembali."
      );

      return;
    }

    try {
      setIsLoading(true);

      setMessage("");

      const result =
        await verifyEmailVerificationAction(
          email,
          code
        );

      if (!result.success) {
        setIsSuccess(false);

        setMessage(
          result.message
        );

        if (
          result.code ===
            "INVALID_OTP" ||
          result.code ===
            "OTP_MAX_ATTEMPTS_EXCEEDED"
        ) {
          setOtp(
            Array(OTP_LENGTH).fill("")
          );

          inputRefs.current[0]?.focus();
        }

        return;
      }

      setIsSuccess(true);

      setMessage(
        result.message
      );

      window.setTimeout(() => {
        router.push(
          `/login?email=${encodeURIComponent(
            email
          )}`
        );
      }, 1500);
    } catch (error) {
      console.error(
        "[VERIFY_EMAIL_PAGE_ERROR]",
        error
      );

      setIsSuccess(false);

      setMessage(
        "Terjadi kesalahan saat memverifikasi email."
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * ==========================================================
   * RESEND OTP
   * ==========================================================
   */

  const handleResend = async () => {
    if (
      !email ||
      cooldown > 0 ||
      isResending
    ) {
      return;
    }

    try {
      setIsResending(true);

      setMessage("");

      const result =
        await resendEmailVerificationAction(
          email
        );

      if (!result.success) {
        setIsSuccess(false);

        setMessage(
          result.message
        );

        if (
          result.data &&
          "retryAfterSeconds" in result.data
        ) {
          const retryAfterSeconds =
            result.data.retryAfterSeconds;

          if (
            typeof retryAfterSeconds ===
            "number"
          ) {
            setCooldown(
              retryAfterSeconds
            );
          }
        }

        return;
      }

      setOtp(
        Array(OTP_LENGTH).fill("")
      );

      setCooldown(
        INITIAL_COOLDOWN
      );

      setIsSuccess(true);

      setMessage(
        result.message
      );

      inputRefs.current[0]?.focus();
    } catch (error) {
      console.error(
        "[RESEND_EMAIL_PAGE_ERROR]",
        error
      );

      setIsSuccess(false);

      setMessage(
        "Gagal mengirim ulang kode verifikasi."
      );
    } finally {
      setIsResending(false);
    }
  };

  /**
   * ==========================================================
   * FORM SUBMIT
   * ==========================================================
   */

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    void handleVerify();
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <section className="w-full max-w-md">
        <div className="rounded-xl border bg-card p-6 shadow-sm sm:p-8">
          {/* ==================================================
              HEADER
          ================================================== */}

          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight">
              Verifikasi Email
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Kami telah mengirimkan kode verifikasi
              6 digit ke alamat email Anda.
            </p>

            <p className="mt-3 break-all text-sm font-medium">
              {email}
            </p>
          </div>

          {/* ==================================================
              OTP FORM
          ================================================== */}

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div className="flex justify-center gap-2 sm:gap-3">
              {otp.map(
                (digit, index) => (
                  <input
                    key={index}
                    ref={(element) => {
                      inputRefs.current[
                        index
                      ] = element;
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete={
                      index === 0
                        ? "one-time-code"
                        : "off"
                    }
                    maxLength={1}
                    value={digit}
                    disabled={isLoading}
                    onChange={(event) =>
                      handleChange(
                        index,
                        event
                      )
                    }
                    onKeyDown={(event) =>
                      handleKeyDown(
                        index,
                        event
                      )
                    }
                    onPaste={handlePaste}
                    className="h-12 w-10 rounded-lg border bg-background text-center text-xl font-semibold outline-none transition focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 sm:h-14 sm:w-12"
                  />
                )
              )}
            </div>

            {/* ================================================
                MESSAGE
            ================================================= */}

            {message && (
              <div
                className={[
                  "rounded-lg border px-4 py-3 text-sm",
                  isSuccess
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-destructive/30 bg-destructive/10 text-destructive",
                ].join(" ")}
              >
                {message}
              </div>
            )}

            {/* ================================================
                VERIFY BUTTON
            ================================================= */}

            <button
              type="submit"
              disabled={
                isLoading ||
                otp.join("").length !==
                  OTP_LENGTH
              }
              className="flex h-11 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading
                ? "Memverifikasi..."
                : "Verifikasi Email"}
            </button>
          </form>

          {/* ==================================================
              RESEND
          ================================================== */}

          <div className="mt-6 text-center">
            {cooldown > 0 ? (
              <p className="text-sm text-muted-foreground">
                Kirim ulang kode dalam{" "}
                <span className="font-medium text-foreground">
                  {cooldown} detik
                </span>
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="text-sm font-medium text-primary transition hover:underline disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isResending
                  ? "Mengirim..."
                  : "Kirim ulang kode"}
              </button>
            )}
          </div>

          {/* ==================================================
              LOGIN LINK
          ================================================== */}

          <div className="mt-8 border-t pt-6 text-center text-sm text-muted-foreground">
            Sudah punya akun?{" "}

            <Link
              href="/login"
              className="font-medium text-primary transition hover:underline"
            >
              Login di sini
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Memuat halaman verifikasi...
            </p>
          </div>
        </main>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}