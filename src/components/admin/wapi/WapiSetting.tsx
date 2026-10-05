"use client";

import Image from "next/image";

import {
  CheckCircle2,
  Loader2,
  LogOut,
  MessageCircle,
  RefreshCw,
  Smartphone,
  WifiOff,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { CourierWapiSettings } from "@/components/admin/wapi/CourierWapiSettings";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface WapiStatus {
  state: string;
  connected: boolean;
  hasQR: boolean;
  phone?: string | null;
}

interface StatusResponse {
  success: boolean;
  data?: WapiStatus;
  error?: string;
}

interface QrResponse {
  success: boolean;
  data?: {
    qr?: string | null;
  };
  error?: string;
}

interface OrderNotificationSettings {
  enabled: boolean;
  paymentProofEnabled: boolean;
  template: string;
  defaultTemplate: string;
  placeholders: readonly string[];
  maxLength: number;
}

type CustomerWapiEventKey =
  | "ORDER_CREATED"
  | "ORDER_STATUS"
  | "PAYMENT_VERIFIED"
  | "PAYMENT_REJECTED"
  | "REWARD_POINTS";

interface CustomerNotificationEvents {
  ORDER_CREATED: boolean;
  ORDER_STATUS: boolean;
  PAYMENT_VERIFIED: boolean;
  PAYMENT_REJECTED: boolean;
  REWARD_POINTS: boolean;
}

interface CustomerNotificationResponse {
  success: boolean;
  data?: {
    enabled: boolean;
    events: CustomerNotificationEvents;
  };
  error?: string;
}

const CUSTOMER_WAPI_EVENT_LABELS: Record<
  CustomerWapiEventKey,
  { title: string; description: string }
> = {
  ORDER_CREATED: {
    title: "Pesanan dibuat",
    description: "Kirim WhatsApp ketika customer berhasil membuat pesanan.",
  },
  ORDER_STATUS: {
    title: "Perubahan status pesanan",
    description: "Kirim WhatsApp ketika status pesanan berubah.",
  },
  PAYMENT_VERIFIED: {
    title: "Pembayaran diverifikasi",
    description: "Kirim WhatsApp ketika pembayaran customer berhasil diverifikasi.",
  },
  PAYMENT_REJECTED: {
    title: "Pembayaran ditolak",
    description: "Kirim WhatsApp ketika bukti pembayaran customer ditolak.",
  },
  REWARD_POINTS: {
    title: "Reward points",
    description: "Kirim WhatsApp ketika customer mendapatkan reward points.",
  },
};

interface OrderNotificationResponse {
  success: boolean;
  data?: OrderNotificationSettings;
  error?: string;
}

function formatPhone(phone?: string | null) {
  if (!phone) {
    return "-";
  }

  const normalized = phone.replace(/\D/g, "");

  if (normalized.startsWith("62")) {
    return `+${normalized}`;
  }

  return phone;
}

export function WapiSetting() {
  const [status, setStatus] = useState<WapiStatus | null>(null);

  const [qr, setQr] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [qrLoading, setQrLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [notificationSettings, setNotificationSettings] =
    useState<OrderNotificationSettings | null>(null);

  const [notificationEnabled, setNotificationEnabled] = useState(true);

  const [paymentProofNotificationEnabled, setPaymentProofNotificationEnabled] =
    useState(true);

  const [notificationTemplate, setNotificationTemplate] = useState("");

  const [notificationLoading, setNotificationLoading] = useState(false);

  const [notificationSaving, setNotificationSaving] = useState(false);

  const [notificationMessage, setNotificationMessage] = useState<string | null>(
    null,
  );

  const [customerNotificationEnabled, setCustomerNotificationEnabled] =
    useState(true);

  const [customerNotificationEvents, setCustomerNotificationEvents] =
    useState<CustomerNotificationEvents>({
      ORDER_CREATED: true,
      ORDER_STATUS: true,
      PAYMENT_VERIFIED: true,
      PAYMENT_REJECTED: true,
      REWARD_POINTS: true,
    });

  const [customerNotificationLoading, setCustomerNotificationLoading] =
    useState(false);

  const [customerNotificationSaving, setCustomerNotificationSaving] =
    useState(false);

  const [customerNotificationMessage, setCustomerNotificationMessage] =
    useState<string | null>(null);

  const loadNotificationSettings = useCallback(async () => {
    setNotificationLoading(true);

    try {
      const response = await fetch(
        "/api/admin/settings/wapi/order-notification",
        {
          cache: "no-store",
        },
      );

      const result = (await response.json()) as OrderNotificationResponse;

      if (!response.ok || !result.success || !result.data) {
        throw new Error(
          result.error || "Gagal mengambil pengaturan notifikasi WhatsApp.",
        );
      }

      setNotificationSettings(result.data);
      setNotificationEnabled(result.data.enabled);
      setPaymentProofNotificationEnabled(result.data.paymentProofEnabled);
      setNotificationTemplate(result.data.template);
      setNotificationMessage(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil pengaturan notifikasi WhatsApp.",
      );
    } finally {
      setNotificationLoading(false);
    }
  }, []);

  const handleSaveNotificationSettings = async () => {
    setNotificationSaving(true);
    setNotificationMessage(null);
    setError(null);

    try {
      const response = await fetch(
        "/api/admin/settings/wapi/order-notification",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            enabled: notificationEnabled,
            paymentProofEnabled: paymentProofNotificationEnabled,
            template: notificationTemplate,
          }),
        },
      );

      const result = (await response.json()) as OrderNotificationResponse;

      if (!response.ok || !result.success || !result.data) {
        throw new Error(
          result.error || "Gagal menyimpan pengaturan notifikasi WhatsApp.",
        );
      }

      const data = result.data;

      setNotificationSettings((current): OrderNotificationSettings => ({
        enabled: data?.enabled ?? current?.enabled ?? true,
        paymentProofEnabled:
          data?.paymentProofEnabled ?? current?.paymentProofEnabled ?? true,
        template: data?.template ?? current?.template ?? "",
        defaultTemplate:
          data?.defaultTemplate ?? current?.defaultTemplate ?? "",
        placeholders: data?.placeholders ?? current?.placeholders ?? [],
        maxLength: data?.maxLength ?? current?.maxLength ?? 4000,
      }));

      setNotificationEnabled(result.data.enabled);
      setPaymentProofNotificationEnabled(result.data.paymentProofEnabled);
      setNotificationTemplate(result.data.template);

      setNotificationMessage(
        "Pengaturan notifikasi WhatsApp berhasil disimpan.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menyimpan pengaturan notifikasi WhatsApp.",
      );
    } finally {
      setNotificationSaving(false);
    }
  };

  const loadCustomerNotificationSettings = useCallback(async () => {
    setCustomerNotificationLoading(true);

    try {
      const response = await fetch(
        "/api/admin/settings/wapi/customer-notification",
        {
          cache: "no-store",
        },
      );

      const result = (await response.json()) as CustomerNotificationResponse;

      if (!response.ok || !result.success || !result.data) {
        throw new Error(
          result.error ||
            "Gagal mengambil status notifikasi WhatsApp customer.",
        );
      }

      setCustomerNotificationEnabled(result.data.enabled);
      setCustomerNotificationEvents(result.data.events);
      setCustomerNotificationMessage(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil status notifikasi WhatsApp customer.",
      );
    } finally {
      setCustomerNotificationLoading(false);
    }
  }, []);

  const handleSaveCustomerNotification = async () => {
    setCustomerNotificationSaving(true);
    setCustomerNotificationMessage(null);
    setError(null);

    try {
      const response = await fetch(
        "/api/admin/settings/wapi/customer-notification",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            enabled: customerNotificationEnabled,
            orderCreated: customerNotificationEvents.ORDER_CREATED,
            orderStatus: customerNotificationEvents.ORDER_STATUS,
            paymentVerified: customerNotificationEvents.PAYMENT_VERIFIED,
            paymentRejected: customerNotificationEvents.PAYMENT_REJECTED,
            rewardPoints: customerNotificationEvents.REWARD_POINTS,
          }),
        },
      );

      const result = (await response.json()) as CustomerNotificationResponse;

      if (!response.ok || !result.success || !result.data) {
        throw new Error(
          result.error ||
            "Gagal menyimpan status notifikasi WhatsApp customer.",
        );
      }

      setCustomerNotificationEnabled(result.data.enabled);
      setCustomerNotificationEvents(result.data.events);
      setCustomerNotificationMessage(
        result.data.enabled
          ? "Notifikasi WhatsApp customer berhasil diaktifkan."
          : "Notifikasi WhatsApp customer berhasil dinonaktifkan.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menyimpan status notifikasi WhatsApp customer.",
      );
    } finally {
      setCustomerNotificationSaving(false);
    }
  };

  const loadStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/settings/wapi", {
        cache: "no-store",
      });

      const result = (await response.json()) as StatusResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Gagal mengambil status WhatsApp.");
      }

      setStatus(result.data ?? null);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal mengambil status WhatsApp.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const loadQr = useCallback(async () => {
    setQrLoading(true);

    try {
      const response = await fetch("/api/admin/settings/wapi/qr", {
        cache: "no-store",
      });

      const result = (await response.json()) as QrResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Gagal mengambil QR WhatsApp.");
      }

      setQr(result.data?.qr ?? null);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal mengambil QR WhatsApp.",
      );
    } finally {
      setQrLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    await loadStatus();
    await loadQr();
  }, [loadQr, loadStatus]);

  const handleLogout = async () => {
    const confirmed = window.confirm(
      "WhatsApp saat ini akan diputus. Setelah itu Anda perlu scan QR untuk menghubungkan nomor baru. Lanjutkan?",
    );

    if (!confirmed) {
      return;
    }

    setLogoutLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/settings/wapi/logout", {
        method: "POST",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Gagal memutus koneksi WhatsApp.");
      }

      setQr(null);

      await loadStatus();
      await loadQr();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal memutus koneksi WhatsApp.",
      );
    } finally {
      setLogoutLoading(false);
    }
  };

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadNotificationSettings();
    }, 0);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [loadNotificationSettings]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadCustomerNotificationSettings();
    }, 0);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [loadCustomerNotificationSettings]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadStatus();
    }, 0);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [loadStatus]);

  useEffect(() => {
    if (!status || status.connected) {
      return;
    }

    const qrTimeout = window.setTimeout(() => {
      void loadQr();
    }, 0);

    const interval = window.setInterval(() => {
      void loadStatus();
      void loadQr();
    }, 5000);

    return () => {
      window.clearTimeout(qrTimeout);
      window.clearInterval(interval);
    };
  }, [loadQr, loadStatus, status]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex min-h-[260px] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-500/10 text-green-600">
              <MessageCircle className="h-6 w-6" />
            </div>

            <div>
              <h2 className="font-semibold">Koneksi WhatsApp</h2>

              <p className="text-sm text-muted-foreground">
                Status koneksi WhatsApp API Pisjo Market.
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {status?.connected ? (
            <div className="space-y-5">
              <div className="rounded-xl border bg-muted/30 p-5">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />

                  <div>
                    <p className="font-medium">WhatsApp Terhubung</p>

                    <p className="text-sm text-muted-foreground">
                      Nomor WhatsApp siap digunakan untuk pengiriman pesan.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-xl border p-5">
                <Smartphone className="h-6 w-6 text-muted-foreground" />

                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Nomor WhatsApp
                  </p>

                  <p className="mt-1 text-lg font-semibold">
                    {formatPhone(status.phone)}
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="destructive"
                onClick={handleLogout}
                disabled={logoutLoading}
              >
                {logoutLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="mr-2 h-4 w-4" />
                )}
                Ganti Nomor
              </Button>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[minmax(280px,360px)_1fr]">
              <div className="flex min-h-[340px] items-center justify-center rounded-2xl border bg-white p-6">
                {qr ? (
                  <Image
                    src={qr}
                    alt="QR Code WhatsApp"
                    width={320}
                    height={320}
                    unoptimized
                    className="h-auto w-full max-w-[320px]"
                  />
                ) : qrLoading ? (
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <Loader2 className="h-7 w-7 animate-spin" />

                    <span className="text-sm">Menyiapkan QR Code...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 text-center text-muted-foreground">
                    <WifiOff className="h-8 w-8" />

                    <p className="text-sm">QR Code belum tersedia.</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col justify-center space-y-5">
                <div>
                  <h3 className="text-lg font-semibold">Hubungkan WhatsApp</h3>

                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Buka WhatsApp pada smartphone Anda, masuk ke Perangkat
                    Tertaut, kemudian scan QR Code di sebelah kiri.
                  </p>
                </div>

                <div className="rounded-xl bg-muted/40 p-4 text-sm">
                  <ol className="list-decimal space-y-2 pl-5">
                    <li>Buka aplikasi WhatsApp.</li>
                    <li>
                      Pilih <strong>Perangkat Tertaut</strong>.
                    </li>
                    <li>
                      Pilih <strong>Tautkan Perangkat</strong>.
                    </li>
                    <li>Scan QR Code yang tampil di halaman ini.</li>
                  </ol>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRefresh}
                    disabled={qrLoading}
                  >
                    {qrLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Refresh QR
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-500/10 text-green-600">
              <MessageCircle className="h-6 w-6" />
            </div>

            <div>
              <h2 className="font-semibold">
                Notifikasi WhatsApp Customer
              </h2>

              <p className="text-sm text-muted-foreground">
                Kontrol global untuk seluruh notifikasi WhatsApp transaksional
                kepada customer.
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {customerNotificationLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Memuat status notifikasi customer...
            </div>
          ) : (
            <>
              <label className="flex items-center justify-between gap-4 rounded-xl border p-4">
                <div>
                  <p className="font-medium">
                    Aktifkan notifikasi WhatsApp customer
                  </p>

                  <p className="text-sm text-muted-foreground">
                    Jika OFF, sistem tidak akan mengirim event WhatsApp
                    transaksional customer seperti pesanan dibuat, pembayaran
                    diverifikasi, perubahan status pesanan, dan reward points.
                    Notifikasi database dan Web Push tetap berjalan.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={customerNotificationEnabled}
                  onChange={(event) =>
                    setCustomerNotificationEnabled(event.target.checked)
                  }
                  disabled={customerNotificationSaving}
                  className="h-5 w-5 accent-green-600"
                />
              </label>

              <div
                className={
                  customerNotificationEnabled
                    ? "rounded-xl border border-green-500/30 bg-green-500/5 px-4 py-3 text-sm text-green-700"
                    : "rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-700"
                }
              >
                {customerNotificationEnabled
                  ? "ON — WhatsApp transactional customer aktif. Preferensi OFF milik customer tetap dihormati."
                  : "OFF — seluruh WhatsApp transactional customer diblokir sampai admin mengaktifkannya kembali."}
              </div>

              {customerNotificationMessage && (
                <div className="rounded-xl border border-green-500/30 bg-green-500/5 px-4 py-3 text-sm text-green-700">
                  {customerNotificationMessage}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <p className="font-medium">Kontrol per event</p>
                  <p className="text-sm text-muted-foreground">
                    Matikan hanya jenis pesan tertentu tanpa mematikan seluruh
                    notifikasi WhatsApp customer.
                  </p>
                </div>

                {(Object.keys(CUSTOMER_WAPI_EVENT_LABELS) as CustomerWapiEventKey[]).map(
                  (eventType) => {
                    const item = CUSTOMER_WAPI_EVENT_LABELS[eventType];

                    return (
                      <label
                        key={eventType}
                        className="flex items-center justify-between gap-4 rounded-xl border p-4"
                      >
                        <div className="min-w-0">
                          <p className="font-medium">{item.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.description}
                          </p>
                        </div>

                        <input
                          type="checkbox"
                          checked={customerNotificationEvents[eventType]}
                          onChange={(event) =>
                            setCustomerNotificationEvents((current) => ({
                              ...current,
                              [eventType]: event.target.checked,
                            }))
                          }
                          disabled={
                            customerNotificationSaving ||
                            customerNotificationLoading
                          }
                          className="h-5 w-5 accent-green-600"
                        />
                      </label>
                    );
                  },
                )}
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={handleSaveCustomerNotification}
                  disabled={
                    customerNotificationSaving ||
                    customerNotificationLoading
                  }
                >
                  {customerNotificationSaving && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Simpan Pengaturan Customer
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <CourierWapiSettings />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-500/10 text-green-600">
              <MessageCircle className="h-6 w-6" />
            </div>

            <div>
              <h2 className="font-semibold">Notifikasi WhatsApp Admin</h2>

              <p className="text-sm text-muted-foreground">
                Atur notifikasi WhatsApp admin untuk pembelian dan upload bukti pembayaran.
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {notificationLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Memuat pengaturan template...
            </div>
          ) : (
            <>
              <label className="flex items-center justify-between gap-4 rounded-xl border p-4">
                <div>
                  <p className="font-medium">Aktifkan notifikasi pesanan</p>

                  <p className="text-sm text-muted-foreground">
                    Kirim pesan pesanan baru kepada admin aktif.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={notificationEnabled}
                  onChange={(event) =>
                    setNotificationEnabled(event.target.checked)
                  }
                  className="h-5 w-5 accent-green-600"
                />
              </label>

              <label className="flex items-center justify-between gap-4 rounded-xl border p-4">
                <div>
                  <p className="font-medium">Notifikasi upload bukti pembayaran</p>

                  <p className="text-sm text-muted-foreground">
                    Kirim WhatsApp kepada admin ketika customer mengupload bukti pembayaran.
                    Notifikasi database dan Web Push tetap berjalan saat OFF.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={paymentProofNotificationEnabled}
                  onChange={(event) =>
                    setPaymentProofNotificationEnabled(event.target.checked)
                  }
                  disabled={notificationSaving}
                  className="h-5 w-5 accent-green-600"
                />
              </label>

              <div
                className={
                  notificationEnabled && paymentProofNotificationEnabled
                    ? "rounded-xl border border-green-500/30 bg-green-500/5 px-4 py-3 text-sm text-green-700"
                    : "rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-700"
                }
              >
                {notificationEnabled && paymentProofNotificationEnabled
                  ? "ON — notifikasi WhatsApp pembelian dan upload bukti pembayaran admin aktif."
                  : "Sebagian atau seluruh notifikasi WhatsApp admin sedang OFF sesuai event yang dipilih."}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="wapi-order-notification-template"
                  className="text-sm font-medium"
                >
                  Isi template pesan
                </label>

                <textarea
                  id="wapi-order-notification-template"
                  value={notificationTemplate}
                  onChange={(event) =>
                    setNotificationTemplate(event.target.value)
                  }
                  maxLength={notificationSettings?.maxLength ?? 4000}
                  rows={10}
                  className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-primary"
                  placeholder="Masukkan template notifikasi pesanan..."
                />

                <div className="flex justify-between gap-3 text-xs text-muted-foreground">
                  <span>Gunakan placeholder yang tersedia di bawah.</span>

                  <span>
                    {notificationTemplate.length}/
                    {notificationSettings?.maxLength ?? 4000}
                  </span>
                </div>
              </div>

              <div className="rounded-xl bg-muted/40 p-4">
                <p className="mb-2 text-sm font-medium">
                  Placeholder yang tersedia
                </p>

                <div className="flex flex-wrap gap-2">
                  {(
                    notificationSettings?.placeholders ?? [
                      "order_number",
                      "customer_name",
                      "order_total",
                    ]
                  ).map((placeholder) => (
                    <code
                      key={placeholder}
                      className="rounded-md border bg-background px-2 py-1 text-xs"
                    >
                      {`{{${placeholder}}}`}
                    </code>
                  ))}
                </div>
              </div>

              {notificationMessage && (
                <div className="rounded-xl border border-green-500/30 bg-green-500/5 px-4 py-3 text-sm text-green-700">
                  {notificationMessage}
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setNotificationTemplate(
                      notificationSettings?.defaultTemplate ?? "",
                    )
                  }
                  disabled={notificationSaving}
                >
                  Gunakan Template Default
                </Button>

                <Button
                  type="button"
                  onClick={handleSaveNotificationSettings}
                  disabled={notificationSaving || notificationLoading}
                >
                  {notificationSaving && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Simpan Pengaturan
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
