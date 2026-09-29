import crypto from "node:crypto";

import { Role } from "@prisma/client";

import CustomerService from "@/services/customer/customer.service";
import { EmailVerificationOtpRepository } from "@/repositories/email-verification-otp.repository";
import { UserRepository } from "@/repositories/user.repository";
import { whatsappService } from "@/services/whatsapp/whatsapp.service";

const OTP_LENGTH = 6;
const OTP_EXPIRES_IN_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;

const PENDING_NAME = "Pelanggan Pisjo Market";
const INTERNAL_EMAIL_DOMAIN = "customer.pisjo.local";

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("62")) {
    const local = `0${digits.slice(2)}`;

    if (/^08\d{8,13}$/.test(local)) {
      return local;
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

function buildInternalEmail(phone: string): string {
  return `${phone.replace(/\D/g, "")}@${INTERNAL_EMAIL_DOMAIN}`;
}

function buildInternalPassword(): string {
  return crypto.randomBytes(32).toString("base64url");
}

function generateOtp(): string {
  const min = 10 ** (OTP_LENGTH - 1);
  const max = 10 ** OTP_LENGTH;

  return crypto.randomInt(min, max).toString();
}

function hashOtp(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

function verifyOtpHash(otp: string, storedHash: string): boolean {
  const incoming = Buffer.from(hashOtp(otp), "hex");
  const stored = Buffer.from(storedHash, "hex");

  if (incoming.length !== stored.length) {
    return false;
  }

  return crypto.timingSafeEqual(incoming, stored);
}

function getExpirationDate(): Date {
  const expiresAt = new Date();

  expiresAt.setMinutes(
    expiresAt.getMinutes() + OTP_EXPIRES_IN_MINUTES,
  );

  return expiresAt;
}

export interface WhatsAppRegistrationRequestResult {
  phone: string;
  resendAvailableAt: Date;
}

export class WhatsAppRegistrationOtpService {
  static normalizePhone(phone: string): string {
    return normalizePhone(phone);
  }

  static async request(
    phoneInput: string,
  ): Promise<WhatsAppRegistrationRequestResult> {
    const phone = normalizePhone(phoneInput);

    let user = await UserRepository.findByPhone(phone);

    if (user) {
      if (user.role !== Role.CUSTOMER) {
        throw new Error("PHONE_ALREADY_USED");
      }

      if (user.emailVerified) {
        throw new Error("ACCOUNT_ALREADY_EXISTS");
      }
    }

    /*
     * Jangan membuat OTP baru kalau masih berada dalam
     * cooldown resend.
     */
    if (user) {
      const latestOtp =
        await EmailVerificationOtpRepository.findLatestByUserId(
          user.id,
        );

      if (latestOtp) {
        const cooldownUntil =
          latestOtp.createdAt.getTime() +
          RESEND_COOLDOWN_SECONDS * 1000;

        if (cooldownUntil > Date.now()) {
          const retryAfterSeconds = Math.ceil(
            (cooldownUntil - Date.now()) / 1000,
          );

          throw new Error(
            `OTP_RESEND_COOLDOWN:${retryAfterSeconds}`,
          );
        }
      }
    }

    /*
     * Customer baru dibuat sebagai pending.
     */
    if (!user) {
      user = await CustomerService.createCustomer({
        name: PENDING_NAME,
        email: buildInternalEmail(phone),
        password: buildInternalPassword(),
        phone,
        role: Role.CUSTOMER,
        isActive: false,
      });
    }

    const otp = generateOtp();
    const codeHash = hashOtp(otp);
    const expiresAt = getExpirationDate();

    /*
     * OTP sebelumnya dibuat tidak valid dan OTP baru
     * disimpan dalam satu transaction.
     */
    await EmailVerificationOtpRepository.invalidateActiveByUserId(
      user.id,
    );

    await EmailVerificationOtpRepository.create({
      user: {
        connect: {
          id: user.id,
        },
      },
      codeHash,
      expiresAt,
    });

try {
  const whatsappResult = await whatsappService.sendText({
    phone: toWhatsAppPhone(phone),
    message:
      `Kode OTP Pisjo Market: ${otp}\n\n` +
      `Kode berlaku selama ${OTP_EXPIRES_IN_MINUTES} menit. ` +
      `Jangan bagikan kode ini kepada siapa pun.`,
  });

  console.log(
    "[WHATSAPP_REGISTER_SEND_RESULT]",
    whatsappResult,
  );
} catch (error) {
  console.error(
    "[WHATSAPP_REGISTER_SEND_FAILED]",
    error instanceof Error
      ? error.message
      : error,
  );

  const activeOtp =
    await EmailVerificationOtpRepository.findLatestActiveByUserId(
      user.id,
    );

  if (activeOtp) {
    await EmailVerificationOtpRepository.markAsUsed(
      activeOtp.id,
    );
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

  static async verifyAndActivate(
    phoneInput: string,
    otp: string,
    name: string,
  ) {
    const phone = normalizePhone(phoneInput);
    const normalizedOtp = otp.trim().replace(/\s/g, "");
    const normalizedName = name.trim();

    if (!/^\d{6}$/.test(normalizedOtp)) {
      throw new Error("INVALID_OTP_FORMAT");
    }

    if (normalizedName.length < 3) {
      throw new Error("INVALID_NAME");
    }

    const user = await UserRepository.findByPhone(phone);

    if (!user || user.role !== Role.CUSTOMER) {
      throw new Error("ACCOUNT_NOT_FOUND");
    }

    if (user.emailVerified) {
      throw new Error("ACCOUNT_ALREADY_EXISTS");
    }

    const verificationOtp =
      await EmailVerificationOtpRepository.findLatestActiveByUserId(
        user.id,
      );

    if (!verificationOtp) {
      throw new Error("OTP_NOT_FOUND_OR_EXPIRED");
    }

    if (verificationOtp.attempts >= MAX_ATTEMPTS) {
      await EmailVerificationOtpRepository.markAsUsed(
        verificationOtp.id,
      );

      throw new Error("OTP_MAX_ATTEMPTS_EXCEEDED");
    }

    const isValid = verifyOtpHash(
      normalizedOtp,
      verificationOtp.codeHash,
    );

    if (!isValid) {
      const updatedOtp =
        await EmailVerificationOtpRepository.incrementAttempts(
          verificationOtp.id,
        );

      if (updatedOtp.attempts >= MAX_ATTEMPTS) {
        await EmailVerificationOtpRepository.markAsUsed(
          verificationOtp.id,
        );

        throw new Error("OTP_MAX_ATTEMPTS_EXCEEDED");
      }

      throw new Error("INVALID_OTP");
    }

    await EmailVerificationOtpRepository.markAsUsed(
      verificationOtp.id,
    );

    return UserRepository.update(user.id, {
      name: normalizedName,
      isActive: true,
      emailVerified: new Date(),
    });
  }
}

export default WhatsAppRegistrationOtpService;