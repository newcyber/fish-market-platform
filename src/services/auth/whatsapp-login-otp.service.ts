import crypto from "node:crypto";

import { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { EmailVerificationOtpRepository } from "@/repositories/email-verification-otp.repository";
import { UserRepository } from "@/repositories/user.repository";
import { whatsappService } from "@/services/whatsapp/whatsapp.service";

const OTP_LENGTH = 6;
const OTP_EXPIRES_IN_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("62")) {
    const localPhone = `0${digits.slice(2)}`;

    if (/^08\d{8,13}$/.test(localPhone)) {
      return localPhone;
    }
  }

  if (/^08\d{8,13}$/.test(digits)) {
    return digits;
  }

  if (/^8\d{8,13}$/.test(digits)) {
    return `0${digits}`;
  }

  throw new Error("INVALID_PHONE");
}

function toWhatsAppPhone(phone: string): string {
  return normalizePhone(phone).replace(/^0/, "62");
}

function generateOtp(): string {
  return crypto
    .randomInt(
      10 ** (OTP_LENGTH - 1),
      10 ** OTP_LENGTH,
    )
    .toString();
}

function hashOtp(otp: string): string {
  return crypto
    .createHash("sha256")
    .update(otp)
    .digest("hex");
}

function verifyOtpHash(
  otp: string,
  storedHash: string,
): boolean {
  const incomingHash = hashOtp(otp);
  const incomingBuffer = Buffer.from(incomingHash, "hex");
  const storedBuffer = Buffer.from(storedHash, "hex");

  if (incomingBuffer.length !== storedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    incomingBuffer,
    storedBuffer,
  );
}

function getExpirationDate(): Date {
  return new Date(
    Date.now() +
      OTP_EXPIRES_IN_MINUTES * 60 * 1000,
  );
}

function isWhatsAppLoginRole(role: Role): boolean {
  return (
    role === Role.CUSTOMER ||
    role === Role.ADMIN ||
    role === Role.SUPER_ADMIN
  );
}

export interface WhatsAppLoginRequestResult {
  phone: string;
  resendAvailableAt: Date;
}

export class WhatsAppLoginOtpService {
  /**
   * Request OTP login untuk customer, admin, dan super admin.
   */
  static async request(
    phoneInput: string,
  ): Promise<WhatsAppLoginRequestResult> {
    const phone = normalizePhone(phoneInput);

    const user = await UserRepository.findByPhone(phone);

    if (
      !user ||
      !user.isActive ||
      !isWhatsAppLoginRole(user.role)
    ) {
      throw new Error("ACCOUNT_NOT_FOUND");
    }

    if (!user.emailVerified) {
      throw new Error("ACCOUNT_NOT_VERIFIED");
    }

    const latestOtp =
      await EmailVerificationOtpRepository.findLatestByUserId(
        user.id,
      );

    if (latestOtp && !latestOtp.usedAt) {
      const cooldownUntil =
        latestOtp.createdAt.getTime() +
        RESEND_COOLDOWN_SECONDS * 1000;
      const remainingMs = cooldownUntil - Date.now();

      if (remainingMs > 0) {
        const retryAfterSeconds = Math.ceil(
          remainingMs / 1000,
        );

        throw new Error(
          `OTP_RESEND_COOLDOWN:${retryAfterSeconds}`,
        );
      }
    }

    const otp = generateOtp();
    const codeHash = hashOtp(otp);
    const expiresAt = getExpirationDate();

    let otpRecordId: string | null = null;

    await prisma.$transaction(async (tx) => {
      await EmailVerificationOtpRepository.invalidateActiveByUserId(
        user.id,
        tx,
      );

      const created =
        await EmailVerificationOtpRepository.create(
          {
            user: {
              connect: {
                id: user.id,
              },
            },
            codeHash,
            expiresAt,
          },
          tx,
        );

      otpRecordId = created.id;
    });

    try {
      await whatsappService.sendText({
        phone: toWhatsAppPhone(phone),
        message:
          `Kode login Pisjo Market: ${otp}\n\n` +
          `Kode berlaku selama ${OTP_EXPIRES_IN_MINUTES} menit.\n` +
          `Jangan bagikan kode ini kepada siapa pun.`,
      });
    } catch (error) {
      console.error(
        "[WHATSAPP_LOGIN_SEND_FAILED]",
        error,
      );

      if (otpRecordId) {
        try {
          await EmailVerificationOtpRepository.markAsUsed(
            otpRecordId,
          );
        } catch (cleanupError) {
          console.error(
            "[WHATSAPP_LOGIN_OTP_CLEANUP_FAILED]",
            cleanupError,
          );
        }
      }

      throw new Error("WHATSAPP_SEND_FAILED");
    }

    return {
      phone,
      resendAvailableAt: new Date(
        Date.now() + RESEND_COOLDOWN_SECONDS * 1000,
      ),
    };
  }

  /**
   * Verify OTP login untuk customer, admin, dan super admin.
   */
  static async verify(
    phoneInput: string,
    otpInput: string,
  ) {
    const phone = normalizePhone(phoneInput);
    const otp = otpInput.trim().replace(/\s/g, "");

    if (!/^\d{6}$/.test(otp)) {
      throw new Error("INVALID_OTP_FORMAT");
    }

    const user = await UserRepository.findByPhone(phone);

    if (
      !user ||
      !user.isActive ||
      !isWhatsAppLoginRole(user.role)
    ) {
      throw new Error("ACCOUNT_NOT_FOUND");
    }

    if (!user.emailVerified) {
      throw new Error("ACCOUNT_NOT_VERIFIED");
    }

    const loginOtp =
      await EmailVerificationOtpRepository.findLatestActiveByUserId(
        user.id,
      );

    if (!loginOtp) {
      throw new Error("OTP_NOT_FOUND_OR_EXPIRED");
    }

    if (loginOtp.attempts >= MAX_ATTEMPTS) {
      await EmailVerificationOtpRepository.markAsUsed(
        loginOtp.id,
      );

      throw new Error("OTP_MAX_ATTEMPTS_EXCEEDED");
    }

    const valid = verifyOtpHash(
      otp,
      loginOtp.codeHash,
    );

    if (!valid) {
      const updated =
        await EmailVerificationOtpRepository.incrementAttempts(
          loginOtp.id,
        );

      if (updated.attempts >= MAX_ATTEMPTS) {
        await EmailVerificationOtpRepository.markAsUsed(
          loginOtp.id,
        );

        throw new Error("OTP_MAX_ATTEMPTS_EXCEEDED");
      }

      throw new Error("INVALID_OTP");
    }

    await EmailVerificationOtpRepository.markAsUsed(
      loginOtp.id,
    );

    return user;
  }

  static normalizePhone(phone: string): string {
    return normalizePhone(phone);
  }
}

export default WhatsAppLoginOtpService;
