export type WapiCustomerErrorCode =
  | "NETWORK_ERROR"
  | "TIMEOUT"
  | "PROVIDER_4XX"
  | "PROVIDER_5XX"
  | "RATE_LIMIT"
  | "AUTH_ERROR"
  | "INVALID_PHONE"
  | "UNKNOWN";

export interface ClassifiedWapiCustomerError {
  code: WapiCustomerErrorCode;
  retryable: boolean;
  message: string;
}

export function classifyWapiCustomerError(error: unknown): ClassifiedWapiCustomerError {
  const message = error instanceof Error ? error.message : String(error ?? "Unknown WhatsApp gateway error.");
  const normalized = message.trim();
  const lower = normalized.toLowerCase();
  const statusCode =
    error &&
    typeof error === "object" &&
    "statusCode" in error &&
    typeof error.statusCode === "number"
      ? error.statusCode
      : null;

  if (statusCode === 401 || statusCode === 403 || /unauthori[sz]ed|forbidden|invalid.*api.?key|api.?key.*invalid|token.*invalid|authentication|authorization/i.test(lower)) {
    return { code: "AUTH_ERROR", retryable: false, message: normalized };
  }

  if (statusCode === 429 || /rate.?limit|too many requests|throttl/i.test(lower)) {
    return { code: "RATE_LIMIT", retryable: true, message: normalized };
  }

  if (/invalid.*phone|invalid.*number|not.*valid.*whatsapp|not registered|unregistered|recipient.*not found|number.*not found|user.*not found/i.test(lower)) {
    return { code: "INVALID_PHONE", retryable: false, message: normalized };
  }

  if (/timed out|timeout|request timed out|abort(ed)?/i.test(lower)) {
    return { code: "TIMEOUT", retryable: true, message: normalized };
  }

  if (statusCode !== null && statusCode >= 500 && statusCode <= 599) {
    return { code: "PROVIDER_5XX", retryable: true, message: normalized };
  }

  if (statusCode !== null && statusCode >= 400 && statusCode <= 499) {
    return { code: "PROVIDER_4XX", retryable: false, message: normalized };
  }

  if (/fetch failed|network|econnreset|econnrefused|enotfound|socket|connection reset|connection refused|dns/i.test(lower)) {
    return { code: "NETWORK_ERROR", retryable: true, message: normalized };
  }

  return { code: "UNKNOWN", retryable: false, message: normalized || "Unknown WhatsApp gateway error." };
}

export function formatWapiCustomerError(classified: ClassifiedWapiCustomerError): string {
  return `[${classified.code}] ${classified.message}`;
}

export function parseWapiCustomerError(errorMessage: string | null | undefined): ClassifiedWapiCustomerError | null {
  const value = errorMessage?.trim();
  if (!value) return null;

  const match = value.match(/^\[([A-Z_]+)\]\s*(.*)$/);
  if (!match) {
    return classifyWapiCustomerError(new Error(value));
  }

  const code = match[1] as WapiCustomerErrorCode;
  const message = match[2] || value;
  const retryable = code === "NETWORK_ERROR" || code === "TIMEOUT" || code === "PROVIDER_5XX" || code === "RATE_LIMIT";
  return { code, retryable, message };
}
