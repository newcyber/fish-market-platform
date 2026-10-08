import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  isGoogleSheetsCredentialConfigured,
  listGoogleSheets,
  readGoogleSheetValues,
} from "@/services/integrations/google-sheets.service";

export type ProductGoogleSheetsSyncType =
  | "PRICE"
  | "STOCK"
  | "PRICE_STOCK";

export interface ProductGoogleSheetsSyncTemplateRow {
  sku: string;
  product: string;
  variant: string;
  status: string;
  price: number;
  stock: number;
}

export interface ProductGoogleSheetsConfigInput {
  enabled: boolean;
  spreadsheetId?: string | null;
  sheetName: string;
  range: string;
  skuColumn: string;
  priceColumn: string;
  stockColumn: string;
  headerRow: number;
}

interface SyncRow {
  rowNumber: number;
  sku: string;
  price?: number;
  stock?: number;
}

interface InvalidRow {
  rowNumber: number;
  sku?: string;
  reason: string;
}

interface PisjoPriceCell {
  rowNumber: number;
  productName: string;
  weightLabel: string;
  conditionLabel: string;
  price: number;
  column: string;
}


interface PisjoStockRow {
  rowNumber: number;
  productName: string;
  stockKg: number;
}

interface PisjoSkuCandidate {
  id: string;
  sku: string;
  productId: string;
  price: Prisma.Decimal;
  productName: string;
  productTokens: string[];
  weightTokens: string[];
  conditionTokens: string[];
}

interface PisjoProductCandidate {
  id: string;
  name: string;
  productTokens: string[];
}

const HARGA_JUAL_PISJO_SHEET = "HARGA JUAL PISJO";

/**
 * HARGA JUAL PISJO adalah sumber harga saja.
 *
 * Sebelum sheet harga khusus ditambahkan, konfigurasi default aplikasi
 * menggunakan PISJO_SYNC untuk sinkronisasi SKU/stock (A=SKU, B=harga,
 * C=stock). Ketika admin mengganti sheetName menjadi HARGA JUAL PISJO,
 * konfigurasi tunggal tersebut tidak boleh membuat operasi STOCK ikut
 * membaca HARGA JUAL PISJO.
 *
 * Untuk menjaga kompatibilitas dengan schema konfigurasi saat ini tanpa
 * migration tambahan, STOCK pada konfigurasi HARGA JUAL PISJO kembali
 * menggunakan sheet stock legacy PISJO_SYNC.
 */

function isHargaJualPisjoSheet(sheetName: string): boolean {
  return sheetName.trim().localeCompare(HARGA_JUAL_PISJO_SHEET, "id-ID", {
    sensitivity: "base",
  }) === 0;
}

function normalizeMatchText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Canonicalize product-name tokens without destroying meaningful
 * differentiators such as size, grade, or shorthand.
 *
 * Important examples:
 *   "2X"   -> "2X"
 *   "2 X"  -> "2X"
 *   "2x"   -> "2X"
 *
 * This matters for product names such as:
 *   VANAME SUPER JUMBO 2X (SJ)
 */
