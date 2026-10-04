import WapiCustomerAuditRepository from "@/repositories/notification/wapi-customer-audit.repository";
import { parseWapiCustomerError } from "@/services/notification/wapi-customer-error";

export type WapiCustomerAuditAction =
  | "SETTINGS_UPDATED"
  | "DELIVERY_RETRY";

export class WapiCustomerAuditService {
  static async logSettingsChange(input: {
    actorId: string;
    settingKey: string;
    previousValue: boolean;
    newValue: boolean;
  }) {
    if (input.previousValue === input.newValue) {
      return null;
    }

    return WapiCustomerAuditRepository.create({
      actorId: input.actorId,
      action: "SETTINGS_UPDATED",
      settingKey: input.settingKey,
      previousValue: input.previousValue,
      newValue: input.newValue,
    });
  }

  static async logDeliveryRetry(input: {
    actorId: string;
    deliveryId: string;
    eventType: string;
    fromStatus: string;
    toStatus: string;
    attempts?: number;
    result?: string;
  }) {
    return WapiCustomerAuditRepository.create({
      actorId: input.actorId,
      deliveryId: input.deliveryId,
      action: "DELIVERY_RETRY",
      eventType: input.eventType,
      fromStatus: input.fromStatus,
      toStatus: input.toStatus,
      metadata: {
        attempts: input.attempts ?? null,
        result: input.result ?? null,
        errorCode: parseWapiCustomerError(input.result)?.code ?? null,
        retryable: parseWapiCustomerError(input.result)?.retryable ?? null,
      },
    });
  }

  static async getRecent(limit = 20) {
    return WapiCustomerAuditRepository.findRecent(limit);
  }
}

export default WapiCustomerAuditService;
