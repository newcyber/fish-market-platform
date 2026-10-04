"use client";

import { useCallback, useEffect, useState } from "react";

type WapiDeliveryStatus =
  | "PENDING"
  | "PROCESSING"
  | "SENT"
  | "FAILED"
  | "SKIPPED";

type WapiCustomerDeliveryItem = {
  id: string;
  orderId: string | null;
  userId: string;
  eventKey: string;
  eventType: string;
  phone: string;
  message: string;
  status: WapiDeliveryStatus;
  messageId: string | null;
  jid: string | null;
  attempts: number;
  errorMessage: string | null;
  processingStartedAt: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
  order: {
    id: string;
    orderNumber: string;
    status: string;
    paymentStatus: string;
  } | null;
};

type StatusCount = {
  status: WapiDeliveryStatus;
  count: number;
};

type WapiAuditLog = {
  id: string;
  action: string;
  settingKey: string | null;
  eventType: string | null;
  fromStatus: WapiDeliveryStatus | null;
  toStatus: WapiDeliveryStatus | null;
  previousValue: unknown;
  newValue: unknown;
  metadata: unknown;
  createdAt: string;
  actor: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  } | null;
  delivery: {
    id: string;
    eventKey: string;
    eventType: string;
    status: WapiDeliveryStatus;
    attempts: number;
    order: {
      orderNumber: string;
    } | null;
  } | null;
};

type WapiAnalytics = {
  total: number;
  sent: number;
  failed: number;
  pending: number;
  processing: number;
  skipped: number;
  retryCount: number;
  averageAttempts: number;
  successRate: number;
  failureRate: number;
  retryRate: number;
  health: {
    status: "HEALTHY" | "WARNING" | "CRITICAL";
    reasons: string[];
    failureRate: number;
    retryRate: number;
    processingCount: number;
    oldestProcessingMinutes: number;
    windowHours: number;
    windowTotal: number;
    windowFailed: number;
    windowRetried: number;
    thresholds: {
      failureWarningRate: number;
      failureCriticalRate: number;
      retryWarningRate: number;
      retryCriticalRate: number;
      processingWarningMinutes: number;
      processingCriticalMinutes: number;
    };
  };
  eventTypes: Array<{
    eventType: string;
    count: number;
    sent: number;
    failed: number;
    successRate: number;
  }>;
  failureReasons: Array<{
    reason: string;
    count: number;
  }>;
  alert: {
    active: boolean;
    status: "HEALTHY" | "WARNING" | "CRITICAL";
    title: string;
    message: string;
    notifiedRecipients: number;
  };
};

type ApiResponse = {
  success: boolean;
  message?: string;
  data?:
    | WapiCustomerDeliveryItem[]
    | {
        items?: WapiCustomerDeliveryItem[];
        pagination?: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
          hasNextPage: boolean;
          hasPreviousPage: boolean;
        };
        statusCounts?: StatusCount[];
      };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  statusCounts?: StatusCount[];
};

const STATUS_OPTIONS: Array<{
  value: "" | WapiDeliveryStatus;
  label: string;
}> = [
  { value: "", label: "Semua status" },
  { value: "PENDING", label: "Pending" },
  { value: "PROCESSING", label: "Processing" },
  { value: "SENT", label: "Sent" },
  { value: "FAILED", label: "Failed" },
  { value: "SKIPPED", label: "Skipped" },
];

const EVENT_TYPE_OPTIONS: Array<{
  value: "" | WapiCustomerDeliveryItem["eventType"];
  label: string;
}> = [
  { value: "", label: "Semua event" },
  { value: "ORDER_CREATED", label: "Pesanan dibuat" },
  { value: "ORDER_STATUS", label: "Status pesanan" },
  { value: "PAYMENT_VERIFIED", label: "Pembayaran diverifikasi" },
  { value: "PAYMENT_REJECTED", label: "Pembayaran ditolak" },
  { value: "REWARD_POINTS", label: "Reward points" },
];

type CustomerNotificationEvents = {
  ORDER_CREATED: boolean;
  ORDER_STATUS: boolean;
  PAYMENT_VERIFIED: boolean;
  PAYMENT_REJECTED: boolean;
  REWARD_POINTS: boolean;
};

