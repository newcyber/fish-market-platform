"use client";

import { MessageCircle, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface CourierNotificationSettings {
  enabled: boolean;
  events: {
    ASSIGNMENT: boolean;
  };
}

interface ResponsePayload {
  success: boolean;
  data?: CourierNotificationSettings;
  error?: string;
}

export function CourierWapiSettings() {
  const [settings, setSettings] =
    useState<CourierNotificationSettings | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [assignmentEnabled, setAssignmentEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch(
        "/api/admin/settings/wapi/courier-notification",
        {
          cache: "no-store",
        },
      );

      const result = (await response.json()) as ResponsePayload;

      if (!response.ok || !result.success || !result.data) {
        throw new Error(
          result.error ||
            "Gagal mengambil pengaturan notifikasi WhatsApp courier.",
        );
      }

      setSettings(result.data);
      setEnabled(result.data.enabled);
      setAssignmentEnabled(result.data.events.ASSIGNMENT);
      setMessage(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil pengaturan notifikasi WhatsApp courier.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(
        "/api/admin/settings/wapi/courier-notification",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            enabled,
            assignment: assignmentEnabled,
          }),
        },
      );

      const result = (await response.json()) as ResponsePayload;

      if (!response.ok || !result.success || !result.data) {
        throw new Error(
          result.error ||
            "Gagal menyimpan pengaturan notifikasi WhatsApp courier.",
        );
      }

      setSettings(result.data);
      setEnabled(result.data.enabled);
      setAssignmentEnabled(result.data.events.ASSIGNMENT);
      setMessage(
        result.data.enabled
          ? "Notifikasi WhatsApp courier berhasil diaktifkan."
          : "Notifikasi WhatsApp courier berhasil dinonaktifkan.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menyimpan pengaturan notifikasi WhatsApp courier.",
      );
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [load]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-500/10 text-green-600">
            <MessageCircle className="h-6 w-6" />
          </div>

          <div>
            <h2 className="font-semibold">Notifikasi WhatsApp Courier</h2>
            <p className="text-sm text-muted-foreground">
              Kontrol WhatsApp transaksional untuk courier internal Pisjo
              Market.
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Memuat pengaturan courier...
          </div>
        ) : (
          <>
            <label className="flex items-center justify-between gap-4 rounded-xl border p-4">
              <div className="min-w-0">
                <p className="font-medium">
                  Aktifkan WhatsApp courier
                </p>
                <p className="text-sm text-muted-foreground">
                  Jika OFF, seluruh WhatsApp transaksional courier diblokir.
                  Notifikasi database dan Web Push tetap berjalan.
                </p>
              </div>

              <input
                type="checkbox"
                checked={enabled}
                onChange={(event) => setEnabled(event.target.checked)}
                disabled={saving}
                className="h-5 w-5 accent-green-600"
              />
            </label>

            <div
              className={
                enabled
                  ? "rounded-xl border border-green-500/30 bg-green-500/5 px-4 py-3 text-sm text-green-700"
                  : "rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-700"
              }
            >
              {enabled
                ? "ON — WhatsApp courier aktif."
                : "OFF — WhatsApp courier diblokir. Notification in-app dan Web Push tetap aktif."}
            </div>

            <label className="flex items-center justify-between gap-4 rounded-xl border p-4">
              <div className="min-w-0">
                <p className="font-medium">Courier ditugaskan</p>
                <p className="text-sm text-muted-foreground">
                  Kirim WhatsApp ketika admin berhasil menugaskan order kepada
                  courier.
                </p>
              </div>

              <input
                type="checkbox"
                checked={assignmentEnabled}
                onChange={(event) =>
                  setAssignmentEnabled(event.target.checked)
                }
                disabled={saving || !enabled}
                className="h-5 w-5 accent-green-600"
              />
            </label>

            {settings && !settings.enabled && (
              <p className="text-xs text-muted-foreground">
                Event tetap tersimpan, tetapi tidak akan dikirim selama switch
                global OFF.
              </p>
            )}

            {message && (
              <div className="rounded-xl border border-green-500/30 bg-green-500/5 px-4 py-3 text-sm text-green-700">
                {message}
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex justify-end">
              <Button
                type="button"
                onClick={save}
                disabled={saving || loading}
              >
                {saving && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Simpan Pengaturan Courier
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default CourierWapiSettings;
