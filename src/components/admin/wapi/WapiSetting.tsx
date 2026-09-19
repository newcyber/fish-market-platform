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
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";

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
  const [status, setStatus] =
    useState<WapiStatus | null>(null);

  const [qr, setQr] =
    useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [qrLoading, setQrLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [error, setError] =
    useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const response = await fetch(
        "/api/admin/settings/wapi",
        {
          cache: "no-store",
        },
      );

      const result =
        (await response.json()) as StatusResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ||
            "Gagal mengambil status WhatsApp.",
        );
      }

      setStatus(result.data ?? null);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil status WhatsApp.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const loadQr = useCallback(async () => {
    setQrLoading(true);

    try {
      const response = await fetch(
        "/api/admin/settings/wapi/qr",
        {
          cache: "no-store",
        },
      );

      const result =
        (await response.json()) as QrResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ||
            "Gagal mengambil QR WhatsApp.",
        );
      }

      setQr(result.data?.qr ?? null);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil QR WhatsApp.",
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
      const response = await fetch(
        "/api/admin/settings/wapi/logout",
        {
          method: "POST",
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ||
            "Gagal memutus koneksi WhatsApp.",
        );
      }

      setQr(null);

      await loadStatus();
      await loadQr();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal memutus koneksi WhatsApp.",
      );
    } finally {
      setLogoutLoading(false);
    }
  };

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
              <h2 className="font-semibold">
                Koneksi WhatsApp
              </h2>

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
                    <p className="font-medium">
                      WhatsApp Terhubung
                    </p>

                    <p className="text-sm text-muted-foreground">
                      Nomor WhatsApp siap digunakan untuk
                      pengiriman pesan.
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

                    <span className="text-sm">
                      Menyiapkan QR Code...
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 text-center text-muted-foreground">
                    <WifiOff className="h-8 w-8" />

                    <p className="text-sm">
                      QR Code belum tersedia.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col justify-center space-y-5">
                <div>
                  <h3 className="text-lg font-semibold">
                    Hubungkan WhatsApp
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Buka WhatsApp pada smartphone Anda,
                    masuk ke Perangkat Tertaut, kemudian
                    scan QR Code di sebelah kiri.
                  </p>
                </div>

                <div className="rounded-xl bg-muted/40 p-4 text-sm">
                  <ol className="list-decimal space-y-2 pl-5">
                    <li>Buka aplikasi WhatsApp.</li>
                    <li>
                      Pilih{" "}
                      <strong>Perangkat Tertaut</strong>.
                    </li>
                    <li>
                      Pilih{" "}
                      <strong>Tautkan Perangkat</strong>.
                    </li>
                    <li>
                      Scan QR Code yang tampil di halaman
                      ini.
                    </li>
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
    </div>
  );
}