type CustomerNotificationSettings = {
  enabled: boolean;
  events: CustomerNotificationEvents;
};

const STATUS_STYLES: Record<WapiDeliveryStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  SENT: "bg-emerald-100 text-emerald-800",
  FAILED: "bg-red-100 text-red-800",
  SKIPPED: "bg-slate-100 text-slate-700",
};

function formatDate(value: string | null): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatStatus(status: WapiDeliveryStatus): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function canRetry(item: WapiCustomerDeliveryItem): boolean {
  // The server is the source of truth for max-attempt, cooldown, and
  // permanent-error guards. The UI only needs to expose retry for FAILED.
  return item.status === "FAILED";
}

const HEALTH_STYLES: Record<
  WapiAnalytics["health"]["status"],
  {
    panel: string;
    badge: string;
    label: string;
  }
> = {
  HEALTHY: {
    panel: "border-emerald-200 bg-emerald-50/70",
    badge: "bg-emerald-100 text-emerald-800",
    label: "Healthy",
  },
  WARNING: {
    panel: "border-amber-200 bg-amber-50/70",
    badge: "bg-amber-100 text-amber-800",
    label: "Warning",
  },
  CRITICAL: {
    panel: "border-red-200 bg-red-50/70",
    badge: "bg-red-100 text-red-800",
    label: "Critical",
  },
};

