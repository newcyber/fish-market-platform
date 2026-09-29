"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, MessageCircle, ShieldCheck } from "lucide-react";

import {
  requestWhatsAppRegistrationOtp,
  verifyWhatsAppRegistrationOtp,
} from "@/actions/auth/whatsapp-register";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { SubmitButton } from "@/components/auth/SubmitButton";

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

function formatCountdown(seconds: number) {
  const safeSeconds = Math.max(seconds, 0);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${minutes}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;
}

export default function RegisterForm() {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendAvailableAt, setResendAvailableAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!resendAvailableAt) {
      return;
    }

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resendAvailableAt]);

  const resendSeconds = useMemo(() => {
    if (!resendAvailableAt) {
      return 0;
    }

    return Math.max(
      0,
      Math.ceil((resendAvailableAt - now) / 1000),
    );
  }, [now, resendAvailableAt]);

  const handleRequestOtp = async () => {
    const digits = normalizePhone(phone);

    if (!/^08\d{8,13}$/.test(digits) && !/^62\d{9,14}$/.test(digits)) {
      toast.error("Masukkan nomor WhatsApp Indonesia yang valid.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await requestWhatsAppRegistrationOtp(digits);

      if (!result.success) {
        toast.error(result.message ?? "Gagal mengirim OTP.");
        return;
      }

      const normalizedPhone = result.data?.phone ?? digits;

      setPhone(normalizedPhone);
      setStep("otp");
      setResendAvailableAt(
        result.data?.resendAvailableAt
          ? new Date(result.data.resendAvailableAt).getTime()
          : Date.now() + 60_000,
      );
      setNow(Date.now());
      setOtp("");
      toast.success("OTP telah dikirim ke WhatsApp Anda.");
    } catch (error) {
      console.error("[REGISTER_REQUEST_OTP]", error);
      toast.error("Gagal mengirim OTP. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!/^\d{6}$/.test(otp.replace(/\s/g, ""))) {
      toast.error("Masukkan kode OTP 6 digit.");
      return;
    }

    if (name.trim().length < 3) {
      toast.error("Masukkan nama lengkap Anda.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await verifyWhatsAppRegistrationOtp(
        phone,
        otp,
        name,
      );

      if (!result.success) {
        toast.error(result.message ?? "Verifikasi OTP gagal.");
        return;
      }

      toast.success("Akun Pisjo Market berhasil dibuat.");

      const destination =
        result.data?.role === "CUSTOMER"
          ? result.data.hasAddress
            ? "/customer"
            : "/customer/addresses/create"
          : "/";

      window.location.assign(destination);
    } catch (error) {
      console.error("[REGISTER_VERIFY_OTP]", error);
      toast.error("Gagal memverifikasi OTP. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resendSeconds > 0 || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await requestWhatsAppRegistrationOtp(phone);

      if (!result.success) {
        toast.error(result.message ?? "Gagal mengirim ulang OTP.");

        if (result.data?.retryAfterSeconds) {
          setResendAvailableAt(
            Date.now() + result.data.retryAfterSeconds * 1000,
          );
          setNow(Date.now());
        }

        return;
      }

      setResendAvailableAt(
        result.data?.resendAvailableAt
          ? new Date(result.data.resendAvailableAt).getTime()
          : Date.now() + 60_000,
      );
      setNow(Date.now());
      setOtp("");
      toast.success("OTP baru telah dikirim.");
    } catch (error) {
      console.error("[REGISTER_RESEND_OTP]", error);
      toast.error("Gagal mengirim ulang OTP.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (isSubmitting) {
      return;
    }

    setStep("phone");
    setOtp("");
    setName("");
  };

  return (
    <AuthCard>
      <AuthHeader
        title="Daftar"
        description={
          step === "phone"
            ? "Buat akun Pisjo Market dengan nomor WhatsApp Anda."
            : "Verifikasi WhatsApp untuk menyelesaikan pendaftaran."
        }
      />

      {step === "phone" ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleRequestOtp();
          }}
          className="space-y-5"
          noValidate
        >
          <div className="space-y-2">
            <label
              htmlFor="register-phone"
              className="text-sm font-medium text-[var(--pisjo-navy)]"
            >
              Nomor Handphone
              <span className="ml-1 text-red-500">*</span>
            </label>

            <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm focus-within:border-[var(--pisjo-primary)] focus-within:ring-4 focus-within:ring-[var(--pisjo-primary)]/10">
              <div className="flex h-12 items-center border-r border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-600">
                +62
              </div>

              <input
                id="register-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                autoFocus
                placeholder="81234567890"
                value={phone.replace(/^0/, "")}
                onChange={(event) => {
                  const digits = normalizePhone(event.target.value);
                  setPhone(
                    digits.startsWith("62")
                      ? `0${digits.slice(2)}`
                      : digits.startsWith("8")
                        ? `0${digits}`
                        : digits,
                  );
                }}
                disabled={isSubmitting}
                className="h-12 min-w-0 flex-1 border-0 bg-transparent px-4 text-base text-slate-900 outline-none placeholder:text-slate-400"
              />
            </div>

            <p className="text-xs leading-5 text-slate-500">
              Kode verifikasi akan dikirim melalui WhatsApp.
            </p>
          </div>

          <SubmitButton
            loading={isSubmitting}
            text="Lanjut"
            loadingText="Mengirim OTP..."
          />

          <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--pisjo-primary)]" />
            <span>
              Data Anda dilindungi dan nomor WhatsApp digunakan untuk
              verifikasi akun.
            </span>
          </div>

          <p className="text-center text-sm text-slate-500">
            Sudah punya akun?{" "}
            <Link
              href="/login"
              className="font-semibold text-[var(--pisjo-primary)] hover:underline"
            >
              Masuk sekarang
            </Link>
          </p>
        </form>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleVerifyOtp();
          }}
          className="space-y-5"
          noValidate
        >
          <button
            type="button"
            onClick={handleBack}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-[var(--pisjo-primary)] disabled:opacity-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Ganti nomor
          </button>

          <div className="rounded-2xl border border-[var(--pisjo-primary)]/15 bg-[var(--pisjo-primary)]/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--pisjo-primary)]/10 text-[var(--pisjo-primary)]">
                <MessageCircle className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p className="text-xs text-slate-500">OTP dikirim ke</p>
                <p className="truncate text-sm font-semibold text-slate-900">
                  +{phone.replace(/^0/, "62")}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="register-name"
              className="text-sm font-medium text-[var(--pisjo-navy)]"
            >
              Nama Lengkap
              <span className="ml-1 text-red-500">*</span>
            </label>

            <input
              id="register-name"
              type="text"
              autoComplete="name"
              placeholder="Masukkan nama lengkap"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={isSubmitting}
              className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-[var(--pisjo-primary)] focus:ring-4 focus:ring-[var(--pisjo-primary)]/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="register-otp"
              className="text-sm font-medium text-[var(--pisjo-navy)]"
            >
              Kode OTP
              <span className="ml-1 text-red-500">*</span>
            </label>

            <input
              id="register-otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              autoFocus
              placeholder="000000"
              value={otp}
              onChange={(event) =>
                setOtp(
                  event.target.value
                    .replace(/\D/g, "")
                    .slice(0, 6),
                )
              }
              disabled={isSubmitting}
              className="h-14 w-full rounded-xl border border-slate-200 bg-white px-4 text-center text-2xl font-bold tracking-[0.45em] text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-300 focus:border-[var(--pisjo-primary)] focus:ring-4 focus:ring-[var(--pisjo-primary)]/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60"
            />
          </div>

          <SubmitButton
            loading={isSubmitting}
            text="Verifikasi & Buat Akun"
            loadingText="Memverifikasi..."
          />

          <div className="text-center text-sm text-slate-500">
            {resendSeconds > 0 ? (
              <span>
                Kirim ulang OTP dalam{" "}
                <strong className="text-slate-700">
                  {formatCountdown(resendSeconds)}
                </strong>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => void handleResend()}
                disabled={isSubmitting}
                className="font-semibold text-[var(--pisjo-primary)] hover:underline disabled:opacity-50"
              >
                Kirim ulang OTP
              </button>
            )}
          </div>

          <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--pisjo-primary)]" />
            <span>
              Jangan bagikan kode OTP kepada siapa pun, termasuk pihak yang
              mengaku sebagai Pisjo Market.
            </span>
          </div>

          <p className="text-center text-sm text-slate-500">
            Butuh bantuan?{" "}
            <Link
              href="/login"
              className="inline-flex items-center gap-1 font-semibold text-[var(--pisjo-primary)] hover:underline"
            >
              Kembali ke login
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </p>
        </form>
      )}
    </AuthCard>
  );
}
