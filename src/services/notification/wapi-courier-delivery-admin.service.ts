import { WapiDeliveryStatus } from "@prisma/client";

import {
  WapiCourierDeliveryAdminFilters,
  WapiCourierDeliveryRepository,
} from "@/repositories/notification/wapi-courier-delivery.repository";
import WapiCourierDeliveryService from "@/services/notification/wapi-courier-delivery.service";

export class WapiCourierDeliveryAdminService {
  static async getList(
    filters: WapiCourierDeliveryAdminFilters = {},
  ) {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(100, Math.max(1, filters.limit ?? 20));

    const normalized = { ...filters, page, limit };

    const [items, total, statusRows] = await Promise.all([
      WapiCourierDeliveryRepository.findMany(normalized),
      WapiCourierDeliveryRepository.count(normalized),
      WapiCourierDeliveryRepository.statusCounts({
        search: normalized.search,
        eventType: normalized.eventType,
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      statusCounts: statusRows,
    };
  }

  static parseStatus(value?: string): WapiDeliveryStatus | undefined {
    if (!value) return undefined;

    return Object.values(WapiDeliveryStatus).includes(
      value as WapiDeliveryStatus,
    )
      ? (value as WapiDeliveryStatus)
      : undefined;
  }

  static async getDelivery(id: string) {
    return WapiCourierDeliveryRepository.getById(id);
  }

  static async retryFailedDelivery(id: string) {
    const delivery = await this.getDelivery(id);

    if (!delivery) {
      throw new Error("WAPI_COURIER_DELIVERY_NOT_FOUND");
    }

    if (delivery.status !== WapiDeliveryStatus.FAILED) {
      return {
        status:
          delivery.status === WapiDeliveryStatus.SENT
            ? "ALREADY_SENT"
            : delivery.status === WapiDeliveryStatus.PROCESSING
              ? "IN_PROGRESS"
              : "BLOCKED",
        deliveryId: delivery.id,
        attempts: delivery.attempts,
        errorMessage:
          delivery.status === WapiDeliveryStatus.SENT
            ? "Delivery sudah terkirim."
            : "Hanya delivery FAILED yang dapat di-retry.",
      } as const;
    }

    return WapiCourierDeliveryService.deliver({
      assignmentId: delivery.assignmentId,
      courierId: delivery.courierId,
      orderId: delivery.orderId,
      eventKey: delivery.eventKey,
      eventType:
        delivery.eventType === "CANCELLATION"
          ? "CANCELLATION"
          : "ASSIGNMENT",
      message: delivery.message,
    });
  }
}

export default WapiCourierDeliveryAdminService;