export default function WapiCustomerDeliveryCenter() {
  const [items, setItems] = useState<WapiCustomerDeliveryItem[]>([]);
  const [statusCounts, setStatusCounts] = useState<StatusCount[]>([]);
  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [status, setStatus] = useState<"" | WapiDeliveryStatus>("");
  const [eventType, setEventType] = useState<
    "" | WapiCustomerDeliveryItem["eventType"]
  >("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<WapiCustomerDeliveryItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<WapiAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  const [customerNotificationSettings, setCustomerNotificationSettings] =
    useState<CustomerNotificationSettings | null>(null);
  const [customerNotificationLoading, setCustomerNotificationLoading] =
    useState(true);

  const [auditLogs, setAuditLogs] = useState<WapiAuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(true);

  const loadCustomerNotificationSettings = useCallback(async () => {
    setCustomerNotificationLoading(true);

    try {
      const response = await fetch(
        "/api/admin/settings/wapi/customer-notification",
        { cache: "no-store" },
      );

      const result = (await response.json()) as {
        success: boolean;
        data?: {
          enabled?: boolean;
          events?: Partial<CustomerNotificationEvents>;
          wapiCustomerNotificationEnabled?: boolean;
          wapiCustomerOrderCreatedEnabled?: boolean;
          wapiCustomerOrderStatusEnabled?: boolean;
          wapiCustomerPaymentVerifiedEnabled?: boolean;
          wapiCustomerPaymentRejectedEnabled?: boolean;
          wapiCustomerRewardPointsEnabled?: boolean;
        };
        message?: string;
        error?: string;
      };

      if (!response.ok || !result.success || !result.data) {
        throw new Error(
          result.message ||
            result.error ||
            "Gagal mengambil konfigurasi WhatsApp customer.",
        );
      }

      const data = result.data;

      setCustomerNotificationSettings({
        enabled:
          typeof data.enabled === "boolean"
            ? data.enabled
            : Boolean(data.wapiCustomerNotificationEnabled),
        events: {
          ORDER_CREATED:
            typeof data.events?.ORDER_CREATED === "boolean"
              ? data.events.ORDER_CREATED
              : Boolean(data.wapiCustomerOrderCreatedEnabled),
          ORDER_STATUS:
            typeof data.events?.ORDER_STATUS === "boolean"
              ? data.events.ORDER_STATUS
              : Boolean(data.wapiCustomerOrderStatusEnabled),
          PAYMENT_VERIFIED:
            typeof data.events?.PAYMENT_VERIFIED === "boolean"
              ? data.events.PAYMENT_VERIFIED
              : Boolean(data.wapiCustomerPaymentVerifiedEnabled),
          PAYMENT_REJECTED:
            typeof data.events?.PAYMENT_REJECTED === "boolean"
              ? data.events.PAYMENT_REJECTED
              : Boolean(data.wapiCustomerPaymentRejectedEnabled),
          REWARD_POINTS:
            typeof data.events?.REWARD_POINTS === "boolean"
              ? data.events.REWARD_POINTS
              : Boolean(data.wapiCustomerRewardPointsEnabled),
        },
      });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Gagal mengambil konfigurasi WhatsApp customer.",
      );
    } finally {
      setCustomerNotificationLoading(false);
    }
  }, []);

  const loadAuditLogs = useCallback(async () => {
    setAuditLoading(true);

    try {
      const response = await fetch(
        "/api/admin/notifications/wapi-customer-deliveries/audit?limit=12",
        { cache: "no-store" },
      );

      const result = (await response.json()) as {
        success: boolean;
        data?: WapiAuditLog[];
        message?: string;
      };

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Gagal mengambil audit log WAPI.",
        );
      }

      setAuditLogs(Array.isArray(result.data) ? result.data : []);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Gagal mengambil audit log WAPI.",
      );
    } finally {
      setAuditLoading(false);
    }
  }, []);

  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);

    try {
      const response = await fetch(
        "/api/admin/notifications/wapi-customer-deliveries/analytics",
        { cache: "no-store" },
      );
      const result = (await response.json()) as {
        success: boolean;
        data?: WapiAnalytics;
        message?: string;
        error?: string;
      };

      if (!response.ok || !result.success || !result.data) {
        throw new Error(
          result.message || result.error || "Gagal mengambil analytics WAPI.",
        );
      }

      setAnalytics(result.data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Gagal mengambil analytics WAPI.",
      );
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
      });

      if (activeSearch) params.set("search", activeSearch);
      if (status) params.set("status", status);
      if (eventType) params.set("eventType", eventType);

      const response = await fetch(
        `/api/admin/notifications/wapi-customer-deliveries?${params.toString()}`,
        { cache: "no-store" },
      );

      const result = (await response.json()) as ApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal mengambil data WAPI customer.");
      }

      /*
       * The admin API currently returns its payload under `data`, and the
       * service contract may expose the collection either directly as an
       * array or inside `data.items`. Normalize both forms here so the UI
       * never stores an object in `items`.
       */
      const payload = result.data;
      const normalizedItems = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.items)
          ? payload.items
          : [];

      const normalizedPagination = Array.isArray(payload)
        ? result.pagination
        : payload?.pagination ?? result.pagination;

      const normalizedStatusCounts = Array.isArray(payload)
        ? result.statusCounts
        : payload?.statusCounts ?? result.statusCounts;

      setItems(normalizedItems);
      setStatusCounts(
        Array.isArray(normalizedStatusCounts) ? normalizedStatusCounts : [],
      );
      setTotal(normalizedPagination?.total ?? 0);
      setTotalPages(normalizedPagination?.totalPages ?? 1);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Terjadi kesalahan saat mengambil data.",
      );
    } finally {
      setLoading(false);
    }
  }, [activeSearch, eventType, page, status]);

  useEffect(() => {
    const initialize = async () => {
      await Promise.all([
        loadData(),
        loadAnalytics(),
        loadAuditLogs(),
        loadCustomerNotificationSettings(),
      ]);
    };

    void initialize();
  }, [
    loadData,
    loadAnalytics,
    loadAuditLogs,
    loadCustomerNotificationSettings,
  ]);

  async function retry(item: WapiCustomerDeliveryItem) {
    if (!canRetry(item) || retryingId) return;

    setRetryingId(item.id);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/notifications/wapi-customer-deliveries/${item.id}/retry`,
        { method: "POST" },
      );

      const result = (await response.json()) as {
        success: boolean;
        message?: string;
      };

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Retry WAPI gagal.");
      }

      await Promise.all([loadData(), loadAnalytics(), loadAuditLogs()]);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Retry WAPI gagal.",
      );
    } finally {
      setRetryingId(null);
    }
  }

  function submitSearch() {
    setPage(1);
    setActiveSearch(search.trim());
  }

  function changeStatus(nextStatus: "" | WapiDeliveryStatus) {
    setPage(1);
    setStatus(nextStatus);
  }

  function changeEventType(
    nextEventType: "" | WapiCustomerDeliveryItem["eventType"],
  ) {
    setPage(1);
    setEventType(nextEventType);
  }

  const countFor = (value: WapiDeliveryStatus) =>
    statusCounts.find((item) => item.status === value)?.count ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          WAPI Customer Command Center
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pantau notifikasi WhatsApp customer, lihat detail delivery, dan lakukan retry secara terkontrol.
        </p>
      </div>

      {customerNotificationLoading ? (
        <div className="rounded-xl border bg-card p-5 text-sm text-muted-foreground">
          Memuat konfigurasi WhatsApp customer...
        </div>
      ) : customerNotificationSettings ? (
        <section
          className={`rounded-xl border p-5 shadow-sm ${
            customerNotificationSettings.enabled
              ? "border-emerald-200 bg-emerald-50/70"
              : "border-red-200 bg-red-50/70"
          }`}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-base font-semibold">WhatsApp Customer</h2>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    customerNotificationSettings.enabled
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {customerNotificationSettings.enabled ? "AKTIF" : "NONAKTIF"}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Status global dan status setiap event notifikasi WhatsApp customer.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {(
              [
                ["ORDER_CREATED", "Pesanan dibuat"],
                ["ORDER_STATUS", "Status pesanan"],
                ["PAYMENT_VERIFIED", "Pembayaran diverifikasi"],
                ["PAYMENT_REJECTED", "Pembayaran ditolak"],
                ["REWARD_POINTS", "Reward points"],
              ] as const
            ).map(([key, label]) => {
              const enabled = customerNotificationSettings.events[key];

              return (
                <div
                  key={key}
                  className="rounded-lg border bg-background/70 px-3 py-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      {label}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        enabled
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {enabled ? "ON" : "OFF"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {!customerNotificationSettings.enabled && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              Global customer notification sedang OFF. Delivery baru tidak akan
              dikirim ke customer melalui WAPI.
            </div>
          )}
        </section>
      ) : null}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {STATUS_OPTIONS.filter((item) => item.value).map((option) => (
          <div
            key={option.value}
            className="rounded-xl border bg-card p-4 shadow-sm"
          >
            <p className="text-xs font-medium text-muted-foreground">
              {option.label}
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {countFor(option.value as WapiDeliveryStatus)}
            </p>
          </div>
        ))}
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">WAPI Delivery Analytics</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Ringkasan kesehatan delivery customer secara keseluruhan.
          </p>
        </div>

        {analyticsLoading && !analytics ? (
          <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
            Memuat analytics WAPI...
          </div>
        ) : analytics ? (
          <>
            <div
              className={`rounded-xl border p-5 shadow-sm ${HEALTH_STYLES[analytics.health.status].panel}`}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-semibold">WAPI Event Health</h3>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${HEALTH_STYLES[analytics.health.status].badge}`}
                    >
                      {HEALTH_STYLES[analytics.health.status].label}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Health 24 jam dihitung dari failure rate, retry rate, dan delivery PROCESSING yang terlalu lama.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-3">
                  <div className="rounded-lg border bg-background/70 px-3 py-2">
                    <span className="text-muted-foreground">Failure {analytics.health.windowHours}j</span>
                    <p className="mt-1 font-semibold">{analytics.health.failureRate}%</p>
                  </div>
                  <div className="rounded-lg border bg-background/70 px-3 py-2">
                    <span className="text-muted-foreground">Retry {analytics.health.windowHours}j</span>
                    <p className="mt-1 font-semibold">{analytics.health.retryRate}%</p>
                  </div>
                  <div className="rounded-lg border bg-background/70 px-3 py-2">
                    <span className="text-muted-foreground">Processing</span>
                    <p className="mt-1 font-semibold">{analytics.health.processingCount}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-2 md:grid-cols-2">
                {analytics.health.reasons.map((reason) => (
                  <div
                    key={reason}
                    className="rounded-lg border bg-background/60 px-3 py-2 text-sm"
                  >
                    {reason}
                  </div>
                ))}
              </div>

              <p className="mt-3 text-xs text-muted-foreground">
                Window health: {analytics.health.windowTotal} delivery dalam {analytics.health.windowHours} jam terakhir.
                {analytics.health.processingCount > 0
                  ? ` Processing tertua: ${analytics.health.oldestProcessingMinutes} menit.`
                  : " Tidak ada delivery PROCESSING saat ini."}
              </p>

              {analytics.alert.active && (
                <div className="mt-4 rounded-lg border bg-background/70 px-3 py-3 text-sm">
                  <div className="font-medium">{analytics.alert.title}</div>
                  <p className="mt-1 text-muted-foreground">{analytics.alert.message}</p>
                  {analytics.alert.notifiedRecipients > 0 && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {analytics.alert.notifiedRecipients} admin menerima notifikasi baru.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              {[
                ["Success rate", `${analytics.successRate}%`],
                ["Failure rate", `${analytics.failureRate}%`],
                ["Retry rate", `${analytics.retryRate}%`],
                ["Retry delivery", analytics.retryCount],
                ["Avg. attempts", analytics.averageAttempts],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border bg-card p-4 shadow-sm">
                  <p className="text-xs font-medium text-muted-foreground">{label}</p>
                  <p className="mt-2 text-xl font-semibold">{value}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
              <div className="overflow-hidden rounded-xl border bg-card">
                <div className="border-b p-4">
                  <h3 className="font-semibold">Event Performance</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Distribusi event dan keberhasilan pengirimannya.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b bg-muted/40">
                      <tr>
                        <th className="px-4 py-3 font-medium">Event</th>
                        <th className="px-4 py-3 font-medium">Total</th>
                        <th className="px-4 py-3 font-medium">Sent</th>
                        <th className="px-4 py-3 font-medium">Failed</th>
                        <th className="px-4 py-3 font-medium">Success</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {analytics.eventTypes.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                            Belum ada event.
                          </td>
                        </tr>
                      ) : (
                        analytics.eventTypes.map((event) => (
                          <tr key={event.eventType}>
                            <td className="px-4 py-3 font-medium">{event.eventType}</td>
                            <td className="px-4 py-3">{event.count}</td>
                            <td className="px-4 py-3">{event.sent}</td>
                            <td className="px-4 py-3">{event.failed}</td>
                            <td className="px-4 py-3">{event.successRate}%</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border bg-card">
                <div className="border-b p-4">
                  <h3 className="font-semibold">Top Failure Reasons</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Error paling sering pada delivery FAILED.
                  </p>
                </div>
                <div className="divide-y">
                  {analytics.failureReasons.length === 0 ? (
                    <div className="p-6 text-center text-sm text-muted-foreground">
                      Tidak ada failure reason.
                    </div>
                  ) : (
                    analytics.failureReasons.map((failure) => (
                      <div key={`${failure.reason}-${failure.count}`} className="flex items-start justify-between gap-4 p-4">
                        <p className="min-w-0 text-sm break-words">{failure.reason}</p>
                        <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                          {failure.count}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Audit Log WAPI</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Catatan perubahan switch WAPI dan tindakan retry yang dilakukan admin.
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border bg-card">
          {auditLoading ? (
            <div className="p-6 text-sm text-muted-foreground">
              Memuat audit log...
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">
              Belum ada aktivitas audit WAPI.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b bg-muted/40">
                  <tr>
                    <th className="px-4 py-3 font-medium">Waktu</th>
                    <th className="px-4 py-3 font-medium">Admin</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                    <th className="px-4 py-3 font-medium">Detail</th>
                    <th className="px-4 py-3 font-medium">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {auditLogs.map((audit) => {
                    const actor =
                      audit.actor?.name || audit.actor?.email || "Admin";
                    const detail =
                      audit.action === "SETTINGS_UPDATED"
                        ? `${audit.settingKey}: ${String(audit.previousValue)} → ${String(audit.newValue)}`
                        : `${audit.eventType || audit.delivery?.eventType || "-"}${audit.delivery?.order?.orderNumber ? ` · ${audit.delivery.order.orderNumber}` : ""}`;

                    const result =
                      audit.action === "DELIVERY_RETRY"
                        ? `${audit.fromStatus || "-"} → ${audit.toStatus || "-"}`
                        : "Konfigurasi diperbarui";

                    return (
                      <tr key={audit.id} className="align-top">
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                          {formatDate(audit.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{actor}</div>
                          {audit.actor?.role && (
                            <div className="text-xs text-muted-foreground">
                              {audit.actor.role}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                            {audit.action === "SETTINGS_UPDATED"
                              ? "Settings"
                              : "Retry"}
                          </span>
                        </td>
                        <td className="max-w-[430px] px-4 py-3 text-sm">
                          {detail}
                        </td>
                        <td className="px-4 py-3 text-sm">{result}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <div className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-[1fr_auto_auto_auto]">
        <div className="flex gap-2">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") submitSearch();
            }}
            placeholder="Cari customer, order, nomor WhatsApp, atau event key..."
            className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="button"
            onClick={submitSearch}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Cari
          </button>
        </div>

        <select
          value={status}
          onChange={(event) =>
            changeStatus(event.target.value as "" | WapiDeliveryStatus)
          }
          className="rounded-lg border bg-background px-3 py-2 text-sm"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={eventType}
          onChange={(event) =>
            changeEventType(
              event.target.value as "" | WapiCustomerDeliveryItem["eventType"],
            )
          }
          className="rounded-lg border bg-background px-3 py-2 text-sm"
        >
          {EVENT_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() =>
                void Promise.all([
                  loadData(),
                  loadAnalytics(),
                  loadAuditLogs(),
                  loadCustomerNotificationSettings(),
                ])
              }
          disabled={loading}
          className="rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1250px] text-left text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-4 py-3 font-medium">Event</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Attempt</th>
                <th className="px-4 py-3 font-medium">Waktu</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                    Memuat data WAPI customer...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                    Belum ada data WAPI customer delivery.
                  </td>
                </tr>
              ) : (
                (Array.isArray(items) ? items : []).map((item) => (
                  <tr key={item.id} className="align-top">
                    <td className="px-4 py-4">
                      <div className="font-medium">{item.eventType}</div>
                      <div className="mt-1 max-w-[260px] truncate text-xs text-muted-foreground">
                        {item.eventKey}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium">{item.user.name || "Tanpa nama"}</div>
                      <div className="text-xs text-muted-foreground">{item.phone}</div>
                    </td>
                    <td className="px-4 py-4">
                      {item.order ? item.order.orderNumber : "-"}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[item.status]}`}
                      >
                        {formatStatus(item.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4">{item.attempts}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-xs text-muted-foreground">
                      {formatDate(item.sentAt || item.createdAt)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSelected(item)}
                          className="rounded-lg border px-3 py-2 text-xs font-medium"
                        >
                          Detail
                        </button>
                        {canRetry(item) && (
                          <button
                            type="button"
                            disabled={retryingId === item.id}
                            onClick={() => void retry(item)}
                            className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground disabled:opacity-50"
                          >
                            {retryingId === item.id ? "Retry..." : "Retry"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t p-4 text-sm md:flex-row md:items-center md:justify-between">
          <p className="text-muted-foreground">Total: {total} delivery</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((value) => value - 1)}
              className="rounded-lg border px-3 py-2 disabled:opacity-40"
            >
              Sebelumnya
            </button>
            <span className="px-2 text-muted-foreground">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((value) => value + 1)}
              className="rounded-lg border px-3 py-2 disabled:opacity-40"
            >
              Berikutnya
            </button>
          </div>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border bg-card p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Detail WAPI Delivery</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {selected.eventKey}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg border px-3 py-2 text-sm"
              >
                Tutup
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Customer</p>
                <p className="font-medium">{selected.user.name || "-"}</p>
                <p className="text-sm text-muted-foreground">{selected.phone}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Event</p>
                <p className="font-medium">{selected.eventType}</p>
                <p className="text-sm text-muted-foreground">
                  {selected.order?.orderNumber || "Tanpa order"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="font-medium">{formatStatus(selected.status)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Attempts</p>
                <p className="font-medium">{selected.attempts}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs text-muted-foreground">Message</p>
                <pre className="mt-2 whitespace-pre-wrap rounded-xl border bg-muted/30 p-4 text-sm">
                  {selected.message}
                </pre>
              </div>
              {selected.errorMessage && (
                <div className="md:col-span-2">
                  <p className="text-xs text-muted-foreground">Error</p>
                  <p className="mt-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {selected.errorMessage}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
