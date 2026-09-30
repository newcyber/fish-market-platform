"use client";

import {
  useEffect,
  useState,
  useTransition,
} from "react";

import Link from "next/link";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  useForm,
} from "react-hook-form";

import {
  zodResolver,
} from "@hookform/resolvers/zod";

import {
  toast,
} from "sonner";

import {
  login,
} from "@/actions/auth/login";

import {
  requestWhatsAppLoginOtp,
  verifyWhatsAppLoginOtp,
} from "@/actions/auth/whatsapp-login";

import {
  LoginSchema,
  type LoginInput,
} from "@/validations/auth/login.schema";

import {
  AuthCard,
} from "@/components/auth/AuthCard";

import {
  AuthHeader,
} from "@/components/auth/AuthHeader";

import {
  PasswordField,
} from "@/components/auth/PasswordField";

import {
  SubmitButton,
} from "@/components/auth/SubmitButton";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

import {
  Checkbox,
} from "@/components/ui/checkbox";

import {
  Input,
} from "@/components/ui/input";

import {
  Label,
} from "@/components/ui/label";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";

/**
 * ============================================================
 * LOGIN FORM
 * ============================================================
 *
 * Dua metode login:
 *
 * 1. Password
 *    - Email
 *    - Nomor WhatsApp
 *    - Password
 *
 * 2. WhatsApp OTP
 *    - Nomor WhatsApp
 *    - OTP 6 digit
 *
 * Backend existing tidak diubah.
 * ============================================================
 */

type LoginMethod =
  | "password"
  | "whatsapp";

type OtpStep =
  | "phone"
  | "otp";

