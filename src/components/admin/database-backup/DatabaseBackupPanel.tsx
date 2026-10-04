 "use client";

import {
  useMemo,
  useState,
} from "react";
import {
  CheckCircle2,
  Database,
  Download,
  HardDrive,
  Loader2,
  RefreshCw,
  ShieldCheck,
  UploadCloud,
  XCircle,
} from "lucide-react";

interface BackupItem {
  id: string;
  filename: string;
  storageKey: string | null;
  sizeBytes: string | null;
  checksum: string | null;
  status: string;
  backupType: string;
  startedAt: string;
  completedAt: string | null;
  verifiedAt: string | null;
  errorMessage: string | null;
  createdById: string | null;
  createdAt: string;
}

interface OperationLock {
  active: boolean;
  operation: "BACKUP" | "RESTORE" | null;
  startedAt: string | null;
  pid: number | null;
}

interface AuditItem {
  event: string;
  operationId: string;
  timestamp: string;
  actorId: string | null;
  backupId: string | null;
  filename: string | null;
  checksum: string | null;
  safetyBackupFilename: string | null;
  message: string | null;
}

interface Health {
  databaseConnected: boolean;
  backupDirectory: string;
  pgDumpConfigured: boolean;
  pgRestoreConfigured: boolean;
  offsiteConfigured: boolean;
  latestBackup: BackupItem | null;
  retention: {
    daily: number;
    weekly: number;
    monthly: number;
    manual: number;
  };
  operationLock: OperationLock;
}

interface Props {
  initialBackups: BackupItem[];
  initialAudits: AuditItem[];
  initialHealth: Health;
}

function formatBytes(value: string | null) {
  const bytes = Number(value ?? 0);

  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "-";
  }

  const units = [
    "B",
    "KB",
    "MB",
    "GB",
    "TB",
  ];

  let index = 0;
  let current = bytes;

  while (
    current >= 1024 &&
    index < units.length - 1
  ) {
    current /= 1024;
    index += 1;
  }

  return `${current.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatDate(value: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat(
    "id-ID",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(new Date(value));
}

function StatusIcon({
  ok,
}: {
  ok: boolean;
}) {
  return ok ? (
    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
  ) : (
    <XCircle className="h-4 w-4 text-red-600" />
  );
}

export default function DatabaseBackupPanel({
  initialBackups,
  initialAudits,
  initialHealth,
}: Props) {
  const [backups, setBackups] =
    useState(initialBackups);

  const [health, setHealth] =
    useState(initialHealth);

  const [audits, setAudits] =
    useState<AuditItem[]>(initialAudits);

  const [loading, setLoading] =
    useState(false);

  const [restoringId, setRestoringId] =
    useState<string | null>(null);

  const [message, setMessage] =
    useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const successCount = useMemo(
    () =>
      backups.filter(
        (item) =>
          item.status === "SUCCESS",
      ).length,
    [backups],
  );

  async function refresh() {
    setLoading(true);
    setError(null);

    try {
      const response =
        await fetch(
          "/api/admin/database-backups",
          {
            cache: "no-store",
          },
        );

      const result =
        (await response.json()) as {
          success: boolean;
          message?: string;
          data?: {
            backups: BackupItem[];
            health: Health;
            audits: AuditItem[];
          };
        };

      if (
        !response.ok ||
        !result.success ||
        !result.data
      ) {
        throw new Error(
          result.message ||
            "Gagal memuat status backup.",
        );
      }

      setBackups(
        result.data.backups,
      );

      setHealth(
        result.data.health,
      );

      setAudits(
        result.data.audits ?? [],
      );
    } catch (refreshError) {
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : "Gagal memuat status backup.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function restoreBackup(
    backup: BackupItem,
  ) {
    const confirmed =
      window.confirm(
        `PERINGATAN: restore akan MENGGANTI data database aktif dengan isi backup "${backup.filename}".

Sistem akan membuat safety backup otomatis terlebih dahulu. Proses restore tetap bersifat destruktif dan dapat mengembalikan data/schema ke kondisi saat backup dibuat.

