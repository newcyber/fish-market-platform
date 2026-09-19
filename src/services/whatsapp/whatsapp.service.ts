import {
  getWhatsAppConfig,
} from "./whatsapp.config";

import type {
  WhatsAppHealthResponse,
  WhatsAppMessageResponse,
  WhatsAppSendTextInput,
  WhatsAppSendTextResult,
  WhatsAppStatus,
  WhatsAppStatusResponse,
} from "./whatsapp.types";

class WhatsAppService {
  private normalizePhone(phone: string): string {
    let normalized = phone.replace(/\D/g, "");

    if (normalized.startsWith("0")) {
      normalized = `62${normalized.slice(1)}`;
    }

    if (normalized.startsWith("8")) {
      normalized = `62${normalized}`;
    }

    if (!normalized.startsWith("62")) {
      throw new Error(
        "Invalid WhatsApp phone number. Use Indonesian format such as 628xxxxxxxxxx.",
      );
    }

    if (normalized.length < 10 || normalized.length > 15) {
      throw new Error("Invalid WhatsApp phone number length.");
    }

    return normalized;
  }

  private async request<T>(
    path: string,
    init?: RequestInit,
  ): Promise<T> {
    const config = getWhatsAppConfig();

    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, config.timeoutMs);

    try {
      const response = await fetch(
        `${config.gatewayUrl}${path}`,
        {
          ...init,
          signal: controller.signal,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.apiKey}`,
            ...(init?.headers || {}),
          },
        },
      );

      const body = await response.text();

      let parsed: unknown;

      try {
        parsed = body ? JSON.parse(body) : null;
      } catch {
        throw new Error(
          `WhatsApp gateway returned invalid JSON. HTTP ${response.status}.`,
        );
      }

      if (!response.ok) {
        const errorMessage =
          typeof parsed === "object" &&
          parsed !== null &&
          "error" in parsed &&
          typeof parsed.error === "string"
            ? parsed.error
            : `WhatsApp gateway HTTP ${response.status}.`;

        throw new Error(errorMessage);
      }

      return parsed as T;
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === "AbortError"
      ) {
        throw new Error(
          `WhatsApp gateway request timed out after ${config.timeoutMs}ms.`,
        );
      }

      if (error instanceof Error) {
        throw error;
      }

      throw new Error(
        "Unknown WhatsApp gateway error.",
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  async health(): Promise<WhatsAppHealthResponse> {
    return this.request<WhatsAppHealthResponse>(
      "/api/v1/health",
    );
  }

  async getStatus(): Promise<WhatsAppStatus> {
    const response =
      await this.request<WhatsAppStatusResponse>(
        "/api/v1/status",
      );

    if (!response.success || !response.data) {
      throw new Error(
        response.error ||
          "Unable to retrieve WhatsApp gateway status.",
      );
    }

    return response.data;
  }

  async sendText(
    input: WhatsAppSendTextInput,
  ): Promise<WhatsAppSendTextResult> {
    const phone = this.normalizePhone(input.phone);
    const message = input.message.trim();

    if (!message) {
      throw new Error(
        "WhatsApp message cannot be empty.",
      );
    }

    const response =
      await this.request<WhatsAppMessageResponse>(
        "/api/v1/messages/text",
        {
          method: "POST",
          body: JSON.stringify({
            phone,
            message,
          }),
        },
      );

    if (
      !response.success ||
      !response.data?.messageId ||
      !response.data.jid
    ) {
      throw new Error(
        response.error ||
          "WhatsApp gateway failed to send the message.",
      );
    }

    return {
      messageId: response.data.messageId,
      jid: response.data.jid,
    };
  }
}

export const whatsappService = new WhatsAppService();
