import { WapiDeliveryStatus } from "@prisma/client";

import {
  WapiDeliveryAdminFilters,
  WapiDeliveryRepository,
} from "@/repositories/notification/wapi-delivery.repository";

export class WapiDeliveryAdminService {
  static async getDeliveryList(filters: WapiDeliveryAdminFilters = {}) {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(100, Math.max(1, filters.limit ?? 20));

    const normalizedFilters = {
      ...filters,
      page,
      limit,
    };

    const [items, total, statusCounts] = await Promise.all([
      WapiDeliveryRepository.findManyForAdminList(normalizedFilters),
      WapiDeliveryRepository.countForAdminList(normalizedFilters),
      WapiDeliveryRepository.getStatusCounts({
        search: normalizedFilters.search,
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
      statusCounts,
    };
  }

  static parseStatus(value?: string): WapiDeliveryStatus | undefined {
    if (!value) {
      return undefined;
    }

    if (
      !Object.values(WapiDeliveryStatus).includes(value as WapiDeliveryStatus)
    ) {
      return undefined;
    }

    return value as WapiDeliveryStatus;
  }
}