function normalizeProductMatchText(value: string): string {
  return normalizeMatchText(value)
    .replace(/\b(\d+)\s*X\b/g, "$1X")
    .replace(/\bX\s*(\d+)\b/g, "X$1")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Product names in HARGA JUAL PISJO are often short names such as
 * "BANDENG", while Product.name in the marketplace can contain
 * merchandising descriptors such as "Ikan Bandeng Fresh Frozen".
 *
 * We intentionally remove only generic descriptors here. We do NOT use
 * a blind `includes()` match because that can incorrectly map e.g.
 * BANDENG to both BANDENG and BANDENG HITAM.
 */
const GENERIC_PRODUCT_TOKENS = new Set([
  "IKAN",
  "FRESH",
  "FROZEN",
  "SEGAR",
  "BEKU",
  "FRESHFROZEN",
  "FROZENFRESH",
]);

function getProductMatchTokens(value: string): string[] {
  return normalizeProductMatchText(value)
    .split(" ")
    .filter((token) => token.length > 1)
    .filter((token) => !GENERIC_PRODUCT_TOKENS.has(token));
}

function scorePisjoProductName(
  sourceProductName: string,
  candidateProductName: string,
): number {
  const sourceNormalized = normalizeProductMatchText(sourceProductName);
  const candidateNormalized = normalizeProductMatchText(candidateProductName);
  const sourceTokens = getProductMatchTokens(sourceProductName);
  const candidateTokens = getProductMatchTokens(candidateProductName);

  if (!sourceNormalized || sourceTokens.length === 0 || !candidateNormalized) {
    return 0;
  }

  if (candidateNormalized === sourceNormalized) {
    return 300;
  }

  if (candidateTokens.length === 0) {
    return 0;
  }

  const sourceSet = new Set(sourceTokens);
  const candidateSet = new Set(candidateTokens);

  const sourceSubsetOfCandidate = sourceTokens.every((token) =>
    candidateSet.has(token),
  );

  const candidateSubsetOfSource = candidateTokens.every((token) =>
    sourceSet.has(token),
  );

  // A short spreadsheet name may be a subset of the marketplace name,
  // e.g. BANDENG -> IKAN BANDENG FRESH FROZEN.
  if (sourceSubsetOfCandidate) {
    return (
      220 -
      Math.max(candidateTokens.length - sourceTokens.length, 0) * 2
    );
  }

  // Also allow the spreadsheet to contain a fuller descriptive name.
  if (candidateSubsetOfSource) {
    return (
      210 -
      Math.max(sourceTokens.length - candidateTokens.length, 0) * 2
    );
  }

  return 0;
}

function resolvePisjoProductNameCandidates(
  sourceProductName: string,
  candidates: PisjoProductCandidate[],
): PisjoProductCandidate[] {
  const scored = candidates
    .map((candidate) => ({
      candidate,
      score: scorePisjoProductName(sourceProductName, candidate.name),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    return [];
  }

  const bestScore = scored[0]?.score ?? 0;

  return scored
    .filter((item) => item.score === bestScore)
    .map((item) => item.candidate);
}

function normalizeConditionToken(value: string): string | null {
  const normalized = normalizeMatchText(value);

  if (/\b(UTUH|WHOLE)\b/.test(normalized)) {
    return "UTUH";
  }

  if (/\b(BERSIH|DIBERSIHKAN|CLEAN|CLEANED)\b/.test(normalized)) {
    return "BERSIH";
  }

  return null;
}

function normalizeWeightToken(value: string): string | null {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[–—−]/g, "-")
    .replace(/\s*-\s*/g, "-")
    .replace(/[^A-Z0-9.,-]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

  const match = normalized.match(
    /(\d+(?:[.,]\d+)?(?:\s*-\s*\d+(?:[.,]\d+)?)?)\s*(KG|KILO|GRAM|GR|G)\b/,
  );

  if (!match) {
    return null;
  }

  const rawValue = match[1].replace(/\s+/g, "");
  const unit = match[2];

  const convertOne = (raw: string): number => {
    const valueNumber = Number(raw.replace(",", "."));
    if (!Number.isFinite(valueNumber)) return NaN;

    return /^(KG|KILO)$/.test(unit)
      ? Math.round(valueNumber * 1000)
      : Math.round(valueNumber);
  };

  const parts = rawValue.split("-");
  const grams = parts.map(convertOne);

  if (grams.some((value) => !Number.isFinite(value))) {
    return null;
  }

  return `${grams.join("-")}G`;
}

function extractVariantTokens(labels: string[]): {
  weightTokens: string[];
  conditionTokens: string[];
} {
  const weightTokens = new Set<string>();
  const conditionTokens = new Set<string>();

  for (const label of labels) {
    const weight = normalizeWeightToken(label);
    if (weight) weightTokens.add(weight);

    const condition = normalizeConditionToken(label);
    if (condition) conditionTokens.add(condition);
  }

  return {
    weightTokens: [...weightTokens],
    conditionTokens: [...conditionTokens],
  };
}

function columnNumberToLetters(index: number): string {
  let value = index + 1;
  let result = "";

  while (value > 0) {
    const remainder = (value - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    value = Math.floor((value - 1) / 26);
  }

  return result;
}

function parsePisjoPriceSheet(
  values: string[][],
  headerRow: number,
): {
  rows: PisjoPriceCell[];
  invalidRows: InvalidRow[];
  detectedColumns: Array<{
    column: string;
    weightLabel: string;
    conditionLabel: string;
  }>;
} {
  if (values.length === 0) {
    throw new Error(
      `Sheet "${HARGA_JUAL_PISJO_SHEET}" tidak memiliki data.`,
    );
  }

  /**
   * Format asli HARGA JUAL PISJO:
   *
   * Row 1:
   * NAMA PRODUK | PISJO 1KG | PISJO 700-800 GR | PISJO 500 GRAM | PISJO 250 GRAM | STOK/KG
   *
   * Row 2:
   * BANDENG | 44.000 / 49.000 | 37.000 / 41.000 | 23.000 / 26.000 | - | 1
   *
   * Format harga:
   * harga pertama  = UTUH
   * harga kedua    = BERSIH
   *
   * Contoh:
   * 44.000 / 49.000
   *      ↓       ↓
   *    UTUH    BERSIH
   *
   * Parser juga tetap mendukung format header bertingkat jika
   * spreadsheet suatu saat diubah menjadi:
   *
   * PISJO 1KG |       |
   * UTUH      | BERSIH
   * 44.000    | 49.000
   */

  const configuredHeaderIndex = Math.max(headerRow - 1, 0);

  /**
   * Cari header yang benar.
   *
   * Jika admin masih menyimpan Header = 2 sementara sheet
   * sebenarnya hanya memiliki satu baris header, otomatis
   * fallback ke baris pertama yang mengandung NAMA PRODUK/PISJO.
   */
  let headerIndex = configuredHeaderIndex;

  const looksLikePisjoHeader = (row: string[] | undefined): boolean => {
    if (!row) {
      return false;
    }

    return row.some((cell) => {
      const normalized = normalizeMatchText(cell ?? "");

      return (
        normalized === "NAMA PRODUK" ||
        /\bPISJO\b/i.test(normalized)
      );
    });
  };

  if (!looksLikePisjoHeader(values[headerIndex])) {
    const detectedHeaderIndex = values.findIndex((row) =>
      looksLikePisjoHeader(row),
    );

    if (detectedHeaderIndex >= 0) {
      headerIndex = detectedHeaderIndex;
    }
  }

  const firstHeader = values[headerIndex] ?? [];

  /**
   * Coba deteksi apakah baris setelah header merupakan
   * subheader UTUH/BERSIH.
   */
  const possibleSecondHeader = values[headerIndex + 1] ?? [];

  const hasConditionSubheader = possibleSecondHeader.some((cell) => {
    const normalized = normalizeConditionToken(
      String(cell ?? ""),
    );

    return Boolean(normalized);
  });

  const PRODUCT_HEADER_ALIASES = new Set([
    "NAMA PRODUK",
    "NAMA RODUK",
  ]);

  const productColumnIndex = firstHeader.findIndex((cell) =>
    PRODUCT_HEADER_ALIASES.has(
      normalizeMatchText(cell ?? ""),
    ),
  );

  if (productColumnIndex < 0) {
    throw new Error(
      `Kolom nama produk tidak ditemukan pada sheet "${HARGA_JUAL_PISJO_SHEET}". Header yang didukung: ${[
        ...PRODUCT_HEADER_ALIASES,
      ].join(", ")}.`,
    );
  }

  const detectedColumns: Array<{
    column: string;
    weightLabel: string;
    conditionLabel: string;
  }> = [];

  /**
   * ============================================================
   * FORMAT 1 — HEADER SATU BARIS
   * ============================================================
   *
   * PISJO 1KG
   * PISJO 700-800 GR
   * PISJO 500 GRAM
   *
   * Nilai data:
   * 44.000 / 49.000
   *
   * Harga pertama = UTUH
   * Harga kedua   = BERSIH
   */
  if (!hasConditionSubheader) {
    for (
      let index = 0;
      index < firstHeader.length;
      index += 1
    ) {
      const rawHeader = String(
        firstHeader[index] ?? "",
      ).trim();

      if (!rawHeader) {
        continue;
      }

      if (!/\bPISJO\b/i.test(rawHeader)) {
        continue;
      }

      const weightToken = normalizeWeightToken(rawHeader);

      if (!weightToken) {
        continue;
      }

      detectedColumns.push({
        column: columnNumberToLetters(index),
        weightLabel: rawHeader,
        conditionLabel: "UTUH/BERSIH",
      });
    }
  } else {
    /**
     * ============================================================
     * FORMAT 2 — HEADER BERTINGKAT
     * ============================================================
     *
     * PISJO 1KG |        |
     * UTUH      | BERSIH
     *
     * Google Sheets merged-cell perlu forward-fill.
     */
    let activePisjoGroupHeader = "";

    const maxColumns = Math.max(
      firstHeader.length,
      possibleSecondHeader.length,
    );

    for (let index = 0; index < maxColumns; index += 1) {
      const rawGroupHeader = String(
        firstHeader[index] ?? "",
      ).trim();

      const conditionHeader = String(
        possibleSecondHeader[index] ?? "",
      ).trim();

      if (rawGroupHeader) {
        if (/\bPISJO\b/i.test(rawGroupHeader)) {
          activePisjoGroupHeader = rawGroupHeader;
        } else {
          activePisjoGroupHeader = "";
        }
      }

      if (!activePisjoGroupHeader) {
        continue;
      }

      const weightToken = normalizeWeightToken(
        activePisjoGroupHeader,
      );

      const conditionToken =
        normalizeConditionToken(conditionHeader);

      if (!weightToken || !conditionToken) {
        continue;
      }

      detectedColumns.push({
        column: columnNumberToLetters(index),
        weightLabel: activePisjoGroupHeader,
        conditionLabel: conditionHeader,
      });
    }
  }

  if (detectedColumns.length === 0) {
    throw new Error(
      `Kolom harga PISJO tidak ditemukan pada sheet "${HARGA_JUAL_PISJO_SHEET}". Pastikan tersedia kolom seperti "PISJO 1KG", "PISJO 700-800 GR", atau "PISJO 500 GRAM".`,
    );
  }

  const invalidRows: InvalidRow[] = [];
  const rows: PisjoPriceCell[] = [];

  /**
   * Data dimulai tepat setelah header.
   */
  const dataStartIndex = hasConditionSubheader
    ? headerIndex + 2
    : headerIndex + 1;

  const dataRows = values.slice(dataStartIndex);

  for (
    let index = 0;
    index < dataRows.length;
    index += 1
  ) {
    const row = dataRows[index] ?? [];

    const rowNumber = dataStartIndex + index + 1;

    const productName = String(
      row[productColumnIndex] ?? "",
    ).trim();

    if (
      !productName &&
      row.every((cell) => !String(cell ?? "").trim())
    ) {
      continue;
    }

    if (!productName) {
      invalidRows.push({
        rowNumber,
        reason: "Nama produk kosong.",
      });

      continue;
    }

    for (const column of detectedColumns) {
      const columnIndex = columnToIndex(column.column);

      const rawPrice = String(
        row[columnIndex] ?? "",
      ).trim();

      /**
       * "-" berarti kombinasi berat tersebut tidak tersedia.
       */
      if (!rawPrice || rawPrice === "-") {
        continue;
      }

      /**
       * ========================================================
       * FORMAT SATU BARIS
       * ========================================================
       *
       * 44.000 / 49.000
       *
       * 44.000 = UTUH
       * 49.000 = BERSIH
       */
      if (column.conditionLabel === "UTUH/BERSIH") {
        const priceParts = rawPrice
          .split("/")
          .map((value) => value.trim())
          .filter(Boolean);

        if (priceParts.length !== 2) {
          invalidRows.push({
            rowNumber,
            reason:
              `Format harga "${rawPrice}" untuk ${productName} ${column.weightLabel} tidak valid. ` +
              `Gunakan format "HARGA UTUH / HARGA BERSIH".`,
          });

          continue;
        }

        try {
          const wholePrice = parseIntegerValue(
            priceParts[0] ?? "",
            `Harga ${productName} ${column.weightLabel} UTUH`,
            {
              allowZero: false,
            },
          );

          const cleanedPrice = parseIntegerValue(
            priceParts[1] ?? "",
            `Harga ${productName} ${column.weightLabel} BERSIH`,
            {
              allowZero: false,
            },
          );

          rows.push({
            rowNumber,
            productName,
            weightLabel: column.weightLabel,
            conditionLabel: "UTUH",
            price: wholePrice,
            column: column.column,
          });

          rows.push({
            rowNumber,
            productName,
            weightLabel: column.weightLabel,
            conditionLabel: "BERSIH",
            price: cleanedPrice,
            column: column.column,
          });
        } catch (error) {
          invalidRows.push({
            rowNumber,
            reason:
              error instanceof Error
                ? error.message
                : `Harga PISJO ${productName} tidak valid.`,
          });
        }

        continue;
      }

      /**
       * ========================================================
       * FORMAT HEADER BERTINGKAT
       * ========================================================
       */
      try {
        const price = parseIntegerValue(
          rawPrice,
          `Harga ${productName} ${column.weightLabel} ${column.conditionLabel}`,
          {
            allowZero: false,
          },
        );

        rows.push({
          rowNumber,
          productName,
          weightLabel: column.weightLabel,
          conditionLabel: column.conditionLabel,
          price,
          column: column.column,
        });
      } catch (error) {
        invalidRows.push({
          rowNumber,
          reason:
            error instanceof Error
              ? error.message
              : "Harga PISJO tidak valid.",
        });
      }
    }
  }

  return {
    rows,
    invalidRows,
    detectedColumns,
  };
}


function parsePisjoStockSheet(
  values: string[][],
  headerRow: number,
): {
  rows: PisjoStockRow[];
  invalidRows: InvalidRow[];
  productColumn: string;
  stockColumn: string;
} {
  if (values.length === 0) {
    throw new Error(
      `Sheet "${HARGA_JUAL_PISJO_SHEET}" tidak memiliki data.`,
    );
  }

  const normalizeHeader = (value: string) =>
    normalizeMatchText(value).replace(/\s+/g, " ").trim();

  const isProductHeader = (value: string) => {
    const normalized = normalizeHeader(value);
    return (
      normalized === "NAMA PRODUK" ||
      normalized === "NAMA BARANG" ||
      normalized === "PRODUK" ||
      normalized === "NAMA RODUK"
    );
  };

  const isStockHeader = (value: string) => {
    const normalized = normalizeHeader(value);
    return (
      normalized === "STOK KG" ||
      normalized === "STOK/KG" ||
      normalized === "STOK"
    );
  };

  // HARGA JUAL PISJO dapat memiliki dua tingkat header:
  // row 1 = NAMA PRODUK + grup PISJO + STOK/KG
  // row 2 = UTUH/BERSIH
  // row 3+ = data produk.
  // Jangan mengharuskan NAMA PRODUK dan STOK/KG ditemukan pada baris yang sama;
  // Google Sheets API juga dapat mengembalikan merged-cell header secara berbeda.
  const configuredHeaderIndex = Math.max(headerRow - 1, 0);
  const searchLimit = Math.min(values.length, Math.max(configuredHeaderIndex + 8, 12));

  const findColumn = (
    matcher: (value: string) => boolean,
  ): { index: number; rowIndex: number } | null => {
    // Prioritaskan baris konfigurasi lalu beberapa baris di sekitarnya.
    const preferredIndexes = Array.from(
      new Set([
        configuredHeaderIndex,
        Math.max(configuredHeaderIndex - 1, 0),
        configuredHeaderIndex + 1,
        0,
        1,
      ]),
    ).filter((index) => index >= 0 && index < searchLimit);

    for (const rowIndex of preferredIndexes) {
      const row = values[rowIndex] ?? [];
      const columnIndex = row.findIndex(matcher);
      if (columnIndex >= 0) {
        return { index: columnIndex, rowIndex };
      }
    }

    for (let rowIndex = 0; rowIndex < searchLimit; rowIndex += 1) {
      if (preferredIndexes.includes(rowIndex)) continue;
      const row = values[rowIndex] ?? [];
      const columnIndex = row.findIndex(matcher);
      if (columnIndex >= 0) {
        return { index: columnIndex, rowIndex };
      }
    }

    return null;
  };

  const productHeader = findColumn(isProductHeader);
  const stockHeader = findColumn(isStockHeader);

  if (!productHeader) {
    const inspectedHeaders = values
      .slice(0, searchLimit)
      .map((row, index) => `${index + 1}: ${(row ?? []).slice(0, 20).join(" | ")}`)
      .join(" || ");

    throw new Error(
      `Kolom "NAMA PRODUK" tidak ditemukan pada sheet "${HARGA_JUAL_PISJO_SHEET}". Header yang diperiksa: ${inspectedHeaders || "-"}.`,
    );
  }

  if (!stockHeader) {
    const inspectedHeaders = values
      .slice(0, searchLimit)
      .map((row, index) => `${index + 1}: ${(row ?? []).slice(0, 20).join(" | ")}`)
      .join(" || ");

    throw new Error(
      `Kolom "STOK/KG" tidak ditemukan pada sheet "${HARGA_JUAL_PISJO_SHEET}". Header yang diperiksa: ${inspectedHeaders || "-"}.`,
    );
  }

  const productColumnIndex = productHeader.index;
  const stockColumnIndex = stockHeader.index;
  const firstDataIndex = Math.max(productHeader.rowIndex, stockHeader.rowIndex) + 1;

  const rows: PisjoStockRow[] = [];
  const invalidRows: InvalidRow[] = [];

  for (let index = firstDataIndex; index < values.length; index += 1) {
    const row = values[index] ?? [];
    const rowNumber = index + 1;

    // Lewati subheader UTUH/BERSIH atau baris header lanjutan yang mungkin berada
    // di antara header utama dan data produk.
    const normalizedRow = row.map((cell) => normalizeHeader(String(cell ?? "")));
    const hasConditionSubheader = normalizedRow.some(
      (cell) => cell === "UTUH" || cell === "BERSIH" || cell === "WHOLE",
    );
    const hasAnyProductHeader = row.some(isProductHeader);
    const hasAnyStockHeader = row.some(isStockHeader);

    if (hasConditionSubheader && !String(row[productColumnIndex] ?? "").trim()) {
      continue;
    }

    if (hasAnyProductHeader || hasAnyStockHeader) {
      continue;
    }

    const productName = String(row[productColumnIndex] ?? "").trim();
    const rawStock = String(row[stockColumnIndex] ?? "").trim();

    if (
      !productName &&
      !rawStock &&
      row.every((cell) => !String(cell ?? "").trim())
    ) {
      continue;
    }

    if (!productName) {
      invalidRows.push({
        rowNumber,
        reason: "Nama produk kosong.",
      });
      continue;
    }

    if (!rawStock || rawStock === "-") {
      invalidRows.push({
        rowNumber,
        reason: `STOK/KG kosong untuk produk ${productName}.`,
      });
      continue;
    }

    try {
      const stockKg = parseIntegerValue(
        rawStock,
        `STOK/KG ${productName}`,
        { allowZero: true },
      );

      rows.push({
        rowNumber,
        productName,
        stockKg,
      });
    } catch (error) {
      invalidRows.push({
        rowNumber,
        reason:
          error instanceof Error
            ? error.message
            : `STOK/KG ${productName} tidak valid.`,
      });
    }
  }

  return {
    rows,
    invalidRows,
    productColumn: columnNumberToLetters(productColumnIndex),
    stockColumn: columnNumberToLetters(stockColumnIndex),
  };
}

const DEFAULT_CONFIG = {
  key: "default",
  enabled: false,
  spreadsheetId: null,
  sheetName: "PISJO_SYNC",
  range: "A1:C20000",
  skuColumn: "A",
  priceColumn: "B",
  stockColumn: "C",
  headerRow: 1,
} as const;

const MAX_ROWS = 20_000;
const MAX_RESULT_ERRORS = 100;

function normalizeColumn(value: string, field: string): string {
  const normalized = value.trim().toUpperCase();

  if (!/^[A-Z]+$/.test(normalized)) {
    throw new Error(
      `${field} harus berupa huruf kolom Google Sheets, contoh A, B, atau AA.`,
    );
  }

  return normalized;
}

function columnToIndex(column: string): number {
  let result = 0;

  for (const char of column) {
    result = result * 26 + (char.charCodeAt(0) - 64);
  }

  return result - 1;
}

function parseSpreadsheetId(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const urlMatch = trimmed.match(
    /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
  );

  if (urlMatch?.[1]) {
    return urlMatch[1];
  }

  if (/^[a-zA-Z0-9-_]+$/.test(trimmed)) {
    return trimmed;
  }

  throw new Error("Spreadsheet ID/URL Google Sheets tidak valid.");
}

function normalizeRange(value: string): string {
  const normalized = value.trim().replace(/\s+/g, "");

  if (!normalized) {
    throw new Error("Range Google Sheets wajib diisi.");
  }

  if (normalized.includes("!")) {
    throw new Error(
      "Range cukup diisi A1:C20000. Nama sheet dipilih pada field Nama Sheet.",
    );
  }

  // Relative A1 notation only. Supports A:C, A1:C20000, $A$1:$C$20000.
  if (
    !/^\$?[A-Z]+\$?\d*(?::\$?[A-Z]+\$?\d*)?$/i.test(normalized)
  ) {
    throw new Error(
      "Format range tidak valid. Contoh yang didukung: A:C atau A1:C20000.",
    );
  }

  return normalized.toUpperCase();
}

function parseIntegerValue(
  value: unknown,
  field: string,
  options: { allowZero: boolean },
): number {
  if (typeof value === "number") {
    if (!Number.isFinite(value) || !Number.isInteger(value)) {
      throw new Error(`${field} harus berupa angka bulat yang valid.`);
    }

    if (options.allowZero ? value < 0 : value <= 0) {
      throw new Error(
        `${field} harus ${options.allowZero ? "lebih besar atau sama dengan 0" : "lebih besar dari 0"}.`,
      );
    }

    return value;
  }

  if (typeof value !== "string") {
    throw new Error(`${field} kosong atau tidak valid.`);
  }

  let normalized = value
    .trim()
    .replace(/^(rp|idr)\s*/i, "")
    .replace(/\s/g, "")
    .replace(/[^\d,.-]/g, "");

  if (!normalized) {
    throw new Error(`${field} kosong atau tidak valid.`);
  }

  const negative = normalized.startsWith("-");
  normalized = normalized.replace(/-/g, "");

  if (normalized.includes(",") && normalized.includes(".")) {
    const lastComma = normalized.lastIndexOf(",");
    const lastDot = normalized.lastIndexOf(".");

    if (lastComma > lastDot) {
      normalized = normalized.replace(/\./g, "").replace(",", ".");
    } else {
      normalized = normalized.replace(/,/g, "");
    }
  } else if (normalized.includes(",")) {
    const parts = normalized.split(",");
    normalized =
      parts.length === 2 && parts[1].length === 3
        ? parts.join("")
        : normalized.replace(",", ".");
  } else if (normalized.includes(".")) {
    const parts = normalized.split(".");
    if (parts.length === 2 && parts[1].length === 3) {
      normalized = parts.join("");
    }
  }

  const parsed = Number(`${negative ? "-" : ""}${normalized}`);

  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    throw new Error(`${field} harus berupa angka bulat yang valid.`);
  }

  if (options.allowZero ? parsed < 0 : parsed <= 0) {
    throw new Error(
      `${field} harus ${options.allowZero ? "lebih besar atau sama dengan 0" : "lebih besar dari 0"}.`,
    );
  }

  return parsed;
}

function getCell(row: string[], column: string): string {
  return row[columnToIndex(column)]?.trim() ?? "";
}

function buildGoogleRange(sheetName: string, range: string): string {
  const normalizedSheet = sheetName.trim();
  const normalizedRange = normalizeRange(range);

  if (!normalizedSheet) {
    throw new Error("Nama sheet wajib diisi.");
  }

  // Always quote sheet names. This is safe for spaces and special characters.
  const escapedSheet = normalizedSheet.replace(/'/g, "''");
  return `'${escapedSheet}'!${normalizedRange}`;
}

function configToPublic(config: {
  enabled: boolean;
  spreadsheetId: string | null;
  sheetName: string;
  range: string;
  skuColumn: string;
  priceColumn: string;
  stockColumn: string;
  headerRow: number;
  lastSyncAt: Date | null;
  lastSyncType: string | null;
  lastSyncStatus: string | null;
  lastSyncSummary: Prisma.JsonValue | null;
}) {
  return {
    enabled: config.enabled,
    spreadsheetId: config.spreadsheetId,
    sheetName: config.sheetName,
    range: config.range,
    skuColumn: config.skuColumn,
    priceColumn: config.priceColumn,
    stockColumn: config.stockColumn,
    headerRow: config.headerRow,
    lastSyncAt: config.lastSyncAt,
    lastSyncType: config.lastSyncType,
    lastSyncStatus: config.lastSyncStatus,
    lastSyncSummary: config.lastSyncSummary,
    credentialConfigured: isGoogleSheetsCredentialConfigured(),
  };
}

function assertTestableConfig(input: ProductGoogleSheetsConfigInput) {
  const spreadsheetId = parseSpreadsheetId(input.spreadsheetId);
  const sheetName = input.sheetName.trim();
  const range = normalizeRange(input.range);
  const skuColumn = normalizeColumn(input.skuColumn, "Kolom SKU");
  const priceColumn = normalizeColumn(input.priceColumn, "Kolom harga");
  const stockColumn = normalizeColumn(input.stockColumn, "Kolom stok");

  if (!spreadsheetId) {
    throw new Error("Spreadsheet ID/URL wajib diisi.");
  }

  if (!sheetName) {
    throw new Error("Nama sheet wajib diisi.");
  }

  if (!Number.isInteger(input.headerRow) || input.headerRow < 1 || input.headerRow > 100) {
    throw new Error("Baris header harus berupa angka 1 sampai 100.");
  }

  return {
    spreadsheetId,
    sheetName,
    range,
    skuColumn,
    priceColumn,
    stockColumn,
    headerRow: input.headerRow,
  };
}

class ProductGoogleSheetsSyncService {
  async getConfig() {
    const config = await prisma.productGoogleSheetsSyncConfig.findUnique({
      where: { key: DEFAULT_CONFIG.key },
    });

    if (config) {
      return config;
    }

    return prisma.productGoogleSheetsSyncConfig.create({
      data: DEFAULT_CONFIG,
    });
  }

  async getPublicConfig() {
    return configToPublic(await this.getConfig());
  }

  async listSheets(spreadsheetIdInput: string | null | undefined) {
    const spreadsheetId = parseSpreadsheetId(spreadsheetIdInput);

    if (!spreadsheetId) {
      throw new Error("Spreadsheet ID/URL wajib diisi.");
    }

    return listGoogleSheets({ spreadsheetId });
  }

  async updateConfig(input: ProductGoogleSheetsConfigInput) {
    const spreadsheetId = parseSpreadsheetId(input.spreadsheetId);
    const sheetName = input.sheetName.trim();
    const range = normalizeRange(input.range);
    const skuColumn = normalizeColumn(input.skuColumn, "Kolom SKU");
    const priceColumn = normalizeColumn(input.priceColumn, "Kolom harga");
    const stockColumn = normalizeColumn(input.stockColumn, "Kolom stok");

    if (!sheetName) {
      throw new Error("Nama sheet wajib diisi.");
    }

    if (!Number.isInteger(input.headerRow) || input.headerRow < 1 || input.headerRow > 100) {
      throw new Error("Baris header harus berupa angka 1 sampai 100.");
    }

    if (input.enabled && !spreadsheetId) {
      throw new Error("Spreadsheet ID wajib diisi jika sinkronisasi diaktifkan.");
    }

    return prisma.productGoogleSheetsSyncConfig.upsert({
      where: { key: DEFAULT_CONFIG.key },
      create: {
        key: DEFAULT_CONFIG.key,
        enabled: input.enabled,
        spreadsheetId,
        sheetName,
        range,
        skuColumn,
        priceColumn,
        stockColumn,
        headerRow: input.headerRow,
      },
      update: {
        enabled: input.enabled,
        spreadsheetId,
        sheetName,
        range,
        skuColumn,
        priceColumn,
        stockColumn,
        headerRow: input.headerRow,
      },
    });
  }

  async getSyncTemplateRows(): Promise<ProductGoogleSheetsSyncTemplateRow[]> {
    const skuRecords = await prisma.productSku.findMany({
      where: {
        isActive: true,
        product: {
          deletedAt: null,
        },
      },
      select: {
        sku: true,
        price: true,
        stock: true,
        product: {
          select: {
            name: true,
          },
        },
        skuOptions: {
          select: {
            variantOption: {
              select: {
                label: true,
                isActive: true,
                group: {
                  select: {
                    name: true,
                    sortOrder: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { sku: "asc" },
    });

    return skuRecords.map((record) => {
      const variantParts = record.skuOptions
        .filter((item) => item.variantOption.isActive)
        .sort((a, b) => {
          const groupOrder =
            a.variantOption.group.sortOrder - b.variantOption.group.sortOrder;

          if (groupOrder !== 0) return groupOrder;

          return a.variantOption.group.name.localeCompare(
            b.variantOption.group.name,
            "id-ID",
          );
        })
        .map(
          (item) =>
            `${item.variantOption.group.name}: ${item.variantOption.label}`,
        );

      return {
        sku: record.sku,
        product: record.product.name,
        variant: variantParts.join(" | ") || "-",
        status: "Aktif",
        price: Number(record.price),
        stock: record.stock,
      };
    });
  }

  async testConnection(input?: ProductGoogleSheetsConfigInput) {
    const config = input ? assertTestableConfig(input) : await this.getConfig();

    if (!config.spreadsheetId) {
      throw new Error("Spreadsheet belum dikonfigurasi.");
    }

    const sheets = await listGoogleSheets({
      spreadsheetId: config.spreadsheetId,
    });

    const matchedSheet = sheets.find(
      (sheet) => sheet.title === config.sheetName,
    );

    if (!matchedSheet) {
      const available = sheets.map((sheet) => sheet.title).join(", ");
      throw new Error(
        `Sheet "${config.sheetName}" tidak ditemukan. Sheet tersedia: ${available || "-"}.`,
      );
    }

    const googleRange = buildGoogleRange(
      config.sheetName,
      "A:Q",
    );

    const values = await readGoogleSheetValues({
      spreadsheetId: config.spreadsheetId,
      range: googleRange,
    });

    console.log("[PISJO_SHEETS_DEBUG]", {
      sheetName: config.sheetName,
      headerRow: config.headerRow,
      googleRange,
      rowCount: values.length,
      firstHeader: values[0],
      secondHeader: values[1],
      firstHeaderEntries: (values[0] ?? []).map((value, index) => ({
        index,
        column: columnNumberToLetters(index),
        value,
      })),
      secondHeaderEntries: (values[1] ?? []).map((value, index) => ({
        index,
        column: columnNumberToLetters(index),
        value,
      })),
    });

    if (isHargaJualPisjoSheet(config.sheetName)) {
      const parsed = parsePisjoPriceSheet(values, config.headerRow);

      return {
        source: "HARGA_JUAL_PISJO" as const,
        spreadsheetId: config.spreadsheetId,
        sheetName: config.sheetName,
        sheetId: matchedSheet.sheetId,
        range: googleRange,
        rowCount: values.slice(config.headerRow).length,
        priceCellCount: parsed.rows.length,
        invalidRowCount: parsed.invalidRows.length,
        invalidRows: parsed.invalidRows.slice(0, MAX_RESULT_ERRORS),
        headers: [
          "NAMA PRODUK",
          ...parsed.detectedColumns.flatMap((column) => [
            column.weightLabel,
            column.conditionLabel,
          ]),
        ],
        detectedPriceColumns: parsed.detectedColumns,
        sampleRows: parsed.rows.slice(0, 8).map((row) => ({
          rowNumber: row.rowNumber,
          productName: row.productName,
          variant: `${row.weightLabel} | ${row.conditionLabel}`,
          price: row.price,
        })),
        availableSheets: sheets.map((sheet) => ({
          sheetId: sheet.sheetId,
          title: sheet.title,
        })),
        credentialConfigured: isGoogleSheetsCredentialConfigured(),
      };
    }

    const headerIndex = config.headerRow - 1;
    const headers = values[headerIndex] ?? [];
    const dataRows = values.slice(config.headerRow);

    return {
      source: "SKU" as const,
      spreadsheetId: config.spreadsheetId,
      sheetName: config.sheetName,
      sheetId: matchedSheet.sheetId,
      range: googleRange,
      rowCount: dataRows.length,
      headers: headers.slice(0, 20),
      sampleRows: dataRows.slice(0, 5),
      availableSheets: sheets.map((sheet) => ({
        sheetId: sheet.sheetId,
        title: sheet.title,
      })),
      credentialConfigured: isGoogleSheetsCredentialConfigured(),
    };
  }

  private async syncHargaJualPisjoPrice(
    config: {
      spreadsheetId: string | null;
      sheetName: string;
      range: string;
      headerRow: number;
    },
    actorUserId?: string,
  ) {
    if (!config.spreadsheetId) {
      throw new Error("Spreadsheet belum dikonfigurasi.");
    }

    const googleRange = buildGoogleRange(
      HARGA_JUAL_PISJO_SHEET,
      "A:Q",
    );

    const values = await readGoogleSheetValues({
      spreadsheetId: config.spreadsheetId,
      range: googleRange,
    });

    const parsed = parsePisjoPriceSheet(values, config.headerRow);

    if (parsed.rows.length === 0) {
      throw new Error(
        `Tidak ada harga PISJO yang dapat diproses dari sheet "${HARGA_JUAL_PISJO_SHEET}".`,
      );
    }

    const productRecords = await prisma.product.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
      },
    });

    const productCandidates: PisjoProductCandidate[] = productRecords.map(
      (product) => ({
        id: product.id,
        name: product.name,
        productTokens: getProductMatchTokens(product.name),
      }),
    );

    const skuRecords = await prisma.productSku.findMany({
      where: {
        isActive: true,
        product: {
          deletedAt: null,
        },
      },
      select: {
        id: true,
        sku: true,
        productId: true,
        price: true,
        product: {
          select: {
            name: true,
          },
        },
        skuOptions: {
          select: {
            variantOption: {
              select: {
                label: true,
              },
            },
          },
        },
      },
    });

    const candidates: PisjoSkuCandidate[] = skuRecords.map((record) => {
      const tokens = extractVariantTokens(
        record.skuOptions.map((item) => item.variantOption.label),
      );

      return {
        id: record.id,
        sku: record.sku,
        productId: record.productId,
        price: record.price,
        productName: record.product.name,
        productTokens: getProductMatchTokens(record.product.name),
        weightTokens: tokens.weightTokens,
        conditionTokens: tokens.conditionTokens,
      };
    });

    const skuCandidatesByProductId = new Map<string, PisjoSkuCandidate[]>();

    for (const candidate of candidates) {
      const group = skuCandidatesByProductId.get(candidate.productId);

      if (group) {
        group.push(candidate);
      } else {
        skuCandidatesByProductId.set(candidate.productId, [candidate]);
      }
    }

    const ambiguousMatches: string[] = [];
    const missingMatches: string[] = [];
    const productNotFoundMatches: string[] = [];
    const variantNotFoundMatches: string[] = [];
    const matchedRows = new Map<
      string,
      { candidate: PisjoSkuCandidate; price: number }
    >();
    const invalidRows = [...parsed.invalidRows];

    for (const row of parsed.rows) {
      const sourceWeight = normalizeWeightToken(row.weightLabel);
      const sourceCondition = normalizeConditionToken(row.conditionLabel);

      if (!sourceWeight || !sourceCondition) {
        invalidRows.push({
          rowNumber: row.rowNumber,
          reason: `Varian sumber tidak dapat dikenali: ${row.weightLabel} / ${row.conditionLabel}.`,
        });
        continue;
      }

      const descriptor =
        `${row.productName} | ${row.weightLabel} | ${row.conditionLabel}`;

      /**
       * Resolve the PRODUCT first, independently from ProductSku.
       *
       * The previous implementation built the product candidate list from
       * active ProductSku rows only. That meant an existing Product with no
       * active SKU was incorrectly reported as PRODUCT_NOT_FOUND.
       *
       * Keeping product resolution separate gives us an accurate distinction:
       *   PRODUCT_NOT_FOUND  -> product name cannot be resolved
       *   VARIANT_NOT_FOUND  -> product exists, but required active SKU/variant
       *                         does not exist
       */
      const resolvedProducts = resolvePisjoProductNameCandidates(
        row.productName,
        productCandidates,
      );

      if (resolvedProducts.length === 0) {
        productNotFoundMatches.push(descriptor);
        missingMatches.push(`${descriptor} → PRODUCT_NOT_FOUND`);

        if (productNotFoundMatches.length <= 10) {
          console.warn("[PISJO_SYNC_PRODUCT_NOT_FOUND]", {
            rowNumber: row.rowNumber,
            productName: row.productName,
            weightLabel: row.weightLabel,
            conditionLabel: row.conditionLabel,
            reason: "PRODUCT_NOT_FOUND",
          });
        }

        continue;
      }

      if (resolvedProducts.length > 1) {
        const productNames = resolvedProducts
          .map((product) => product.name)
          .join(", ");

        ambiguousMatches.push(
          `${descriptor} → PRODUCT_AMBIGUOUS: ${productNames}`,
        );

        if (ambiguousMatches.length <= 10) {
          console.warn("[PISJO_SYNC_PRODUCT_AMBIGUOUS]", {
            rowNumber: row.rowNumber,
            productName: row.productName,
            weightLabel: row.weightLabel,
            conditionLabel: row.conditionLabel,
            candidates: resolvedProducts.map((product) => ({
              id: product.id,
              name: product.name,
            })),
          });
        }

        continue;
      }

      const resolvedProduct = resolvedProducts[0];
      const productSkuCandidates =
        skuCandidatesByProductId.get(resolvedProduct.id) ?? [];

      /**
       * Product exists but currently has no active ProductSku.
       * This must not be classified as PRODUCT_NOT_FOUND.
       */
      if (productSkuCandidates.length === 0) {
        variantNotFoundMatches.push(
          `${descriptor} → PRODUCT_FOUND_NO_ACTIVE_SKU`,
        );
        missingMatches.push(
          `${descriptor} → PRODUCT_FOUND_NO_ACTIVE_SKU`,
        );

        if (variantNotFoundMatches.length <= 10) {
          console.warn("[PISJO_SYNC_PRODUCT_FOUND_NO_ACTIVE_SKU]", {
            rowNumber: row.rowNumber,
            productId: resolvedProduct.id,
            productName: resolvedProduct.name,
            weightLabel: row.weightLabel,
            conditionLabel: row.conditionLabel,
          });
        }

        continue;
      }

      /**
       * PISJO memiliki dua struktur SKU:
       *
       * CONDITION_BASED:
       *   SKU memiliki weight + condition (UTUH/BERSIH).
       *
       * WEIGHT_ONLY:
       *   SKU hanya memiliki weight tanpa condition.
       *
       * HARGA_JUAL_PISJO tetap menghasilkan condition dari posisi harga
       * (harga pertama = UTUH, harga kedua = BERSIH). Namun condition hanya
       * dipakai sebagai syarat matching jika product tersebut memang
       * mempunyai SKU dengan condition.
       */
      const productGroups = new Map<string, PisjoSkuCandidate[]>();
      productGroups.set(resolvedProduct.id, productSkuCandidates);

      const matches: PisjoSkuCandidate[] = [];

      for (const group of productGroups.values()) {
        const isConditionBased = group.some(
          (candidate) => candidate.conditionTokens.length > 0,
        );

        for (const candidate of group) {
          if (!candidate.weightTokens.includes(sourceWeight)) {
            continue;
          }

          if (
            isConditionBased &&
            !candidate.conditionTokens.includes(sourceCondition)
          ) {
            continue;
          }

          matches.push(candidate);
        }
      }

      /**
       * Product sudah ditemukan, tetapi kombinasi variant yang diperlukan
       * tidak memiliki ProductSku aktif yang dapat di-update.
       */
      if (matches.length === 0) {
        variantNotFoundMatches.push(descriptor);
        missingMatches.push(`${descriptor} → VARIANT_NOT_FOUND`);

        if (variantNotFoundMatches.length <= 10) {
          console.warn("[PISJO_SYNC_VARIANT_NOT_FOUND]", {
            rowNumber: row.rowNumber,
            productName: row.productName,
            weightLabel: row.weightLabel,
            conditionLabel: row.conditionLabel,
            sourceWeight,
            sourceCondition,
            productCandidates: productSkuCandidates.map((candidate) => ({
              sku: candidate.sku,
              productName: candidate.productName,
              productId: candidate.productId,
              weightTokens: candidate.weightTokens,
              conditionTokens: candidate.conditionTokens,
            })),
          });
        }

        continue;
      }

      if (matches.length > 1) {
        ambiguousMatches.push(
          `${descriptor} → ${matches.map((match) => match.sku).join(", ")}`,
        );
        continue;
      }

      const candidate = matches[0];
      const previous = matchedRows.get(candidate.id);

      if (previous) {
        if (previous.price !== row.price) {
          ambiguousMatches.push(
            `${descriptor} → SKU ${candidate.sku} memiliki lebih dari satu harga sumber dalam sheet.`,
          );
        }
        continue;
      }

      matchedRows.set(candidate.id, {
        candidate,
        price: row.price,
      });
    }

    if (matchedRows.size === 0) {
      throw new Error(
        [
          "Tidak ada varian PISJO yang cocok dengan ProductSku aktif.",
          missingMatches.length
            ? `${missingMatches.length} kombinasi tidak ditemukan.`
            : "",
          ambiguousMatches.length
            ? `${ambiguousMatches.length} kombinasi ambigu.`
            : "",
        ]
          .filter(Boolean)
          .join(" "),
      );
    }

    let priceUpdated = 0;
    let changedRows = 0;

    await prisma.$transaction(
      async (tx) => {
        const skuIds = [...matchedRows.keys()];

        const lockedSkus = await tx.$queryRaw<
          Array<{
            id: string;
            sku: string;
            price: Prisma.Decimal;
            isActive: boolean;
          }>
        >(Prisma.sql`
          SELECT "id", "sku", "price", "isActive"
          FROM "ProductSku"
          WHERE "id" IN (${Prisma.join(skuIds)})
          FOR UPDATE
        `);

        const lockedById = new Map(
          lockedSkus.map((item) => [item.id, item]),
        );

        for (const [skuId, item] of matchedRows) {
          const current = lockedById.get(skuId);

          if (!current || !current.isActive) {
            continue;
          }

          const currentPrice = Number(current.price);

          if (currentPrice === item.price) {
            continue;
          }

          await tx.productSku.update({
            where: { id: skuId },
            data: {
              price: item.price,
            },
          });

          priceUpdated += 1;
          changedRows += 1;
        }

        const affectedProductIds = new Set(
          [...matchedRows.values()].map((item) => item.candidate.productId),
        );

        for (const productId of affectedProductIds) {
          const lowest = await tx.productSku.findFirst({
            where: {
              productId,
              isActive: true,
            },
            select: {
              price: true,
            },
            orderBy: {
              price: "asc",
            },
          });

          if (lowest) {
            await tx.product.update({
              where: { id: productId },
              data: {
                price: lowest.price,
              },
            });
          }
        }
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      },
    );

    const summary = {
      source: "HARGA_JUAL_PISJO",
      type: "PRICE" as const,
      actorUserId: actorUserId ?? null,
      processedRows: parsed.rows.length,
      matchedRows: matchedRows.size,
      invalidRows: invalidRows.length,
      priceUpdated,
      stockUpdated: 0,
      missingSkus: variantNotFoundMatches.length,
      inactiveSkus: 0,
      ambiguousMatches: ambiguousMatches.length,
      productNotFound: productNotFoundMatches.length,
      variantNotFound: variantNotFoundMatches.length,
      changedRows,
      errors: invalidRows.slice(0, MAX_RESULT_ERRORS),
      missingSkuValues: variantNotFoundMatches.slice(0, MAX_RESULT_ERRORS),
      productNotFoundValues: productNotFoundMatches.slice(
        0,
        MAX_RESULT_ERRORS,
      ),
      variantNotFoundValues: variantNotFoundMatches.slice(
        0,
        MAX_RESULT_ERRORS,
      ),
      ambiguousSkuValues: ambiguousMatches.slice(0, MAX_RESULT_ERRORS),
      inactiveSkuValues: [],
    };

    try {
      await prisma.productGoogleSheetsSyncConfig.update({
        where: { key: DEFAULT_CONFIG.key },
        data: {
          lastSyncAt: new Date(),
          lastSyncType: "PRICE",
          lastSyncStatus: "SUCCESS",
          lastSyncSummary:
            JSON.parse(JSON.stringify(summary)) as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      console.error("[PRODUCT_GOOGLE_SHEETS_SYNC_LOG_ERROR]", error);
    }

    return summary;
  }

  private async syncHargaJualPisjoStock(
    config: {
      spreadsheetId: string | null;
      sheetName: string;
      range: string;
      headerRow: number;
    },
    actorUserId?: string,
  ) {
    if (!config.spreadsheetId) {
      throw new Error("Spreadsheet belum dikonfigurasi.");
    }

    const googleRange = buildGoogleRange(
      HARGA_JUAL_PISJO_SHEET,
      "A:Q",
    );

    const values = await readGoogleSheetValues({
      spreadsheetId: config.spreadsheetId,
      range: googleRange,
    });

    const parsed = parsePisjoStockSheet(values, config.headerRow);

    if (parsed.rows.length === 0) {
      throw new Error(
        `Tidak ada data STOK/KG yang dapat diproses dari sheet "${HARGA_JUAL_PISJO_SHEET}".`,
      );
    }

    const products = await prisma.product.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        stock: true,
      },
    });

    const productCandidates = products.map((product) => ({
      id: product.id,
      name: product.name,
      normalizedName: normalizeMatchText(product.name),
      productTokens: getProductMatchTokens(product.name),
    }));

    const productNotFound: string[] = [];
    const ambiguousProducts: string[] = [];

    const matchedRows = new Map<
      string,
      {
        productId: string;
        productName: string;
        stockKg: number;
      }
    >();

    for (const row of parsed.rows) {
      const sourceNormalized = normalizeMatchText(row.productName);
      const sourceTokens = getProductMatchTokens(row.productName);

      const scored = productCandidates
        .map((candidate) => {
          if (candidate.normalizedName === sourceNormalized) {
            return { candidate, score: 300 };
          }

          if (
            sourceTokens.length > 0 &&
            sourceTokens.every((token) =>
              candidate.productTokens.includes(token),
            )
          ) {
            return {
              candidate,
              score:
                200 +
                sourceTokens.length * 5 -
                Math.max(
                  candidate.productTokens.length - sourceTokens.length,
                  0,
                ),
            };
          }

          return null;
        })
        .filter(
          (
            item,
          ): item is {
            candidate: (typeof productCandidates)[number];
            score: number;
          } => Boolean(item),
        )
        .sort((a, b) => b.score - a.score);

      const bestScore = scored[0]?.score;
      const matches =
        bestScore === undefined
          ? []
          : scored.filter((item) => item.score === bestScore);

      if (matches.length === 0) {
        const descriptor = `${row.productName} | ${row.stockKg} KG`;
        productNotFound.push(`${descriptor} → PRODUCT_NOT_FOUND`);

        if (productNotFound.length <= 10) {
          console.warn("[PISJO_STOCK_PRODUCT_NOT_FOUND]", {
            rowNumber: row.rowNumber,
            productName: row.productName,
            stockKg: row.stockKg,
            reason: "PRODUCT_NOT_FOUND",
          });
        }

        continue;
      }

      if (matches.length > 1) {
        ambiguousProducts.push(
          `${row.productName} → ${matches
            .map((match) => match.candidate.name)
            .join(", ")}`,
        );
        continue;
      }

      const candidate = matches[0].candidate;
      const previous = matchedRows.get(candidate.id);

      if (previous) {
        if (previous.stockKg !== row.stockKg) {
          ambiguousProducts.push(
            `${row.productName} → produk memiliki lebih dari satu STOK/KG sumber.`,
          );
        }
        continue;
      }

      matchedRows.set(candidate.id, {
        productId: candidate.id,
        productName: candidate.name,
        stockKg: row.stockKg,
      });
    }

    if (matchedRows.size === 0) {
      throw new Error(
        [
          `Tidak ada produk PISJO yang cocok dengan Product aktif.`,
          productNotFound.length
            ? `${productNotFound.length} produk tidak ditemukan.`
            : "",
          ambiguousProducts.length
            ? `${ambiguousProducts.length} produk ambigu.`
            : "",
        ]
          .filter(Boolean)
          .join(" "),
      );
    }

    let stockUpdated = 0;
    let changedRows = 0;

    await prisma.$transaction(
      async (tx) => {
        const productIds = [...matchedRows.keys()];

        const lockedProducts = await tx.$queryRaw<
          Array<{
            id: string;
            name: string;
            stock: number;
          }>
        >(Prisma.sql`
          SELECT "id", "name", "stock"
          FROM "Product"
          WHERE "id" IN (${Prisma.join(productIds)})
          FOR UPDATE
        `);

        const lockedById = new Map(
          lockedProducts.map((product) => [product.id, product]),
        );

        for (const [productId, item] of matchedRows) {
          const current = lockedById.get(productId);

          if (!current) {
            continue;
          }

          const stockBefore = current.stock;
          const stockAfter = item.stockKg;

          if (stockBefore === stockAfter) {
            continue;
          }

          await tx.product.update({
            where: { id: productId },
            data: {
              stock: stockAfter,
            },
          });

          await tx.stockLedger.create({
            data: {
              productId,
              skuId: null,
              type: "ADJUSTMENT",
              quantity: stockAfter - stockBefore,
              stockBefore,
              stockAfter,
              note:
                `Sinkronisasi Google Sheets (${HARGA_JUAL_PISJO_SHEET}) ` +
                `STOK/KG untuk produk ${item.productName}.`,
            },
          });

          stockUpdated += 1;
          changedRows += 1;
        }
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      },
    );

    const summary = {
      source: HARGA_JUAL_PISJO_SHEET,
      range: googleRange,
      type: "STOCK" as const,
      actorUserId: actorUserId ?? null,
      stockSource: "STOK/KG",
      stockLevel: "PRODUCT",
      processedRows: parsed.rows.length,
      matchedRows: matchedRows.size,
      invalidRows: parsed.invalidRows.length,
      stockUpdated,
      priceUpdated: 0,
      changedRows,
      missingSkus: 0,
      inactiveSkus: 0,
      productNotFound: productNotFound.length,
      ambiguousMatches: ambiguousProducts.length,
      errors: parsed.invalidRows.slice(0, MAX_RESULT_ERRORS),
      missingSkuValues: [],
      productNotFoundValues: productNotFound.slice(0, MAX_RESULT_ERRORS),
      ambiguousSkuValues: ambiguousProducts.slice(
        0,
        MAX_RESULT_ERRORS,
      ),
      inactiveSkuValues: [],
      detectedColumns: {
        productColumn: parsed.productColumn,
        stockColumn: parsed.stockColumn,
      },
    };

    try {
      await prisma.productGoogleSheetsSyncConfig.update({
        where: { key: DEFAULT_CONFIG.key },
        data: {
          lastSyncAt: new Date(),
          lastSyncType: "STOCK",
          lastSyncStatus: "SUCCESS",
          lastSyncSummary:
            JSON.parse(JSON.stringify(summary)) as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      console.error("[PRODUCT_GOOGLE_SHEETS_SYNC_LOG_ERROR]", error);
    }

    return summary;
  }

  async sync(type: ProductGoogleSheetsSyncType, actorUserId?: string) {
    const config = await this.getConfig();

    if (!config.enabled) {
      throw new Error("Sinkronisasi Google Sheets belum diaktifkan.");
    }

    if (!config.spreadsheetId) {
      throw new Error("Spreadsheet belum dikonfigurasi.");
    }

    if (type !== "PRICE" && type !== "STOCK" && type !== "PRICE_STOCK") {
      throw new Error("Tipe sinkronisasi tidak valid.");
    }

    const isHargaSheet = isHargaJualPisjoSheet(config.sheetName);

    if (isHargaSheet && type === "PRICE") {
      return this.syncHargaJualPisjoPrice(config, actorUserId);
    }

    if (isHargaSheet && type === "STOCK") {
      return this.syncHargaJualPisjoStock(config, actorUserId);
    }

    if (isHargaSheet && type === "PRICE_STOCK") {
      // PRICE dan STOCK tetap diproses melalui pipeline terpisah.
      // Harga -> ProductSku.price
      // STOK/KG -> Product.stock
      // Jadi keduanya tidak pernah dicampur ke SKU yang sama.
      const priceSummary = await this.syncHargaJualPisjoPrice(
        config,
        actorUserId,
      );
      const stockSummary = await this.syncHargaJualPisjoStock(
        config,
        actorUserId,
      );

      const combinedSummary = {
        source: HARGA_JUAL_PISJO_SHEET,
        type: "PRICE_STOCK" as const,
        actorUserId: actorUserId ?? null,
        price: priceSummary,
        stock: stockSummary,
        processedRows:
          Math.max(
            priceSummary.processedRows ?? 0,
            stockSummary.processedRows ?? 0,
          ),
        priceUpdated: priceSummary.priceUpdated ?? 0,
        stockUpdated: stockSummary.stockUpdated ?? 0,
        changedRows:
          (priceSummary.changedRows ?? 0) +
          (stockSummary.changedRows ?? 0),
        invalidRows:
          (priceSummary.invalidRows ?? 0) +
          (stockSummary.invalidRows ?? 0),
        productNotFound:
          priceSummary.productNotFound ??
          0,
        stockProductNotFound:
          stockSummary.productNotFound ??
          0,
      };

      try {
        await prisma.productGoogleSheetsSyncConfig.update({
          where: { key: DEFAULT_CONFIG.key },
          data: {
            lastSyncAt: new Date(),
            lastSyncType: "PRICE_STOCK",
            lastSyncStatus: "SUCCESS",
            lastSyncSummary:
              JSON.parse(
                JSON.stringify(combinedSummary),
              ) as Prisma.InputJsonValue,
          },
        });
      } catch (error) {
        console.error(
          "[PRODUCT_GOOGLE_SHEETS_SYNC_LOG_ERROR]",
          error,
        );
      }

      return combinedSummary;
    }

    const sheets = await listGoogleSheets({
      spreadsheetId: config.spreadsheetId,
    });

    const syncConfig = {
      sheetName: config.sheetName,
      range: config.range,
      skuColumn: config.skuColumn,
      priceColumn: config.priceColumn,
      stockColumn: config.stockColumn,
      headerRow: config.headerRow,
    };

    const matchedSheet = sheets.find(
      (sheet) =>
        sheet.title.trim().localeCompare(syncConfig.sheetName, "id-ID", {
          sensitivity: "base",
        }) === 0,
    );

    if (!matchedSheet) {
      const available = sheets.map((sheet) => sheet.title).join(", ");

      throw new Error(
        `Sheet "${syncConfig.sheetName}" tidak ditemukan. Sheet tersedia: ${available || "-"}.`,
      );
    }

    const googleRange = buildGoogleRange(
      syncConfig.sheetName,
      syncConfig.range,
    );
    const values = await readGoogleSheetValues({
      spreadsheetId: config.spreadsheetId,
      range: googleRange,
    });

    if (values.length <= syncConfig.headerRow) {
      throw new Error("Google Sheets tidak memiliki baris data setelah header.");
    }

    const dataRows = values.slice(syncConfig.headerRow);

    if (dataRows.length > MAX_ROWS) {
      throw new Error(
        `Jumlah baris melebihi batas ${MAX_ROWS.toLocaleString("id-ID")}. Persempit range spreadsheet.`,
      );
    }

    const invalidRows: InvalidRow[] = [];
    const validRows: SyncRow[] = [];
    const seenSkus = new Map<string, number>();

    for (let index = 0; index < dataRows.length; index += 1) {
      const row = dataRows[index] ?? [];
      const rowNumber = syncConfig.headerRow + index + 1;
      const sku = getCell(row, syncConfig.skuColumn);

      // Ignore completely empty rows at the bottom of the configured range.
      if (!sku && row.every((cell) => !cell?.trim())) {
        continue;
      }

      if (!sku) {
        invalidRows.push({ rowNumber, reason: "SKU kosong." });
        continue;
      }

      const previousRow = seenSkus.get(sku);
      if (previousRow) {
        invalidRows.push({
          rowNumber,
          sku,
          reason: `SKU duplikat; sebelumnya ada di baris ${previousRow}.`,
        });
        continue;
      }

      seenSkus.set(sku, rowNumber);

      const parsed: SyncRow = { rowNumber, sku };

      try {
        if (type === "PRICE" || type === "PRICE_STOCK") {
          parsed.price = parseIntegerValue(
            getCell(row, syncConfig.priceColumn),
            `Harga SKU ${sku}`,
            { allowZero: false },
          );
        }

        if (type === "STOCK" || type === "PRICE_STOCK") {
          parsed.stock = parseIntegerValue(
            getCell(row, syncConfig.stockColumn),
            `Stok SKU ${sku}`,
            { allowZero: true },
          );
        }

        validRows.push(parsed);
      } catch (error) {
        invalidRows.push({
          rowNumber,
          sku,
          reason: error instanceof Error ? error.message : "Nilai spreadsheet tidak valid.",
        });
      }
    }

    if (validRows.length === 0) {
      throw new Error("Tidak ada baris valid yang dapat disinkronkan.");
    }

    console.log("[PRODUCT_GOOGLE_SHEETS_STOCK_SOURCE]", {
      type,
      configuredSheet: config.sheetName,
      effectiveSheet: syncConfig.sheetName,
      range: googleRange,
      skuColumn: syncConfig.skuColumn,
      stockColumn: syncConfig.stockColumn,
      headerRow: syncConfig.headerRow,
    });

    const result = await prisma.$transaction(
      async (tx) => {
        const skuValues = validRows.map((row) => row.sku);
        const lockedSkus = await tx.$queryRaw<
          Array<{
            id: string;
            sku: string;
            productId: string;
            price: Prisma.Decimal;
            stock: number;
            isActive: boolean;
          }>
        >(Prisma.sql`
          SELECT "id", "sku", "productId", "price", "stock", "isActive"
          FROM "ProductSku"
          WHERE "sku" IN (${Prisma.join(skuValues)})
          FOR UPDATE
        `);

        const skuByCode = new Map(lockedSkus.map((item) => [item.sku, item]));
        const missingSkus: string[] = [];
        const inactiveSkus: string[] = [];
        const affectedProductIds = new Set<string>();
        let priceUpdated = 0;
        let stockUpdated = 0;
        let changedRows = 0;

        for (const row of validRows) {
          const current = skuByCode.get(row.sku);

          if (!current) {
            missingSkus.push(row.sku);
            continue;
          }

          if (!current.isActive) {
            inactiveSkus.push(row.sku);
            continue;
          }

          const data: { price?: number; stock?: number } = {};
          const priceBefore = Number(current.price);
          const stockBefore = current.stock;

          if (row.price !== undefined && priceBefore !== row.price) {
            data.price = row.price;
            priceUpdated += 1;
          }

          if (row.stock !== undefined && stockBefore !== row.stock) {
            data.stock = row.stock;
            stockUpdated += 1;
          }

          if (Object.keys(data).length === 0) {
            continue;
          }

          await tx.productSku.update({
            where: { id: current.id },
            data,
          });

          affectedProductIds.add(current.productId);
          changedRows += 1;

          if (data.stock !== undefined) {
            await tx.stockLedger.create({
              data: {
                productId: current.productId,
                skuId: current.id,
                type: "ADJUSTMENT",
                quantity: data.stock - stockBefore,
                stockBefore,
                stockAfter: data.stock,
                note: `Sinkronisasi Google Sheets (${type}) untuk SKU ${row.sku}.`,
              },
            });
          }
        }

        for (const productId of affectedProductIds) {
          if (type === "STOCK" || type === "PRICE_STOCK") {
            const stockAggregate = await tx.productSku.aggregate({
              where: { productId, isActive: true },
              _sum: { stock: true },
            });

            await tx.product.update({
              where: { id: productId },
              data: { stock: stockAggregate._sum.stock ?? 0 },
            });
          }

          if (type === "PRICE" || type === "PRICE_STOCK") {
            const lowest = await tx.productSku.findFirst({
              where: { productId, isActive: true },
              select: { price: true },
              orderBy: { price: "asc" },
            });

            if (lowest) {
              await tx.product.update({
                where: { id: productId },
                data: { price: lowest.price },
              });
            }
          }
        }

        return {
          priceUpdated,
          stockUpdated,
          missingSkus,
          inactiveSkus,
          changedRows,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
    );

    const summary = {
      source: syncConfig.sheetName,
      range: googleRange,
      type,
      actorUserId: actorUserId ?? null,
      processedRows: validRows.length,
      invalidRows: invalidRows.length,
      priceUpdated: result.priceUpdated,
      stockUpdated: result.stockUpdated,
      missingSkus: result.missingSkus.length,
      inactiveSkus: result.inactiveSkus.length,
      changedRows: result.changedRows,
      errors: invalidRows.slice(0, MAX_RESULT_ERRORS),
      missingSkuValues: result.missingSkus.slice(0, MAX_RESULT_ERRORS),
      inactiveSkuValues: result.inactiveSkus.slice(0, MAX_RESULT_ERRORS),
    };

    try {
      await prisma.productGoogleSheetsSyncConfig.update({
        where: { key: DEFAULT_CONFIG.key },
        data: {
          lastSyncAt: new Date(),
          lastSyncType: type,
          lastSyncStatus: "SUCCESS",
          // Prisma JSON input does not accept our domain interfaces directly.
          // Serialize the summary first so nested InvalidRow objects become plain JSON values.
          lastSyncSummary: JSON.parse(JSON.stringify(summary)) as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      console.error("[PRODUCT_GOOGLE_SHEETS_SYNC_LOG_ERROR]", error);
    }

    return summary;
  }
}

export default new ProductGoogleSheetsSyncService();
