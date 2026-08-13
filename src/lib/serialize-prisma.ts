import { Prisma } from "@prisma/client";

/**
 * ============================================================
 * SERIALIZE PRISMA
 * ============================================================
 *
 * Mengubah data Prisma menjadi plain JavaScript object
 * agar aman dikirim dari Server Component / Server Action
 * ke Client Component.
 *
 * Menangani:
 * - Prisma.Decimal
 * - Date
 * - Array
 * - Object
 */

export function serializePrisma<T>(
  data: T
): T {
  if (
    data === null ||
    data === undefined
  ) {
    return data;
  }

  /**
   * Prisma Decimal -> number
   */
  if (
    data instanceof Prisma.Decimal
  ) {
    return Number(
      data.toString()
    ) as T;
  }

  /**
   * Date -> ISO string
   */
  if (
    data instanceof Date
  ) {
    return data.toISOString() as T;
  }

  /**
   * Array
   */
  if (
    Array.isArray(data)
  ) {
    return data.map(
      (item) =>
        serializePrisma(item)
    ) as T;
  }

  /**
   * Object
   */
  if (
    typeof data === "object"
  ) {
    const result: Record<
      string,
      unknown
    > = {};

    for (
      const [key, value] of Object.entries(
        data as Record<string, unknown>
      )
    ) {
      result[key] =
        serializePrisma(value);
    }

    return result as T;
  }

  return data;
}