import { requireSuperAdmin } from "@/lib/auth/admin";
import productGoogleSheetsSyncService from "@/services/product/product-google-sheets-sync.service";
import ProductGoogleSheetsSyncForm from "@/components/admin/products/ProductGoogleSheetsSyncForm";

export const dynamic = "force-dynamic";

export default async function ProductGoogleSheetsPage() {
  await requireSuperAdmin();

  const config =
    await productGoogleSheetsSyncService.getPublicConfig();

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Sinkronisasi Google Spreadsheet
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Gunakan Google Sheets sebagai sumber harga dan stok
          ProductSku PISJO Market. Sheet HARGA JUAL PISJO dapat
          digunakan langsung untuk sinkronisasi harga berdasarkan
          produk, berat, dan kondisi varian.
        </p>
      </div>

      <ProductGoogleSheetsSyncForm
        initialConfig={{
          enabled: config.enabled,
          spreadsheetId:
            config.spreadsheetId,
          sheetName:
            config.sheetName,
          range:
            config.range,
          skuColumn:
            config.skuColumn,
          priceColumn:
            config.priceColumn,
          stockColumn:
            config.stockColumn,
          headerRow:
            config.headerRow,
          lastSyncAt:
            config.lastSyncAt
              ? config.lastSyncAt.toISOString()
              : null,
          lastSyncType:
            config.lastSyncType,
          lastSyncStatus:
            config.lastSyncStatus,
          credentialConfigured:
            config.credentialConfigured,
        }}
      />
    </div>
  );
}
