import { z } from "zod";

const coordinateSchema = z
  .number()
  .finite()
  .nullable()
  .optional();

export const addressSchema = z.object({
  receiverName: z
    .string()
    .trim()
    .min(
      2,
      "Nama penerima minimal 2 karakter."
    )
    .max(
      100,
      "Nama penerima maksimal 100 karakter."
    ),

  receiverPhone: z
    .string()
    .trim()
    .min(
      8,
      "Nomor telepon tidak valid."
    )
    .max(
      20,
      "Nomor telepon terlalu panjang."
    ),

  province: z
    .string()
    .trim()
    .min(
      1,
      "Provinsi wajib dipilih."
    )
    .max(100),

  city: z
    .string()
    .trim()
    .min(
      1,
      "Kota wajib dipilih."
    )
    .max(100),

  district: z
    .string()
    .trim()
    .min(
      1,
      "Kecamatan wajib dipilih."
    )
    .max(100),

  village: z
    .string()
    .trim()
    .min(
      1,
      "Kelurahan wajib dipilih."
    )
    .max(100),

  postalCode: z
    .string()
    .trim()
    .regex(
      /^\d{5}$/,
      "Kode pos harus terdiri dari 5 angka."
    ),

  fullAddress: z
    .string()
    .trim()
    .min(
      5,
      "Alamat lengkap minimal 5 karakter."
    )
    .max(
      1000,
      "Alamat lengkap maksimal 1000 karakter."
    ),

  latitude: coordinateSchema
    .refine(
      (value) =>
        value === undefined ||
        value === null ||
        (value >= -90 &&
          value <= 90),
      {
        message:
          "Latitude tidak valid.",
      }
    ),

  longitude: coordinateSchema
    .refine(
      (value) =>
        value === undefined ||
        value === null ||
        (value >= -180 &&
          value <= 180),
      {
        message:
          "Longitude tidak valid.",
      }
    ),

  label: z
    .string()
    .trim()
    .max(
      50,
      "Label alamat maksimal 50 karakter."
    )
    .optional()
    .nullable(),

  notes: z
    .string()
    .trim()
    .max(
      500,
      "Catatan maksimal 500 karakter."
    )
    .optional()
    .nullable(),

  isDefault: z
    .boolean()
    .optional(),
});

export type AddressSchemaInput =
  z.infer<
    typeof addressSchema
  >;