const DEFAULT_GATEWAY_URL = "http://127.0.0.1:5570";

function getRequiredApiKey(): string {
  const apiKey = process.env.WHATSAPP_GATEWAY_API_KEY?.trim();

  if (!apiKey) {
    throw new Error(
      "WHATSAPP_GATEWAY_API_KEY is not configured.",
    );
  }

  return apiKey;
}

export function getWhatsAppConfig() {
  return {
    gatewayUrl:
      process.env.WHATSAPP_GATEWAY_URL?.trim() ||
      DEFAULT_GATEWAY_URL,
    apiKey: getRequiredApiKey(),
    timeoutMs: Number(
      process.env.WHATSAPP_GATEWAY_TIMEOUT_MS || 10000,
    ),
  };
}