Lanjutkan restore?`,
      );

    if (!confirmed) {
      return;
    }

    const typedConfirmation =
      window.prompt(
        'Untuk konfirmasi akhir, ketik RESTORE:',
      );

    if (typedConfirmation !== "RESTORE") {
      return;
    }

    setRestoringId(backup.id);
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response =
        await fetch(
          `/api/admin/database-backups/${backup.id}/restore`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              confirmation: "RESTORE",
            }),
          },
        );

      const result =
        (await response.json()) as {
          success: boolean;
          message?: string;
        };

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Restore database gagal.",
        );
      }

      setMessage(
        result.message ||
          "Database berhasil direstore.",
      );

      await refresh();
    } catch (restoreError) {
      setError(
        restoreError instanceof Error
          ? restoreError.message
          : "Restore database gagal.",
      );
    } finally {
      setRestoringId(null);
      setLoading(false);
    }
  }

  async function createBackup() {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response =
        await fetch(
          "/api/admin/database-backups",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              type: "MANUAL",
            }),
          },
        );

      const result =
        (await response.json()) as {
          success: boolean;
          message?: string;
        };

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Backup gagal dibuat.",
        );
      }

      setMessage(
        result.message ||
          "Backup berhasil dibuat.",
      );

      await refresh();
    } catch (backupError) {
      setError(
        backupError instanceof Error
          ? backupError.message
          : "Backup gagal dibuat.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {health.operationLock.active && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">
            Operasi {health.operationLock.operation === "RESTORE" ? "restore" : "backup"} sedang berjalan
          </p>
          <p className="mt-1">
            Backup dan restore lain dikunci sampai operasi selesai. Dimulai {formatDate(health.operationLock.startedAt)}.
          </p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Database
            </span>
            <Database className="h-5 w-5" />
          </div>

          <div className="mt-3 flex items-center gap-2 text-lg font-semibold">
            <StatusIcon
              ok={health.databaseConnected}
            />
            {health.databaseConnected
              ? "Connected"
              : "Disconnected"}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Backup Berhasil
            </span>
            <ShieldCheck className="h-5 w-5" />
          </div>

          <p className="mt-3 text-2xl font-bold">
            {successCount}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Dari {backups.length} record terakhir
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Off-site
            </span>
            <UploadCloud className="h-5 w-5" />
          </div>

          <div className="mt-3 flex items-center gap-2 text-lg font-semibold">
            <StatusIcon
              ok={health.offsiteConfigured}
            />
            {health.offsiteConfigured
              ? "Configured"
              : "Not configured"}
          </div>

          <p className="mt-1 text-xs text-muted-foreground">
            Upload command server
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Backup Terakhir
            </span>
            <HardDrive className="h-5 w-5" />
          </div>

          <p className="mt-3 text-sm font-semibold">
            {health.latestBackup
              ? formatDate(
                  health.latestBackup.completedAt,
                )
              : "Belum ada"}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            {health.latestBackup
              ? formatBytes(
                  health.latestBackup.sizeBytes,
                )
              : "-"}
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-semibold">
              Backup Database
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Backup menjalankan pg_dump,
              memvalidasi archive dengan pg_restore,
              menghitung SHA-256, dan menyimpan metadata.
              Restore hanya untuk Super Admin dan selalu
              membuat safety backup otomatis terlebih dahulu.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={refresh}
              className="inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-medium transition hover:bg-muted disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </button>

            <button
              type="button"
              disabled={
                loading ||
                health.operationLock.active
              }
              onClick={createBackup}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              Backup Sekarang
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold">
            Riwayat Backup
          </h2>
        </div>

        {backups.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Belum ada backup database.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">
                    File
                  </th>
                  <th className="px-4 py-3 text-left font-medium">
                    Tipe
                  </th>
                  <th className="px-4 py-3 text-left font-medium">
                    Ukuran
                  </th>
                  <th className="px-4 py-3 text-left font-medium">
                    Waktu
                  </th>
                  <th className="px-4 py-3 text-left font-medium">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody>
                {backups.map((backup) => (
                  <tr
                    key={backup.id}
                    className="border-b last:border-b-0 hover:bg-muted/30"
                  >
                    <td className="px-4 py-4">
                      <div className="max-w-[320px] truncate font-mono text-xs">
                        {backup.filename}
                      </div>

                      {backup.checksum && (
                        <div className="mt-1 max-w-[320px] truncate text-[11px] text-muted-foreground">
                          SHA256 {backup.checksum}
                        </div>
                      )}

                      {backup.errorMessage && (
                        <div className="mt-1 max-w-[420px] text-xs text-red-600">
                          {backup.errorMessage}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium">
                        {backup.backupType}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      {formatBytes(
                        backup.sizeBytes,
                      )}
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      {formatDate(
                        backup.completedAt ||
                          backup.startedAt,
                      )}
                    </td>

                    <td className="px-4 py-4">
                      {backup.status ===
                      "SUCCESS" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                          <XCircle className="h-3.5 w-3.5" />
                          {backup.status}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4 text-right">
                      {backup.status ===
                        "SUCCESS" && (
                        <div className="flex justify-end gap-2">
                          <a
                            href={`/api/admin/database-backups/${backup.id}/download`}
                            className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-medium transition hover:bg-muted"
                          >
                            <Download className="h-4 w-4" />
                            Download
                          </a>

                          <button
                            type="button"
                            disabled={
                              loading ||
                              restoringId !== null ||
                              health.operationLock.active
                            }
                            onClick={() =>
                              restoreBackup(backup)
                            }
                            className="inline-flex h-9 items-center gap-2 rounded-lg border border-amber-300 px-3 text-xs font-medium text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {restoringId ===
                            backup.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <ShieldCheck className="h-4 w-4" />
                            )}
                            Restore
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold">Aktivitas Operasi</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Audit lokal tetap berada di storage backup sehingga tidak ikut hilang saat database direstore.
          </p>
        </div>

        {audits.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">
            Belum ada aktivitas backup/restore.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Waktu</th>
                  <th className="px-4 py-3 text-left font-medium">Operasi</th>
                  <th className="px-4 py-3 text-left font-medium">File</th>
                  <th className="px-4 py-3 text-left font-medium">Hasil</th>
                </tr>
              </thead>
              <tbody>
                {audits.map((audit) => {
                  const success =
                    audit.event === "BACKUP_SUCCESS" ||
                    audit.event === "RESTORE_SUCCESS";
                  const started =
                    audit.event.endsWith("STARTED");

                  return (
                    <tr key={`${audit.operationId}-${audit.event}-${audit.timestamp}`} className="border-b last:border-b-0">
                      <td className="px-4 py-3 whitespace-nowrap">
                        {formatDate(audit.timestamp)}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {audit.event.startsWith("RESTORE") ? "Restore" : "Backup"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-[360px] truncate font-mono text-xs">
                          {audit.filename || "-"}
                        </div>
                        {audit.safetyBackupFilename && (
                          <div className="mt-1 max-w-[360px] truncate text-[11px] text-muted-foreground">
                            Safety: {audit.safetyBackupFilename}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={success ? "text-emerald-700" : started ? "text-amber-700" : "text-red-700"}>
                          {success ? "SUCCESS" : started ? "RUNNING" : "FAILED"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-xl border bg-muted/30 p-5">
        <h2 className="font-semibold">
          Retention
        </h2>

        <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <span className="text-muted-foreground">
              Daily
            </span>
            <p className="font-medium">
              {health.retention.daily} backup
            </p>
          </div>

          <div>
            <span className="text-muted-foreground">
              Weekly
            </span>
            <p className="font-medium">
              {health.retention.weekly} backup
            </p>
          </div>

          <div>
            <span className="text-muted-foreground">
              Monthly
            </span>
            <p className="font-medium">
              {health.retention.monthly} backup
            </p>
          </div>

          <div>
            <span className="text-muted-foreground">
              Manual
            </span>
            <p className="font-medium">
              {health.retention.manual} backup
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
