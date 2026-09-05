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

import {
  MailCheck,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import {
  verifyEmailVerificationAction,
} from "@/actions/auth/verify-email-verification";

import {
  resendEmailVerificationAction,
} from "@/actions/auth/resend-email-verification";

import {
  AuthCard,
} from "@/components/auth/AuthCard";

import {
  AuthHeader,
} from "@/components/auth/AuthHeader";

import {
  SubmitButton,
} from "@/components/auth/SubmitButton";

/**
 * ============================================================
 * CONSTANTS
 * ============================================================
 */

const OTP_LENGTH = 6;

const INITIAL_COOLDOWN = 60;

/**
 * ============================================================
 * VERIFY EMAIL CONTENT
 * ============================================================
 */

function VerifyEmailContent() {
  const router = useRouter();

  const searchParams =
    useSearchParams();

  /**
   * ==========================================================
   * EMAIL
   * ==========================================================
   */

  const email =
    searchParams.get("email") ?? "";

  /**
   * ==========================================================
   * OTP REFERENCES
   * ==========================================================
   */

  const inputRefs =
    useRef<
      Array<HTMLInputElement | null>
    >([]);

  /**
   * ==========================================================
   * OTP STATE
   * ==========================================================
   */

  const [
    otp,
    setOtp,
  ] = useState<string[]>(
    Array(OTP_LENGTH).fill("")
  );

  /**
   * ==========================================================
   * LOADING STATE
   * ==========================================================
   */

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const [
    isResending,
    setIsResending,
  ] = useState(false);

  /**
   * ==========================================================
   * MESSAGE STATE
   * ==========================================================
   */

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    isSuccess,
    setIsSuccess,
  ] = useState(false);

  /**
   * ==========================================================
   * COOLDOWN
   * ==========================================================
   */

  const [
    cooldown,
    setCooldown,
  ] = useState(
    INITIAL_COOLDOWN
  );

  /**
   * ==========================================================
   * REDIRECT IF EMAIL IS MISSING
   * ==========================================================
   */

  useEffect(() => {
    if (!email) {
      router.replace(
        "/register"
      );
    }
  }, [
    email,
    router,
  ]);

  /**
   * ==========================================================
   * AUTO FOCUS
   * ==========================================================
   */

  useEffect(() => {
    if (!email) {
      return;
    }

    const timer =
      window.setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);

    return () => {
      window.clearTimeout(
        timer
      );
    };
  }, [email]);

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
        setCooldown(
          (current) => {
            if (current <= 1) {
              window.clearInterval(
                timer
              );

              return 0;
            }

            return current - 1;
          }
        );
      }, 1000);

    return () => {
      window.clearInterval(
        timer
      );
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
      event.target.value.replace(
        /\D/g,
        ""
      );

    /**
     * --------------------------------------------------------
     * CLEAR CURRENT DIGIT
     * --------------------------------------------------------
     */

    if (!value) {
      const nextOtp = [
        ...otp,
      ];

      nextOtp[index] = "";

      setOtp(nextOtp);

      return;
    }

    /**
     * --------------------------------------------------------
     * USE LAST DIGIT
     * --------------------------------------------------------
     */

    const nextOtp = [
      ...otp,
    ];

    nextOtp[index] =
      value[value.length - 1];

    setOtp(nextOtp);

    /**
     * --------------------------------------------------------
     * MOVE TO NEXT INPUT
     * --------------------------------------------------------
     */

    if (
      index <
      OTP_LENGTH - 1
    ) {
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
    /**
     * --------------------------------------------------------
     * BACKSPACE
     * --------------------------------------------------------
     */

    if (
      event.key ===
        "Backspace" &&
      !otp[index] &&
      index > 0
    ) {
      event.preventDefault();

      const nextOtp = [
        ...otp,
      ];

      nextOtp[index - 1] = "";

      setOtp(nextOtp);

      inputRefs.current[
        index - 1
      ]?.focus();

      return;
    }

    /**
     * --------------------------------------------------------
     * ARROW LEFT
     * --------------------------------------------------------
     */

    if (
      event.key ===
        "ArrowLeft" &&
      index > 0
    ) {
      event.preventDefault();

      inputRefs.current[
        index - 1
      ]?.focus();

      return;
    }

    /**
     * --------------------------------------------------------
     * ARROW RIGHT
     * --------------------------------------------------------
     */

    if (
      event.key ===
        "ArrowRight" &&
      index <
        OTP_LENGTH - 1
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
        .slice(
          0,
          OTP_LENGTH
        );

    if (!pastedCode) {
      return;
    }

    const nextOtp =
      Array(
        OTP_LENGTH
      ).fill("");

    pastedCode
      .split("")
      .forEach(
        (
          digit,
          index
        ) => {
          nextOtp[index] =
            digit;
        }
      );

    setOtp(nextOtp);

    /**
     * --------------------------------------------------------
     * FOCUS LAST FILLED / NEXT POSITION
     * --------------------------------------------------------
     */

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

  const handleVerify =
    async () => {
      const code =
        otp.join("");

      /**
       * --------------------------------------------------------
       * VALIDATE LENGTH
       * --------------------------------------------------------
       */

      if (
        code.length !==
        OTP_LENGTH
      ) {
        setIsSuccess(
          false
        );

        setMessage(
          "Masukkan 6 digit kode verifikasi."
        );

        inputRefs.current[0]?.focus();

        return;
      }

      /**
       * --------------------------------------------------------
       * VALIDATE EMAIL
       * --------------------------------------------------------
       */

      if (!email) {
        setIsSuccess(
          false
        );

        setMessage(
          "Email tidak ditemukan. Silakan daftar kembali."
        );

        return;
      }

      try {
        setIsLoading(
          true
        );

        setMessage("");

        /**
         * ------------------------------------------------------
         * ACTION
         * ------------------------------------------------------
         */

        const result =
          await verifyEmailVerificationAction(
            email,
            code
          );

        /**
         * ------------------------------------------------------
         * ERROR
         * ------------------------------------------------------
         */

        if (!result.success) {
          setIsSuccess(
            false
          );

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
              Array(
                OTP_LENGTH
              ).fill("")
            );

            window.setTimeout(
              () => {
                inputRefs.current[
                  0
                ]?.focus();
              },
              50
            );
          }

          return;
        }

        /**
         * ------------------------------------------------------
         * SUCCESS
         * ------------------------------------------------------
         */

        setIsSuccess(
          true
        );

        setMessage(
          result.message
        );

        /**
         * ------------------------------------------------------
         * REDIRECT
         * ------------------------------------------------------
         */

        window.setTimeout(
          () => {
            router.push(
              `/login?email=${encodeURIComponent(
                email
              )}`
            );
          },
          1500
        );
      } catch (error) {
        console.error(
          "[VERIFY_EMAIL_PAGE_ERROR]",
          error
        );

        setIsSuccess(
          false
        );

        setMessage(
          "Terjadi kesalahan saat memverifikasi email."
        );
      } finally {
        setIsLoading(
          false
        );
      }
    };

  /**
   * ==========================================================
   * RESEND OTP
   * ==========================================================
   */

  const handleResend =
    async () => {
      if (
        !email ||
        cooldown > 0 ||
        isResending
      ) {
        return;
      }

      try {
        setIsResending(
          true
        );

        setMessage("");

        setIsSuccess(
          false
        );

        /**
         * ------------------------------------------------------
         * RESEND ACTION
         * ------------------------------------------------------
         */

        const result =
          await resendEmailVerificationAction(
            email
          );

        /**
         * ------------------------------------------------------
         * ERROR
         * ------------------------------------------------------
         */

        if (!result.success) {
          setIsSuccess(
            false
          );

          setMessage(
            result.message
          );

          if (
            result.data &&
            "retryAfterSeconds" in
              result.data
          ) {
            const retryAfterSeconds =
              result.data
                .retryAfterSeconds;

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

        /**
         * ------------------------------------------------------
         * SUCCESS
         * ------------------------------------------------------
         */

        setOtp(
          Array(
            OTP_LENGTH
          ).fill("")
        );

        setCooldown(
          INITIAL_COOLDOWN
        );

        setIsSuccess(
          true
        );

        setMessage(
          result.message
        );

        window.setTimeout(
          () => {
            inputRefs.current[
              0
            ]?.focus();
          },
          50
        );
      } catch (error) {
        console.error(
          "[RESEND_EMAIL_PAGE_ERROR]",
          error
        );

        setIsSuccess(
          false
        );

        setMessage(
          "Gagal mengirim ulang kode verifikasi."
        );
      } finally {
        setIsResending(
          false
        );
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

    if (
      isLoading ||
      isResending
    ) {
      return;
    }

    void handleVerify();
  };

  /**
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <AuthCard>

      {/* ======================================================
          HEADER ICON
      ====================================================== */}

      <div
        className="
          mb-5
          flex
          justify-center
          sm:mb-6
        "
      >
        <div
          className="
            flex
            h-14
            w-14
            items-center
            justify-center
            rounded-2xl
            bg-[var(--pisjo-primary)]
          text-white
            shadow-lg
            shadow-[var(--pisjo-primary)]/20
            ring-4
            ring-[var(--pisjo-soft-blue)]
            transition-transform
            duration-300
            hover:scale-105
            sm:h-16
            sm:w-16
          "
        >
          <MailCheck
            className="
              h-7
              w-7
              sm:h-8
              sm:w-8
            "
          />
        </div>
      </div>

      {/* ======================================================
          HEADER
      ====================================================== */}

      <AuthHeader
        title="Verifikasi Email"
        description="Masukkan kode verifikasi yang kami kirim ke alamat email Anda."
      />

      {/* ======================================================
          EMAIL
      ====================================================== */}

      <div
        className="
          mt-5
          rounded-xl
          border
          border-slate-200
          bg-slate-50
          px-4
          py-3
          text-center
          sm:mt-6
        "
      >
        <p
          className="
            text-xs
            font-medium
            text-slate-500
          "
        >
          Kode dikirim ke
        </p>

        <p
          className="
            mt-1
            break-all
            text-sm
            font-semibold
            text-slate-900
          "
        >
          {email}
        </p>
      </div>

      {/* ======================================================
          OTP FORM
      ====================================================== */}

      <form
        onSubmit={
          handleSubmit
        }
        className="
          mt-5
          space-y-5
          sm:mt-6
          sm:space-y-6
        "
        noValidate
      >

        {/* ====================================================
            OTP INPUT
        ==================================================== */}

        <div
          className="
            flex
            w-full
            justify-center
            gap-1.5
            xs:gap-2
            sm:gap-3
          "
        >
          {otp.map(
            (
              digit,
              index
            ) => (
              <input
                key={index}
                ref={(
                  element
                ) => {
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
                disabled={
                  isLoading ||
                  isResending
                }
                aria-label={`Digit ${index + 1}`}
                onChange={(
                  event
                ) =>
                  handleChange(
                    index,
                    event
                  )
                }
                onKeyDown={(
                  event
                ) =>
                  handleKeyDown(
                    index,
                    event
                  )
                }
                onPaste={
                  handlePaste
                }
                className="
                  h-12
                  min-w-0
                  flex-1
                  max-w-12
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  text-center
                  text-xl
                  font-bold
                  tracking-tight
                  text-slate-900
                  shadow-sm
                  outline-none
                  transition-all
                  duration-200

                  placeholder:text-slate-400

                  hover:border-slate-300

focus:border-[var(--pisjo-primary)]
focus:bg-white
focus:ring-4
focus:ring-[var(--pisjo-primary)]/10
focus:shadow-[0_0_0_1px_rgba(7,136,232,0.15)]

                  disabled:cursor-not-allowed
                  disabled:bg-slate-50
                  disabled:opacity-60

                  sm:h-14
                  sm:max-w-12
                  sm:rounded-xl
                  sm:text-2xl
                "
              />
            )
          )}
        </div>

        {/* ====================================================
            HELPER TEXT
        ==================================================== */}

        <p
          className="
            text-center
            text-xs
            leading-5
            text-slate-500
          "
        >
          Masukkan 6 digit kode yang
          Anda terima melalui email.
        </p>

        {/* ====================================================
            MESSAGE
        ==================================================== */}

        {message && (
          <div
            role={
              isSuccess
                ? "status"
                : "alert"
            }
            className={[
              `
                flex
                items-start
                gap-2.5
                rounded-xl
                border
                px-3.5
                py-3
                text-sm
                leading-5
              `,
              isSuccess
                ? `
                  border-emerald-200
                  bg-emerald-50
                  text-emerald-800
                `
                : `
                  border-red-200
                  bg-red-50
                  text-red-800
                `,
            ].join(" ")}
          >
            {isSuccess ? (
              <CheckCircle2
                className="
                  mt-0.5
                  h-4
                  w-4
                  shrink-0
                  text-emerald-600
                "
              />
            ) : (
              <AlertCircle
                className="
                  mt-0.5
                  h-4
                  w-4
                  shrink-0
                  text-red-600
                "
              />
            )}

            <span>
              {message}
            </span>
          </div>
        )}

        {/* ====================================================
            VERIFY BUTTON
        ==================================================== */}

        <SubmitButton
          loading={
            isLoading
          }
          disabled={
            otp.join("").length !==
              OTP_LENGTH ||
            isResending
          }
          text="Verifikasi Email"
          loadingText="Memverifikasi..."
          className="
            h-12
            rounded-xl
            bg-[var(--pisjo-primary)]
            shadow-[var(--pisjo-primary)]/15
            shadow-sky-700/15
            transition-all
            duration-200

            hover:bg-[var(--pisjo-ocean)]
            hover:shadow-lg
            hover:shadow-[var(--pisjo-primary)]/20

            disabled:bg-slate-300
            disabled:text-white
            disabled:shadow-none

            sm:h-12
          "
        />

      </form>

      {/* ======================================================
          RESEND
      ====================================================== */}

      <div
        className="
          mt-5
          text-center
          sm:mt-6
        "
      >
        {cooldown > 0 ? (
          <div
            className="
              rounded-xl
              bg-slate-50
              px-3
              py-3
            "
          >
            <p
              className="
                text-xs
                text-slate-500
                sm:text-sm
              "
            >
              Belum menerima kode?
            </p>

            <p
              className="
                mt-1
                text-xs
                text-slate-500
                sm:text-sm
              "
            >
              Kirim ulang dalam{" "}
              <span
                className="
                  font-semibold
                  text-[var(--pisjo-ocean)]
                "
              >
                {cooldown} detik
              </span>
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={
              handleResend
            }
            disabled={
              isResending
            }
            className="
              inline-flex
              min-h-11
              items-center
              justify-center
              gap-2
              rounded-xl
              px-4
              text-sm
              font-semibold
              text-[var(--pisjo-ocean)]
              transition-all
              duration-200

              hover:bg-[var(--pisjo-soft-blue)]
              hover:text-[var(--pisjo-primary)]

              focus:outline-none
              focus-visible:ring-2
              focus-visible:ring-[var(--pisjo-primary)]
              focus-visible:ring-offset-2

              disabled:cursor-not-allowed
              disabled:opacity-50

              sm:min-h-0
            "
          >
            <RefreshCw
              className={[
                `
                  h-4
                  w-4
                `,
                isResending
                  ? "animate-spin"
                  : "",
              ].join(" ")}
            />

            {isResending
              ? "Mengirim kode..."
              : "Kirim ulang kode"}
          </button>
        )}
      </div>

      {/* ======================================================
          LOGIN LINK
      ====================================================== */}

      <div
        className="
          mt-5
          border-t
          border-slate-100
          pt-5
          text-center
          text-sm
          text-slate-500
          sm:mt-6
          sm:pt-6
        "
      >
        <span>
          Sudah punya akun?
        </span>{" "}

        <Link
          href="/login"
          className="
            inline-flex
            min-h-11
            items-center
            gap-1.5
            font-semibold
            text-[var(--pisjo-ocean)]
            transition-colors
            duration-200

            hover:text-[var(--pisjo-primary)]
            hover:underline

            focus:outline-none
            focus-visible:rounded-md
            focus-visible:ring-2
            focus-visible:ring-[var(--pisjo-primary)]
            focus-visible:ring-offset-2

            sm:min-h-0
          "
        >
          <ArrowLeft
            className="
              h-4
              w-4
            "
          />

          Login di sini
        </Link>
      </div>

    </AuthCard>
  );
}

/**
 * ============================================================
 * VERIFY EMAIL PAGE
 * ============================================================
 */

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <AuthCard>
          <AuthHeader
            title="Verifikasi Email"
            description="Memuat halaman verifikasi email..."
          />

          <div
            className="
              flex
              items-center
              justify-center
              py-8
            "
          >
            <div
              className="
                h-8
                w-8
                animate-spin
                rounded-full
                border-2
                border-slate-200
                border-t-[var(--pisjo-primary)]
              "
            />
          </div>
        </AuthCard>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
