import { WapiDeliveryStatus } from "@prisma/client";

import {
  WapiCustomerDeliveryAdminFilters,
  WapiCustomerDeliveryRepository,
} from "@/repositories/notification/wapi-customer-delivery.repository";

export class WapiCustomerDeliveryAdminService {
  static async getList(
    filters: WapiCustomerDeliveryAdminFilters = {},
  ) {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(100, Math.max(1, filters.limit ?? 20));

    const normalized = {
      ...filters,
      page,
      limit,
    };

    const [items, total, statusRows] = await Promise.all([
      WapiCustomerDeliveryRepository.findMany(normalized),
      WapiCustomerDeliveryRepository.count(normalized),
      WapiCustomerDeliveryRepository.statusCounts({
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
      statusCounts: statusRows.map((row) => ({
        status: row.status,
        count: row._count._all,
      })),
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
}