export function LoginForm() {
  const router = useRouter();

  const searchParams =
    useSearchParams();

  /**
   * ==========================================================
   * SAFE CALLBACK URL
   * ==========================================================
   */

  const rawCallbackUrl =
    searchParams.get(
      "callbackUrl",
    );

  const callbackUrl =
    rawCallbackUrl &&
    rawCallbackUrl.startsWith("/") &&
    !rawCallbackUrl.startsWith("//")
      ? rawCallbackUrl
      : null;

  /**
   * ==========================================================
   * TRANSITIONS
   * ==========================================================
   */

  const [
    isPasswordPending,
    startPasswordTransition,
  ] = useTransition();

  const [
    isOtpPending,
    startOtpTransition,
  ] = useTransition();

  /**
   * ==========================================================
   * LOGIN METHOD
   * ==========================================================
   */

  const [
    loginMethod,
    setLoginMethod,
  ] = useState<LoginMethod>(
    "password",
  );

  /**
   * ==========================================================
   * PASSWORD LOGIN STATE
   * ==========================================================
   */

  const [
    rememberMe,
    setRememberMe,
  ] = useState(false);

  const [
    serverError,
    setServerError,
  ] = useState("");

  /**
   * ==========================================================
   * WHATSAPP OTP STATE
   * ==========================================================
   */

  const [
    otpStep,
    setOtpStep,
  ] = useState<OtpStep>(
    "phone",
  );

  const [
    otpPhone,
    setOtpPhone,
  ] = useState("");

  const [
    otp,
    setOtp,
  ] = useState("");

  const [
    otpError,
    setOtpError,
  ] = useState("");

  const [
    otpMessage,
    setOtpMessage,
  ] = useState("");

  const [
    resendAvailableAt,
    setResendAvailableAt,
  ] = useState<
    Date | null
  >(null);

  const [
    countdown,
    setCountdown,
  ] = useState(0);

  /**
   * ==========================================================
   * PASSWORD FORM
   * ==========================================================
   */

  const {
    register,
    handleSubmit,
    setError,
    formState: {
      errors,
    },
  } = useForm<LoginInput>({
    resolver:
      zodResolver(
        LoginSchema,
      ),

    defaultValues: {
      email: "",
      password: "",
    },

    mode: "onSubmit",
  });

  /**
   * ==========================================================
   * OTP COUNTDOWN
   * ==========================================================
   */

  useEffect(() => {
  if (!resendAvailableAt) {
    return;
  }

  const updateCountdown = () => {
    const remaining = Math.max(
      0,
      Math.ceil(
        (resendAvailableAt.getTime() -
          Date.now()) /
          1000,
      ),
    );

    setCountdown(remaining);

    if (remaining <= 0) {
      setResendAvailableAt(null);
    }
  };

  const interval = window.setInterval(
    updateCountdown,
    1000,
  );

  updateCountdown();

  return () => {
    window.clearInterval(interval);
  };
}, [resendAvailableAt]);

  /**
   * ==========================================================
   * FORMAT COUNTDOWN
   * ==========================================================
   */

  const formatCountdown =
    (seconds: number) => {
      const minutes =
        Math.floor(
          seconds / 60,
        );

      const remainingSeconds =
        seconds % 60;

      return `${minutes}:${remainingSeconds
        .toString()
        .padStart(2, "0")}`;
    };

  /**
   * ==========================================================
   * NORMALIZE PHONE FOR UI
   * ==========================================================
   */

  const normalizePhone =
    (
      value: string,
    ) => {
      const digits =
        value.replace(
          /\D/g,
          "",
        );

      if (
        digits.startsWith(
          "62",
        )
      ) {
        return digits;
      }

      if (
        digits.startsWith(
          "0",
        )
      ) {
        return `62${digits.slice(
          1,
        )}`;
      }

      return digits;
    };

  /**
   * ==========================================================
   * SWITCH LOGIN METHOD
   * ==========================================================
   */

  const switchLoginMethod =
    (
      method: LoginMethod,
    ) => {
      setLoginMethod(
        method,
      );

      setServerError("");
      setOtpError("");
      setOtpMessage("");

      if (
        method ===
        "password"
      ) {
        setOtpStep("phone");
        setOtp("");
        setResendAvailableAt(
          null,
        );
      }
    };

  /**
   * ==========================================================
   * PASSWORD LOGIN
   * ==========================================================
   */

  const onPasswordSubmit =
    (
      values: LoginInput,
    ) => {
      setServerError("");

      startPasswordTransition(
        async () => {
          try {
            const result =
              await login(
                values,
              );

            /**
             * ================================================
             * LOGIN FAILED
             * ================================================
             */

            if (
              !result.success
            ) {
              /**
               * ==============================================
               * EMAIL NOT VERIFIED
               * ==============================================
               */

              if (
                result.code ===
                "EMAIL_NOT_VERIFIED"
              ) {
                toast.error(
                  result.message ??
                    "Email Anda belum diverifikasi.",
                );

                router.push(
                  `/verify-email?email=${encodeURIComponent(
                    values.email
                      .trim()
                      .toLowerCase(),
                  )}`,
                );

                return;
              }

              /**
               * ==============================================
               * FIELD ERRORS
               * ==============================================
               */

              if (
                result.fieldErrors
              ) {
                for (
                  const [
                    field,
                    message,
                  ] of Object.entries(
                    result.fieldErrors,
                  )
                ) {
                  if (
                    !message
                  ) {
                    continue;
                  }

                  setError(
                    field as keyof LoginInput,
                    {
                      type: "server",
                      message,
                    },
                  );
                }
              }

              setServerError(
                result.message ??
                  "Email/nomor WhatsApp atau password salah.",
              );

              return;
            }

/**
 * ==============================================
 * SUCCESS
 * ==============================================
 */

/**
 * ============================================================
 * REDIRECT SETELAH PASSWORD LOGIN
 * ============================================================
 *
 * Prioritas:
 *
 * 1. CUSTOMER tanpa alamat
 *    -> /customer/addresses/create
 *
 * 2. callbackUrl yang aman
 *    -> callbackUrl
 *
 * 3. ADMIN / SUPER_ADMIN
 *    -> /admin
 *
 * 4. CUSTOMER
 *    -> /customer
 */

const destination =
  result.role === "CUSTOMER" &&
  result.hasAddress === false
    ? "/customer/addresses/create"
    : callbackUrl ??
      (
        result.role === "ADMIN" ||
        result.role === "SUPER_ADMIN"
          ? "/admin"
          : "/customer"
      );

/**
 * Tampilkan SATU notifikasi sukses.
 */
toast.success(
  result.message ??
    "Login berhasil.",
);

/**
 * Refresh session Auth.js terlebih dahulu.
 */
router.refresh();

/**
 * Beri waktu singkat agar session cookie/state
 * diperbarui sebelum melakukan navigasi.
 */
setTimeout(() => {
  router.replace(destination);
}, 50);
          } catch (error) {
            console.error(
              "[LOGIN_FORM]",
              error,
            );

            setServerError(
              "Terjadi kesalahan saat login. Silakan coba lagi.",
            );
          }
        },
      );
    };

  /**
   * ==========================================================
   * REQUEST WHATSAPP OTP
   * ==========================================================
   */

  const handleRequestOtp =
    () => {
      setOtpError("");
      setOtpMessage("");

      const normalizedPhone =
        normalizePhone(
          otpPhone,
        );

      /**
       * Minimal validasi frontend.
       *
       * Backend tetap menjadi sumber validasi utama.
       */

      if (
        !/^628\d{8,13}$/.test(
          normalizedPhone,
        )
      ) {
        setOtpError(
          "Masukkan nomor WhatsApp Indonesia yang valid.",
        );

        return;
      }

      if (
        countdown > 0
      ) {
        setOtpError(
          `Silakan tunggu ${formatCountdown(
            countdown,
          )} sebelum meminta OTP lagi.`,
        );

        return;
      }

      startOtpTransition(
        async () => {
          try {
            const result =
              await requestWhatsAppLoginOtp(
                normalizedPhone,
              );

            if (
              !result.success
            ) {
              setOtpError(
                result.message ??
                  "Gagal mengirim OTP.",
              );

              return;
            }

            /**
             * ==============================================
             * SAVE NORMALIZED PHONE
             * ==============================================
             */

            setOtpPhone(
              normalizedPhone,
            );

            /**
             * ==============================================
             * OTP STEP
             * ==============================================
             */

            setOtpStep(
              "otp",
            );

            setOtp("");

            setOtpMessage(
              result.message ??
                "Kode OTP telah dikirim ke WhatsApp Anda.",
            );

            /**
             * ==============================================
             * RESEND COOLDOWN
             * ==============================================
             */

            if (
              result.data
                ?.resendAvailableAt
            ) {
              setResendAvailableAt(
                new Date(
                  result.data.resendAvailableAt,
                ),
              );
            }

            toast.success(
              "OTP WhatsApp telah dikirim.",
            );
          } catch (error) {
            console.error(
              "[LOGIN_FORM_OTP_REQUEST]",
              error,
            );

            setOtpError(
              "Terjadi kesalahan saat mengirim OTP.",
            );
          }
        },
      );
    };

  /**
   * ==========================================================
   * VERIFY WHATSAPP OTP
   * ==========================================================
   */

  const handleVerifyOtp =
    () => {
      setOtpError("");

      const normalizedPhone =
        normalizePhone(
          otpPhone,
        );

      const normalizedOtp =
        otp
          .replace(
            /\D/g,
            "",
          )
          .slice(
            0,
            6,
          );

      if (
        !/^628\d{8,13}$/.test(
          normalizedPhone,
        )
      ) {
        setOtpError(
          "Nomor WhatsApp tidak valid.",
        );

        return;
      }

      if (
        !/^\d{6}$/.test(
          normalizedOtp,
        )
      ) {
        setOtpError(
          "Masukkan 6 digit kode OTP.",
        );

        return;
      }

      startOtpTransition(
        async () => {
          try {
            /**
             * ==================================================
             * AUTH.JS CREDENTIAL LOGIN
             * ==================================================
             *
             * Provider:
             *
             * whatsapp-login-otp
             *
             * credentials:
             *
             * phone
             * otp
             */

            const result =
              await verifyWhatsAppLoginOtp(
                normalizedPhone,
                normalizedOtp,
              );

            /**
             * ==============================================
             * AUTH FAILED
             * ==============================================
             */

            if (!result.success) {
              setOtpError(
                result.message ??
                  "Kode OTP salah, sudah digunakan, atau sudah kedaluwarsa.",
              );

              return;
            }

            /**
             * ==============================================
             * WHATSAPP OTP LOGIN SUCCESS
             * ==============================================
             *
             * Role dikembalikan oleh server action setelah
             * Auth.js berhasil membuat session.
             */

            const role = result.data?.role;
            const hasAddress =
              result.data?.hasAddress === true;

            const destination =
              role === "ADMIN" ||
              role === "SUPER_ADMIN"
                ? callbackUrl ?? "/admin"
                : !hasAddress
                  ? "/customer/addresses/create"
                  : callbackUrl ?? "/customer";

            toast.success(
              "Login berhasil.",
            );

            /**
             * Refresh session Auth.js terlebih dahulu.
             */
            router.refresh();

            /**
             * Beri waktu singkat agar session cookie/state
             * diperbarui sebelum melakukan navigasi.
             */
            setTimeout(() => {
              router.replace(destination);
            }, 50);
          } catch (error) {
            console.error(
              "[LOGIN_FORM_OTP_VERIFY]",
              error,
            );

            setOtpError(
              "Gagal memverifikasi OTP. Silakan coba lagi.",
            );
          }
        },
      );
    };

  /**
   * ==========================================================
   * BACK TO PHONE
   * ==========================================================
   */

  const handleBackToPhone =
    () => {
      if (
        isOtpPending
      ) {
        return;
      }

      setOtpStep(
        "phone",
      );

      setOtp("");

      setOtpError("");

      setOtpMessage("");
    };

  /**
   * ==========================================================
   * AUTH HEADER
   * ==========================================================
   */

  const header =
    (
      <AuthHeader
        title="Masuk ke Pisjo Market"
        description={
          loginMethod ===
          "password"
            ? "Masuk untuk melanjutkan belanja ikan segar."
            : "Masuk cepat menggunakan kode OTP WhatsApp."
        }
      />
    );

  return (
    <AuthCard>
      {header}

      {/* ================================================== */}
      {/* LOGIN METHOD SWITCHER                              */}
      {/* ================================================== */}

      <div
        className="
          mt-6
          grid
          grid-cols-2
          gap-2
          rounded-xl
          bg-slate-100
          p-1
        "
      >
        <button
          type="button"
          onClick={() =>
            switchLoginMethod(
              "password",
            )
          }
          disabled={
            isPasswordPending ||
            isOtpPending
          }
          className={`
            flex
            min-h-11
            items-center
            justify-center
            gap-2
            rounded-lg
            px-3
            text-sm
            font-semibold
            transition-all
            ${
              loginMethod ===
              "password"
                ? `
                  bg-white
                  text-[var(--pisjo-navy)]
                  shadow-sm
                `
                : `
                  text-slate-500
                  hover:text-[var(--pisjo-navy)]
                `
            }
          `}
        >
          <ShieldCheck
            className="h-4 w-4"
            aria-hidden="true"
          />

          Password
        </button>

        <button
          type="button"
          onClick={() =>
            switchLoginMethod(
              "whatsapp",
            )
          }
          disabled={
            isPasswordPending ||
            isOtpPending
          }
          className={`
            flex
            min-h-11
            items-center
            justify-center
            gap-2
            rounded-lg
            px-3
            text-sm
            font-semibold
            transition-all
            ${
              loginMethod ===
              "whatsapp"
                ? `
                  bg-white
                  text-[var(--pisjo-navy)]
                  shadow-sm
                `
                : `
                  text-slate-500
                  hover:text-[var(--pisjo-navy)]
                `
            }
          `}
        >
          <MessageCircle
            className="h-4 w-4"
            aria-hidden="true"
          />

          OTP WhatsApp
        </button>
      </div>

      {/* ================================================== */}
      {/* PASSWORD LOGIN                                     */}
      {/* ================================================== */}

      {loginMethod ===
      "password" ? (
        <form
          onSubmit={handleSubmit(
            onPasswordSubmit,
          )}
          className="mt-6 space-y-5"
          noValidate
        >
          {/* ============================================ */}
          {/* SERVER ERROR                                 */}
          {/* ============================================ */}

          {serverError ? (
            <Alert
              variant="destructive"
            >
              <AlertCircle
                className="h-4 w-4"
              />

              <AlertTitle>
                Login gagal
              </AlertTitle>

              <AlertDescription>
                {serverError}
              </AlertDescription>
            </Alert>
          ) : null}

          {/* ============================================ */}
          {/* EMAIL / PHONE                               */}
          {/* ============================================ */}

          <div className="space-y-2">
            <Label
              htmlFor="login-identifier"
              className="
                text-sm
                font-medium
                text-[var(--pisjo-navy)]
              "
            >
              Email atau Nomor WhatsApp
              <span className="ml-1 text-red-500">
                *
              </span>
            </Label>

            <Input
              id="login-identifier"
              type="text"
              autoComplete="username"
              inputMode="email"
              placeholder="Email atau 08xxxxxxxxxx"
              disabled={
                isPasswordPending
              }
              aria-invalid={Boolean(
                errors.email,
              )}
              {...register(
                "email",
              )}
              className={`
                h-12
                rounded-xl
                border-slate-200
                bg-white
                px-4
                text-base
                shadow-sm
                transition-all
                placeholder:text-slate-400
                focus:border-[var(--pisjo-primary)]
                focus:ring-2
                focus:ring-[rgba(7,136,232,0.18)]
                sm:text-sm
                ${
                  errors.email
                    ? "border-red-300 focus:border-red-500"
                    : ""
                }
              `}
            />

            {errors.email ? (
              <p
                role="alert"
                className="
                  text-sm
                  leading-5
                  text-red-600
                "
              >
                {
                  errors.email
                    .message
                }
              </p>
            ) : null}
          </div>

          {/* ============================================ */}
          {/* PASSWORD                                    */}
          {/* ============================================ */}

          <PasswordField
            label="Password"
            autoComplete="current-password"
            disabled={
              isPasswordPending
            }
            required
            error={
              errors.password
                ?.message
            }
            {...register(
              "password",
            )}
          />

          {/* ============================================ */}
          {/* REMEMBER + FORGOT                           */}
          {/* ============================================ */}

          <div
            className="
              flex
              items-center
              justify-between
              gap-4
            "
          >
            <label
              htmlFor="remember-me"
              className="
                flex
                cursor-pointer
                items-center
                gap-2
                text-sm
                text-slate-600
              "
            >
              <Checkbox
                id="remember-me"
                checked={
                  rememberMe
                }
                onCheckedChange={(
                  checked,
                ) =>
                  setRememberMe(
                    checked ===
                      true,
                  )
                }
                disabled={
                  isPasswordPending
                }
              />

              Ingat saya
            </label>

            <Link
              href="/forgot-password"
              className="
                text-sm
                font-medium
                text-[var(--pisjo-ocean)]
                transition-colors
                hover:underline
              "
            >
              Lupa password?
            </Link>
          </div>

          {/* ============================================ */}
          {/* SUBMIT                                      */}
          {/* ============================================ */}

          <SubmitButton
            text="Masuk"
            loading={
              isPasswordPending
            }
            className="
              h-12
              w-full
              rounded-xl
              text-sm
              font-semibold
            "
          >
            Masuk
          </SubmitButton>

          {/* ============================================ */}
          {/* REGISTER                                    */}
          {/* ============================================ */}

          <div
            className="
              text-center
              text-sm
              text-slate-500
            "
          >
            Belum punya akun?{" "}
            <Link
              href="/register"
              className="
                font-semibold
                text-[var(--pisjo-ocean)]
                hover:underline
              "
            >
              Daftar sekarang
            </Link>
          </div>

          <div className="pt-1">
            <div className="mb-4 flex items-center gap-3 text-xs text-slate-400">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="whitespace-nowrap">Atau masuk dengan</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <SocialAuthButtons
              callbackUrl={callbackUrl ?? "/customer"}
              disabled={isPasswordPending || isOtpPending}
            />
          </div>
        </form>
      ) : (
        /* ================================================== */
        /* WHATSAPP OTP LOGIN                                 */
        /* ================================================== */

        <div className="mt-6 space-y-5">
          {/* ============================================ */}
          {/* OTP ERROR                                   */}
          {/* ============================================ */}

          {otpError ? (
            <Alert
              variant="destructive"
            >
              <AlertCircle
                className="h-4 w-4"
              />

              <AlertTitle>
                Login OTP gagal
              </AlertTitle>

              <AlertDescription>
                {otpError}
              </AlertDescription>
            </Alert>
          ) : null}

          {/* ============================================ */}
          {/* OTP SUCCESS MESSAGE                          */}
          {/* ============================================ */}

          {otpMessage ? (
            <Alert>
              <CheckCircle2
                className="h-4 w-4"
              />

              <AlertTitle>
                OTP terkirim
              </AlertTitle>

              <AlertDescription>
                {otpMessage}
              </AlertDescription>
            </Alert>
          ) : null}

          {/* ============================================ */}
          {/* STEP 1 — PHONE                              */}
          {/* ============================================ */}

          {otpStep ===
          "phone" ? (
            <>
              <div
                className="
                  rounded-xl
                  border
                  border-sky-100
                  bg-sky-50
                  p-4
                "
              >
                <div className="flex gap-3">
                  <div
                    className="
                      flex
                      h-10
                      w-10
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      bg-white
                      text-[var(--pisjo-ocean)]
                      shadow-sm
                    "
                  >
                    <MessageCircle
                      className="h-5 w-5"
                      aria-hidden="true"
                    />
                  </div>

                  <div>
                    <p
                      className="
                        text-sm
                        font-semibold
                        text-[var(--pisjo-navy)]
                      "
                    >
                      Login tanpa password
                    </p>

                    <p
                      className="
                        mt-1
                        text-xs
                        leading-5
                        text-slate-600
                      "
                    >
                      Kami akan mengirim
                      kode OTP 6 digit ke
                      WhatsApp Anda.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="whatsapp-login-phone"
                  className="
                    text-sm
                    font-medium
                    text-[var(--pisjo-navy)]
                  "
                >
                  Nomor WhatsApp
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </Label>

                <Input
                  id="whatsapp-login-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={
                    otpPhone
                  }
                  onChange={(
                    event,
                  ) => {
                    setOtpPhone(
                      event.target.value,
                    );

                    setOtpError(
                      "",
                    );
                  }}
                  disabled={
                    isOtpPending
                  }
                  placeholder="08xxxxxxxxxx"
                  className="
                    h-12
                    rounded-xl
                    border-slate-200
                    bg-white
                    px-4
                    text-base
                    shadow-sm
                    placeholder:text-slate-400
                    focus:border-[var(--pisjo-primary)]
                    focus:ring-2
                    focus:ring-[rgba(7,136,232,0.18)]
                    sm:text-sm
                  "
                />
              </div>

              <button
                type="button"
                onClick={
                  handleRequestOtp
                }
                disabled={
                  isOtpPending ||
                  countdown > 0
                }
                className="
                  flex
                  h-12
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-[var(--pisjo-primary)]
                  px-4
                  text-sm
                  font-semibold
                  text-white
                  shadow-sm
                  transition-all
                  hover:opacity-90
                  focus:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-[var(--pisjo-primary)]
                  focus-visible:ring-offset-2
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                <MessageCircle
                  className="h-4 w-4"
                  aria-hidden="true"
                />

                {isOtpPending
                  ? "Mengirim OTP..."
                  : countdown > 0
                    ? `Tunggu ${formatCountdown(
                        countdown,
                      )}`
                    : "Kirim OTP WhatsApp"}
              </button>
            </>
          ) : (
            /* ============================================ */
            /* STEP 2 — OTP                               */
            /* ============================================ */

            <>
              <div
                className="
                  rounded-xl
                  border
                  border-slate-200
                  bg-slate-50
                  p-4
                "
              >
                <div
                  className="
                    flex
                    items-start
                    justify-between
                    gap-3
                  "
                >
                  <div>
                    <p
                      className="
                        text-xs
                        font-medium
                        text-slate-500
                      "
                    >
                      OTP dikirim ke
                    </p>

                    <p
                      className="
                        mt-1
                        text-sm
                        font-semibold
                        text-[var(--pisjo-navy)]
                      "
                    >
                      +{otpPhone}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={
                      handleBackToPhone
                    }
                    disabled={
                      isOtpPending
                    }
                    className="
                      inline-flex
                      items-center
                      gap-1
                      text-xs
                      font-semibold
                      text-[var(--pisjo-ocean)]
                      hover:underline
                      disabled:opacity-50
                    "
                  >
                    <ArrowLeft
                      className="h-3.5 w-3.5"
                      aria-hidden="true"
                    />

                    Ganti nomor
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="whatsapp-login-otp"
                  className="
                    text-sm
                    font-medium
                    text-[var(--pisjo-navy)]
                  "
                >
                  Kode OTP
                </Label>

                <Input
                  id="whatsapp-login-otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otp}
                  onChange={(
                    event,
                  ) => {
                    const value =
                      event.target.value
                        .replace(
                          /\D/g,
                          "",
                        )
                        .slice(
                          0,
                          6,
                        );

                    setOtp(
                      value,
                    );

                    setOtpError(
                      "",
                    );

                    /**
                     * Auto verify setelah 6 digit.
                     *
                     * Tidak dilakukan di sini karena state React
                     * belum tentu sudah ter-update ketika function
                     * dipanggil. User tetap menekan tombol login.
                     */
                  }}
                  disabled={
                    isOtpPending
                  }
                  placeholder="000000"
                  className="
                    h-14
                    rounded-xl
                    border-slate-200
                    bg-white
                    px-4
                    text-center
                    text-2xl
                    font-semibold
                    tracking-[0.5em]
                    shadow-sm
                    placeholder:text-slate-300
                    focus:border-[var(--pisjo-primary)]
                    focus:ring-2
                    focus:ring-[rgba(7,136,232,0.18)]
                  "
                />

                <p
                  className="
                    text-center
                    text-xs
                    leading-5
                    text-slate-500
                  "
                >
                  Masukkan 6 digit kode
                  yang dikirim ke WhatsApp
                  Anda.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  handleVerifyOtp
                }
                disabled={
                  isOtpPending ||
                  otp.length !== 6
                }
                className="
                  flex
                  h-12
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-[var(--pisjo-primary)]
                  px-4
                  text-sm
                  font-semibold
                  text-white
                  shadow-sm
                  transition-all
                  hover:opacity-90
                  focus:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-[var(--pisjo-primary)]
                  focus-visible:ring-offset-2
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                {isOtpPending
                  ? "Memverifikasi..."
                  : "Verifikasi & Masuk"}

                {!isOtpPending ? (
                  <ArrowRight
                    className="h-4 w-4"
                    aria-hidden="true"
                  />
                ) : null}
              </button>

              {/* ======================================== */}
              {/* RESEND                                   */}
              {/* ======================================== */}

              <div
                className="
                  text-center
                  text-sm
                "
              >
                {countdown > 0 ? (
                  <p className="text-slate-500">
                    Kirim ulang OTP dalam{" "}
                    <span className="font-semibold text-[var(--pisjo-navy)]">
                      {formatCountdown(
                        countdown,
                      )}
                    </span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={
                      handleRequestOtp
                    }
                    disabled={
                      isOtpPending
                    }
                    className="
                      font-semibold
                      text-[var(--pisjo-ocean)]
                      hover:underline
                      disabled:opacity-50
                    "
                  >
                    Kirim ulang OTP
                  </button>
                )}
              </div>
            </>
          )}

          {/* ============================================ */}
          {/* REGISTER                                    */}
          {/* ============================================ */}

          <div className="pt-1">
            <div className="mb-4 flex items-center gap-3 text-xs text-slate-400">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="whitespace-nowrap">Atau masuk dengan</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <SocialAuthButtons
              callbackUrl={callbackUrl ?? "/customer"}
              disabled={isPasswordPending || isOtpPending}
            />
          </div>

          <div
            className="
              pt-1
              text-center
              text-sm
              text-slate-500
            "
          >
            Belum punya akun?{" "}
            <Link
              href="/register"
              className="
                font-semibold
                text-[var(--pisjo-ocean)]
                hover:underline
              "
            >
              Daftar sekarang
            </Link>
          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* SECURITY NOTE                                      */}
      {/* ================================================== */}

      <div
        className="
          mt-6
          flex
          items-start
          gap-2
          rounded-lg
          bg-slate-50
          px-3
          py-2.5
          text-xs
          leading-5
          text-slate-500
        "
      >
        <ShieldCheck
          className="
            mt-0.5
            h-4
            w-4
            shrink-0
            text-[var(--pisjo-ocean)]
          "
          aria-hidden="true"
        />

        <span>
          Login Anda dilindungi dengan
          autentikasi aman Pisjo Market.
        </span>
      </div>
    </AuthCard>
  );
}