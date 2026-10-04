import { requireSuperAdmin } from "@/lib/auth/admin";
import databaseBackupService from "@/services/database-backup/database-backup.service";
import DatabaseBackupPanel from "@/components/admin/database-backup/DatabaseBackupPanel";

export const dynamic = "force-dynamic";

export default async function AdminDatabaseBackupsPage() {
  await requireSuperAdmin();

  const [
    backups,
    health,
    audits,
  ] = await Promise.all([
    databaseBackupService.listBackups(50),
    databaseBackupService.getHealth(),
    databaseBackupService.listAuditEvents(30),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Database Backup
        </h1>

        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Buat, pantau, dan unduh backup PostgreSQL PISJO
          Market. Backup menggunakan format custom PostgreSQL,
          diverifikasi dengan pg_restore, dan dapat dikirim ke
          storage off-site melalui konfigurasi server.
        </p>
      </div>

      <DatabaseBackupPanel
        initialBackups={backups}
        initialAudits={audits}
        initialHealth={{
          ...health,
          latestBackup:
            health.latestBackup
              ? databaseBackupService.serialize(
                  health.latestBackup,
                )
              : null,
        }}
      />
    </div>
  );
}
