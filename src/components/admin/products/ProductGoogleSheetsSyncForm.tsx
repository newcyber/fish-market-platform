"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  FileSpreadsheet,
  Loader2,
  PlugZap,
  RefreshCw,
  Save,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface ConfigValue {
  enabled: boolean;
  spreadsheetId: string | null;
  sheetName: string;
  range: string;
  skuColumn: string;
  priceColumn: string;
  stockColumn: string;
  headerRow: number;
  lastSyncAt: string | null;
  lastSyncType: string | null;
  lastSyncStatus: string | null;
  credentialConfigured: boolean;
}

interface SheetOption {
  sheetId: number;
  title: string;
  index?: number;
}

interface Props {
  initialConfig: ConfigValue;
}

const PISJO_SYNC_DEFAULTS = {
  sheetName: "PISJO_SYNC",
  range: "A1:F20000",
  skuColumn: "A",
  priceColumn: "E",
  stockColumn: "F",
  headerRow: 1,
} as const;

const HARGA_JUAL_PISJO_DEFAULTS = {
  sheetName: "HARGA JUAL PISJO",
  range: "A1:Q20000",
  skuColumn: "A",
  priceColumn: "H",
  stockColumn: "Q",
  headerRow: 2,
} as const;

export default function ProductGoogleSheetsSyncForm({ initialConfig }: Props) {
  const [form, setForm] = useState<ConfigValue>(initialConfig);
  const [sheets, setSheets] = useState<SheetOption[]>([]);
  const [loadingSheets, setLoadingSheets] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  function update<K extends keyof ConfigValue>(key: K, value: ConfigValue[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const spreadsheetId = useMemo(
    () => form.spreadsheetId?.trim() ?? "",
    [form.spreadsheetId],
  );

  const isHargaJualPisjo =
    form.sheetName.trim().toUpperCase() ===
    HARGA_JUAL_PISJO_DEFAULTS.sheetName.toUpperCase();

  async function loadSheets() {
    if (!spreadsheetId) {
      toast.error("Spreadsheet belum diisi", {
        description: "Masukkan URL atau Spreadsheet ID terlebih dahulu.",
      });
      return;
    }

    setLoadingSheets(true);

    try {
      const response = await fetch(
        `/api/admin/products/google-sheets/sheets?spreadsheetId=${encodeURIComponent(spreadsheetId)}`,
        { cache: "no-store" },
      );

      const payload = (await response.json()) as {
        success?: boolean;
        message?: string;
        data?: SheetOption[];
      };

      if (!response.ok || payload.success !== true) {
        throw new Error(payload.message ?? "Gagal mengambil daftar sheet.");
      }

      const nextSheets = payload.data ?? [];
      setSheets(nextSheets);

      const currentSheetIsValid =
        !!form.sheetName && nextSheets.some((sheet) => sheet.title === form.sheetName);
      const preferredSheet = nextSheets.find(
        (sheet) => sheet.title === PISJO_SYNC_DEFAULTS.sheetName,
      );
      const selectedSheet = currentSheetIsValid
        ? form.sheetName
        : preferredSheet?.title ?? nextSheets[0]?.title ?? "";

      setForm((current) => {
        const isPisjoSync = selectedSheet === PISJO_SYNC_DEFAULTS.sheetName;
        const isHargaJualPisjo =
          selectedSheet === HARGA_JUAL_PISJO_DEFAULTS.sheetName;

        return {
          ...current,
          sheetName: selectedSheet,
          ...(isHargaJualPisjo
            ? {
                range: HARGA_JUAL_PISJO_DEFAULTS.range,
                skuColumn: HARGA_JUAL_PISJO_DEFAULTS.skuColumn,
                priceColumn: HARGA_JUAL_PISJO_DEFAULTS.priceColumn,
                stockColumn: HARGA_JUAL_PISJO_DEFAULTS.stockColumn,
                headerRow: HARGA_JUAL_PISJO_DEFAULTS.headerRow,
              }
            : isPisjoSync
              ? {
                  range: PISJO_SYNC_DEFAULTS.range,
                  skuColumn: PISJO_SYNC_DEFAULTS.skuColumn,
                  priceColumn: PISJO_SYNC_DEFAULTS.priceColumn,
                  stockColumn: PISJO_SYNC_DEFAULTS.stockColumn,
                  headerRow: PISJO_SYNC_DEFAULTS.headerRow,
                }
              : {}),
        };
      });

      toast.success("Daftar sheet berhasil dimuat", {
        description: `${nextSheets.length} sheet ditemukan.`,
      });
    } catch (error) {
      toast.error("Gagal memuat sheet", {
        description: error instanceof Error ? error.message : "Terjadi kesalahan.",
      });
    } finally {
      setLoadingSheets(false);
    }
  }

  async function save() {
    setSaving(true);

    try {
      const response = await fetch("/api/admin/products/google-sheets/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: form.enabled,
          spreadsheetId: form.spreadsheetId,
          sheetName: form.sheetName,
          range: form.range,
          skuColumn: form.skuColumn,
          priceColumn: form.priceColumn,
          stockColumn: form.stockColumn,
          headerRow: form.headerRow,
        }),
      });

      const payload = (await response.json()) as {
        success?: boolean;
        message?: string;
      };

      if (!response.ok || payload.success !== true) {
        throw new Error(payload.message ?? "Gagal menyimpan konfigurasi.");
      }

      toast.success("Konfigurasi tersimpan", {
        description: "Konfigurasi Google Spreadsheet siap digunakan.",
      });
    } catch (error) {
      toast.error("Gagal menyimpan konfigurasi", {
        description: error instanceof Error ? error.message : "Terjadi kesalahan.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function testConnection() {
    setTesting(true);

    try {
      const response = await fetch("/api/admin/products/google-sheets/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test",
          enabled: form.enabled,
          spreadsheetId: form.spreadsheetId,
          sheetName: form.sheetName,
          range: form.range,
          skuColumn: form.skuColumn,
          priceColumn: form.priceColumn,
          stockColumn: form.stockColumn,
          headerRow: form.headerRow,
        }),
      });

      const payload = (await response.json()) as {
        success?: boolean;
        message?: string;
        data?: {
          source?: "SKU" | "HARGA_JUAL_PISJO";
          rowCount?: number;
          priceCellCount?: number;
          invalidRowCount?: number;
          invalidRows?: Array<{
            rowNumber: number;
            reason: string;
          }>;
          headers?: string[];
          availableSheets?: SheetOption[];
          detectedPriceColumns?: Array<{
            column: string;
            weightLabel: string;
            conditionLabel: string;
          }>;
        };
      };

      if (!response.ok || payload.success !== true) {
        throw new Error(payload.message ?? "Koneksi Google Sheets gagal.");
      }

      if (payload.data?.availableSheets) {
        setSheets(payload.data.availableSheets);
      }

      const invalidRows = payload.data?.invalidRows ?? [];

      const invalidDescription =
        invalidRows.length > 0
          ? ` • ${invalidRows
              .map((row) => `Baris ${row.rowNumber}: ${row.reason}`)
              .join(" • ")}`
          : "";

      const description =
        payload.data?.source === "HARGA_JUAL_PISJO"
          ? `${payload.data.priceCellCount ?? 0} harga PISJO terdeteksi • ${
              payload.data.detectedPriceColumns?.length ?? 0
            } kombinasi varian ditemukan • ${
              payload.data.invalidRowCount ?? 0
            } baris invalid${invalidDescription}`
          : `${payload.data?.rowCount ?? 0} baris data ditemukan. Header: ${
            (payload.data?.headers ?? []).join(", ") || "-"
            }`;

            toast.success("Koneksi berhasil", {
              description,
              duration: 8000,
            });
          } catch (error) {
            toast.error("Koneksi gagal", {
              description: error instanceof Error ? error.message : "Terjadi kesalahan.",
              duration: 9000,
            });
          } finally {
            setTesting(false);
          }
        }

  const spreadsheetHelpUrl =
    "https://console.cloud.google.com/apis/library/sheets.googleapis.com";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlugZap className="h-5 w-5 text-primary" />
            Koneksi Google Spreadsheet
          </CardTitle>
          <CardDescription>
            PISJO membaca harga dan stok ProductSku dari tab khusus sinkronisasi menggunakan Service Account di server.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
            <div>
              <p className="font-medium">Aktifkan sinkronisasi</p>
              <p className="text-sm text-muted-foreground">
                Jika aktif, menu Sinkronisasi pada halaman Produk dapat digunakan oleh Admin.
              </p>
            </div>
            <Switch checked={form.enabled} onCheckedChange={(checked) => update("enabled", checked)} />
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
            <div className="flex items-start gap-3">
              <FileSpreadsheet className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                {isHargaJualPisjo ? (
                  <>
                    <p className="font-semibold">
                      Sumber aktif: HARGA JUAL PISJO
                    </p>
                    <p className="mt-1 text-blue-900/80">
                      PISJO mengambil <strong>harga</strong> langsung dari kolom PISJO pada sheet operasional ini.
                      Pencocokan dilakukan berdasarkan <strong>nama produk + berat + kondisi</strong> seperti Utuh/Bersih,
                      sehingga SKU tidak perlu ditambahkan ke spreadsheet.
                    </p>
                    <p className="mt-2 text-blue-900/80">
                      <strong>STOK/KG tidak digunakan untuk sinkronisasi SKU</strong> karena nilainya merupakan stok produk
                      dalam kilogram, bukan stok unit untuk setiap kombinasi varian.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold">Sumber aktif: PISJO_SYNC</p>
                    <p className="mt-1 text-blue-900/80">
                      Gunakan <strong>PISJO_SYNC</strong> jika membutuhkan sinkronisasi harga dan stok per SKU.
                      Format: <strong>SKU | PRODUK | VARIAN | STATUS | HARGA | STOK</strong>.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="spreadsheetId">Spreadsheet ID / URL</Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="spreadsheetId"
                  value={form.spreadsheetId ?? ""}
                  onChange={(event) => {
                    const value = event.target.value;

                    update("spreadsheetId", value);
                    setSheets([]);
                  }}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void loadSheets()}
                  disabled={loadingSheets || saving || testing || !spreadsheetId}
                  className="shrink-0"
                >
                  {loadingSheets ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Muat Sheet
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Share spreadsheet kepada email Service Account dengan akses Viewer.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sheetName">Nama Sheet</Label>
              {sheets.length > 0 ? (
                <Select
                  value={form.sheetName}
                  onValueChange={(value) => {
                    if (value) update("sheetName", value);
                  }}
                >
                  <SelectTrigger id="sheetName">
                    <SelectValue placeholder="Pilih sheet" />
                  </SelectTrigger>
                  <SelectContent>
                    {sheets.map((sheet) => (
                      <SelectItem key={sheet.sheetId} value={sheet.title}>
                        {sheet.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="sheetName"
                  value={form.sheetName}
                  onChange={(event) => update("sheetName", event.target.value)}
                  placeholder="PISJO_SYNC"
                />
              )}
              <p className="text-xs text-muted-foreground">
                Klik “Muat Sheet” untuk memilih tab yang benar-benar tersedia di spreadsheet.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="range">Range</Label>
              <Input
                id="range"
                value={form.range}
                onChange={(event) => update("range", event.target.value.toUpperCase())}
                placeholder="A1:C20000"
              />
              <p className="text-xs text-muted-foreground">
                Untuk PISJO_SYNC gunakan <code>A1:F20000</code>. Nama sheet tidak perlu ditulis di range.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="headerRow">Baris Header</Label>
              <Input
                id="headerRow"
                type="number"
                min={1}
                max={100}
                value={form.headerRow}
                onChange={(event) => update("headerRow", Number(event.target.value))}
              />
            </div>
          </div>

          <div>
            <h3 className="font-semibold">Mapping Kolom</h3>

            {isHargaJualPisjo ? (
              <p className="mt-1 text-sm text-muted-foreground">
                Mapping harga PISJO dibaca otomatis dari header bertingkat.
                Contoh: <strong>PISJO 1KG + UTUH</strong> dan <strong>PISJO 1KG + BERSIH</strong>.
              </p>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">
                Format PISJO_SYNC: A = SKU, B = Produk, C = Varian, D = Status, E = Harga, F = Stok.
              </p>
            )}

            {!isHargaJualPisjo && (
              <div className="mt-4 grid gap-5 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="skuColumn">SKU</Label>
                  <Input id="skuColumn" value={form.skuColumn} onChange={(event) => update("skuColumn", event.target.value.toUpperCase())} placeholder="A" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priceColumn">Harga</Label>
                  <Input id="priceColumn" value={form.priceColumn} onChange={(event) => update("priceColumn", event.target.value.toUpperCase())} placeholder="B" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stockColumn">Stok</Label>
                  <Input id="stockColumn" value={form.stockColumn} onChange={(event) => update("stockColumn", event.target.value.toUpperCase())} placeholder="C" />
                </div>
              </div>
            )}

            {isHargaJualPisjo && (
              <div className="mt-4 rounded-lg border bg-muted/30 p-4 text-sm">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Nama Produk</p>
                    <p className="font-mono font-medium">NAMA PRODUK</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Harga</p>
                    <p className="font-mono font-medium">PISJO × UTUH/BERSIH</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Stok</p>
                    <p className="font-medium text-muted-foreground">Tidak diambil</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 rounded-lg border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              {form.credentialConfigured ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
              ) : (
                <XCircle className="mt-0.5 h-5 w-5 text-destructive" />
              )}
              <div>
                <p className="font-medium">Credential Service Account</p>
                <p className="text-sm text-muted-foreground">
                  {form.credentialConfigured
                    ? "Credential server sudah terdeteksi."
                    : "Credential Google belum tersedia di environment server."}
                </p>
              </div>
            </div>
            <a href={spreadsheetHelpUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
              Google Cloud API
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => void testConnection()} disabled={testing || saving}>
              {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlugZap className="mr-2 h-4 w-4" />}
              Test Koneksi
            </Button>
            <Button type="button" onClick={() => void save()} disabled={saving || testing}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Simpan Konfigurasi
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {isHargaJualPisjo
              ? "Format Sheet HARGA JUAL PISJO"
              : "Format Spreadsheet PISJO_SYNC"}
          </CardTitle>
          <CardDescription>
            {isHargaJualPisjo
              ? "Harga dibaca dari kolom PISJO berdasarkan nama produk, berat, dan kondisi varian."
              : "SKU harus sama persis dengan SKU varian PISJO Market dan harus unik."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            {isHargaJualPisjo ? (
              <table className="w-full min-w-[720px] text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">NAMA PRODUK</th>
                    <th className="px-4 py-3 text-left font-medium">PISJO 1KG</th>
                    <th className="px-4 py-3 text-left font-medium">PISJO 700–800 GR</th>
                    <th className="px-4 py-3 text-left font-medium">PISJO 500 GRAM</th>
                    <th className="px-4 py-3 text-left font-medium">PISJO 250 GRAM</th>
                    <th className="px-4 py-3 text-left font-medium">STOK/KG</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="px-4 py-3 font-medium">BANDENG</td>
                    <td className="px-4 py-3">44.000 / 49.000</td>
                    <td className="px-4 py-3">37.000 / 41.000</td>
                    <td className="px-4 py-3">23.000 / 26.000</td>
                    <td className="px-4 py-3">-</td>
                    <td className="px-4 py-3">1</td>
                  </tr>
                  <tr className="border-t">
                    <td className="px-4 py-3 font-medium">KERAPU</td>
                    <td className="px-4 py-3">38.000 / 43.000</td>
                    <td className="px-4 py-3">31.500 / 34.500</td>
                    <td className="px-4 py-3">23.500 / 26.500</td>
                    <td className="px-4 py-3">-</td>
                    <td className="px-4 py-3">8</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <table className="w-full min-w-[520px] text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">SKU</th>
                    <th className="px-4 py-3 text-left font-medium">PRODUK</th>
                    <th className="px-4 py-3 text-left font-medium">VARIAN</th>
                    <th className="px-4 py-3 text-left font-medium">STATUS</th>
                    <th className="px-4 py-3 text-left font-medium">HARGA</th>
                    <th className="px-4 py-3 text-left font-medium">STOK</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="px-4 py-3 font-mono">SKU-AKTUAL</td>
                    <td className="px-4 py-3">Bandeng</td>
                    <td className="px-4 py-3">1 KG | Utuh</td>
                    <td className="px-4 py-3">Aktif</td>
                    <td className="px-4 py-3">44000</td>
                    <td className="px-4 py-3">100</td>
                  </tr>
                  <tr className="border-t">
                    <td className="px-4 py-3 font-mono">SKU-AKTUAL-2</td>
                    <td className="px-4 py-3">Bandeng</td>
                    <td className="px-4 py-3">1 KG | Dibersihkan</td>
                    <td className="px-4 py-3">Aktif</td>
                    <td className="px-4 py-3">49000</td>
                    <td className="px-4 py-3">80</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              {isHargaJualPisjo
                ? "Jika nama produk, berat, atau kondisi tidak cocok secara unik dengan ProductSku PISJO Market, harga tidak akan diubah. Stok/KG sengaja tidak dipaksakan ke setiap varian."
                : "Baris SKU duplikat, harga/stok tidak valid, SKU tidak ditemukan, dan SKU tidak aktif tidak akan menimpa data valid."}
            </p>
          </div>
        </CardContent>
      </Card>

      {form.lastSyncAt && (
        <Card>
          <CardHeader>
            <CardTitle>Sinkronisasi Terakhir</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>{new Date(form.lastSyncAt).toLocaleString("id-ID")}</p>
            <p className="mt-1 text-muted-foreground">
              Tipe: {form.lastSyncType ?? "-"} • Status: {form.lastSyncStatus ?? "-"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
