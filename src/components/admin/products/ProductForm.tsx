"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import Link from "next/link";

import {
  useRouter,
} from "next/navigation";

import {
  ImagePlus,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import {
  useFormStatus,
} from "react-dom";

import {
  Button,
} from "@/components/ui/button";

import {
  Card,
} from "@/components/ui/card";

import {
  Input,
} from "@/components/ui/input";

import {
  Label,
} from "@/components/ui/label";

import {
  Textarea,
} from "@/components/ui/textarea";

import {
  Switch,
} from "@/components/ui/switch";

import type {
  ActionResult,
} from "@/types/action-result";

/**
 * ============================================================
 * CATEGORY OPTION
 * ============================================================
 */

interface CategoryOption {
  id: string;
  name: string;
}

/**
 * ============================================================
 * PRODUCT VARIANT / SKU V3
 * ============================================================
 *
 * Tidak ada lagi konsep khusus Weight.
 *
 * Berat, kondisi, grade, ukuran, warna, dll semuanya
 * diperlakukan sebagai VariantGroup.
 */

export interface ProductVariantOptionValue {
  id?: string;
  key?: string;
  label: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface ProductVariantGroupValue {
  id?: string;
  name: string;
  sortOrder?: number;
  isActive?: boolean;
  /**
   * clientKey hanya dipakai frontend untuk menjaga reference
   * option baru tetap stabil sebelum mempunyai database ID.
   * Tidak dikirim ke server.
   */
  clientKey: string;
  options: ProductVariantOptionValue[];
}

export interface ProductSkuValue {
  id?: string;
  sku: string;
  price: number;
  stock: number;
  optionRefs: string[];
  isActive?: boolean;
}

export interface ProductFormValues {
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  sku: string;
  price: number;

  isDiscountActive: boolean;
  discountType:
    | "PERCENTAGE"
    | "FIXED_AMOUNT"
    | "";
  discountValue: number | "";
  discountStartAt: string;
  discountEndAt: string;

  stock: number;

  variantGroups: ProductVariantGroupValue[];
  skus: ProductSkuValue[];

  isPublished: boolean;
  featured: boolean;
}

interface ProductFormProps {
  categories: CategoryOption[];

  defaultValues?: Partial<
    Omit<
      ProductFormValues,
      "variantGroups" | "skus"
    >
  > & {
    variantGroups?: Array<{
      id?: string;
      name: string;
      sortOrder?: number;
      isActive?: boolean;
      options: Array<{
        id?: string;
        key?: string;
        label: string;
        sortOrder?: number;
        isActive?: boolean;
      }>;
    }>;
    skus?: Array<{
      id?: string;
      sku: string;
      price: number;
      stock: number;
      optionRefs?: string[];
      isActive?: boolean;
    }>;
  };

  submitLabel?: string;
  showImageUpload?: boolean;

  action: (
    state: ActionResult,
    formData: FormData
  ) => Promise<ActionResult>;
}

const initialState: ActionResult = {
  success: false,
  message: "",
};

/**
 * ============================================================
 * VARIANT HELPERS
 * ============================================================
 */

function normalizeKeyPart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createClientKey(prefix: string): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function getOptionRef(
  option: ProductVariantOptionValue
): string {
  return option.id ?? option.key ?? "";
}

function normalizeVariantGroups(
  groups:
    | NonNullable<ProductFormProps["defaultValues"]>["variantGroups"]
    | undefined
): ProductVariantGroupValue[] {
  if (!groups || groups.length === 0) {
    return [];
  }

  return groups.map(
    (group, groupIndex) => {
      const clientKey =
        group.id ??
        `group-${groupIndex}`;

      return {
        id: group.id,
        name: String(
          group.name ?? ""
        ).trim(),
        sortOrder:
          group.sortOrder ??
          groupIndex,
        isActive:
          group.isActive ??
          true,
        clientKey,
        options: (
          group.options ?? []
        ).map(
          (option, optionIndex) => ({
            id: option.id,
            key:
              option.key ??
              option.id ??
              `${clientKey}::option-${optionIndex}`,
            label: String(
              option.label ?? ""
            ).trim(),
            sortOrder:
              option.sortOrder ??
              optionIndex,
            isActive:
              option.isActive ??
              true,
          })
        ),
      };
    }
  );
}

function normalizeSkus(
  skus:
    | NonNullable<ProductFormProps["defaultValues"]>["skus"]
    | undefined
): ProductSkuValue[] {
  if (!skus || skus.length === 0) {
    return [];
  }

  return skus.map(
    (sku) => ({
      id: sku.id,
      sku: String(
        sku.sku ?? ""
      ).trim(),
      price: Number.isFinite(
        Number(sku.price)
      )
        ? Math.max(
            0,
            Number(sku.price)
          )
        : 0,
      stock: Number.isFinite(
        Number(sku.stock)
      )
        ? Math.max(
            0,
            Math.trunc(
              Number(sku.stock)
            )
          )
        : 0,
      optionRefs:
        Array.isArray(
          sku.optionRefs
        )
          ? sku.optionRefs.filter(
              Boolean
            )
          : [],
      isActive:
        sku.isActive ??
        true,
    })
  );
}

function combinationKey(
  optionRefs: string[]
): string {
  return [...optionRefs]
    .sort()
    .join("|");
}

function generateSkuCode(
  baseSku: string,
  labels: string[],
  fallbackIndex: number
): string {
  const base =
    normalizeKeyPart(
      baseSku
    ).toUpperCase();

  const suffix = labels
    .map(normalizeKeyPart)
    .filter(Boolean)
    .join("-")
    .toUpperCase();

  if (base && suffix) {
    return `${base}-${suffix}`;
  }

  if (base) {
    return `${base}-${fallbackIndex + 1}`;
  }

  if (suffix) {
    return suffix;
  }

  return `SKU-${fallbackIndex + 1}`;
}

/**
 * Generate Cartesian Product SKU.
 *
 * Existing SKU:
 * - id dipertahankan
 * - sku dipertahankan
 * - price dipertahankan
 * - stock dipertahankan
 *
 * SKU baru:
 * - sku dibuat otomatis
 * - price = 0
 * - stock = 0
 */
function syncSkusForGroups(
  groups: ProductVariantGroupValue[],
  previousSkus: ProductSkuValue[],
  baseSku: string
): ProductSkuValue[] {
  const usableGroups =
    groups
      .map((group) => ({
        ...group,
        options:
          group.options.filter(
            (option) =>
              option.label.trim()
          ),
      }))
      .filter(
        (group) =>
          group.name.trim() &&
          group.options.length > 0
      );

  if (
    usableGroups.length !==
    groups.length
  ) {
    return previousSkus;
  }

  if (usableGroups.length === 0) {
    return [];
  }

  const combinations: ProductVariantOptionValue[][] =
    [[]];

  for (const group of usableGroups) {
    const next: ProductVariantOptionValue[][] =
      [];

    for (const combination of combinations) {
      for (const option of group.options) {
        next.push([
          ...combination,
          option,
        ]);
      }
    }

    combinations.splice(
      0,
      combinations.length,
      ...next
    );
  }

  const previousByCombination =
    new Map<string, ProductSkuValue>();

  previousSkus.forEach(
    (sku) => {
      previousByCombination.set(
        combinationKey(
          sku.optionRefs
        ),
        sku
      );
    }
  );

  return combinations.map(
    (combination, index) => {
      const optionRefs =
        combination
          .map(getOptionRef)
          .filter(Boolean);

      const key =
        combinationKey(
          optionRefs
        );

      const previous =
        previousByCombination.get(
          key
        );

      if (previous) {
        return {
          ...previous,
          optionRefs,
        };
      }

      return {
        sku: generateSkuCode(
          baseSku,
          combination.map(
            (option) =>
              option.label
          ),
          index
        ),
        price: 0,
        stock: 0,
        optionRefs,
        isActive: true,
      };
    }
  );
}

function serializeVariantGroups(
  groups: ProductVariantGroupValue[]
) {
  return groups.map(
    (group, groupIndex) => ({
      ...(group.id
        ? { id: group.id }
        : {}),
      name: group.name.trim(),
      sortOrder:
        group.sortOrder ??
        groupIndex,
      isActive:
        group.isActive ??
        true,
      options:
        group.options
          .filter(
            (option) =>
              option.label.trim()
          )
          .map(
            (option, optionIndex) => ({
              ...(option.id
                ? { id: option.id }
                : {}),
              ...(option.id
                ? {}
                : {
                    key:
                      option.key ??
                      `${group.clientKey}::option-${optionIndex}`,
                  }),
              label:
                option.label.trim(),
              sortOrder:
                option.sortOrder ??
                optionIndex,
              isActive:
                option.isActive ??
                true,
            })
          ),
    })
  );
}

function serializeSkus(
  skus: ProductSkuValue[]
) {
  return skus.map(
    (sku) => ({
      ...(sku.id
        ? { id: sku.id }
        : {}),
      sku: sku.sku.trim(),
      price: Math.max(
        0,
        Number(sku.price) || 0
      ),
      stock: Math.max(
        0,
        Math.trunc(
          Number(sku.stock) || 0
        )
      ),
      optionRefs:
        sku.optionRefs.filter(
          Boolean
        ),
      isActive:
        sku.isActive ??
        true,
    })
  );
}

function calculateTotalSkuStock(
  skus: ProductSkuValue[]
): number {
  return skus.reduce(
    (total, sku) => {
      if (
        sku.isActive === false
      ) {
        return total;
      }

      return (
        total +
        Math.max(
          0,
          Math.trunc(
            Number(sku.stock) || 0
          )
        )
      );
    },
    0
  );
}

function formatRupiah(
  value: number
): string {
  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }
  ).format(value || 0);
}
/**
 * SLUG GENERATOR
 * ============================================================
 *
 * Contoh:
 * "Ikan Tuna Segar Premium" -> "ikan-tuna-segar-premium"
 *
 * Rules:
 * - lowercase
 * - remove accents
 * - remove unsupported characters
 * - spaces -> hyphen
 * - collapse duplicate hyphens
 * ============================================================
 */
function generateSlug(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * ============================================================
 * SUBMIT BUTTON
 * ============================================================
 */

function SubmitButton({
  label,
}: {
  label: string;
}) {
  const {
    pending,
  } =
    useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
    >
      <Save className="mr-2 h-4 w-4" />

      {pending
        ? "Menyimpan..."
        : label}
    </Button>
  );
}

/**
 * ============================================================
 * PRODUCT FORM
 * ============================================================
 */

export function ProductForm({
  categories,
  defaultValues,
  submitLabel = "Simpan Produk",
  action,
  showImageUpload = true,
}: ProductFormProps) {
  const router =
    useRouter();

  /**
   * ==========================================================
   * SERVER ACTION STATE
   * ==========================================================
   */

  const [
    state,
    formAction,
  ] =
    useActionState(
      action,
      initialState
    );

    /**
 * ============================================================
 * SLUG AUTO GENERATION
 * ============================================================
 *
 * false = slug masih mengikuti nama produk
 * true  = admin sudah mengubah slug secara manual
 *
 * Pada halaman edit:
 * jika produk sudah mempunyai slug,
 * jangan otomatis menimpanya ketika nama berubah.
 * ============================================================
 */
const slugManuallyEditedRef =
  useRef(
    Boolean(
      defaultValues?.slug?.trim()
    )
  );

  /**
   * ==========================================================
   * LOCAL FORM STATE
   * ==========================================================
   */

  const [
    form,
    setForm,
  ] =
    useState<ProductFormValues>({
      categoryId:
        defaultValues?.categoryId ??
        "",

      name:
        defaultValues?.name ??
        "",

      slug:
        defaultValues?.slug ??
        "",

      description:
        defaultValues?.description ??
        "",

      sku:
        defaultValues?.sku ??
        "",

      price:
        Number(
          defaultValues?.price ?? 0
        ),

              /**
       * ========================================================
       * PRODUCT DISCOUNT
       * ========================================================
       */

      isDiscountActive:
        defaultValues?.isDiscountActive ??
        false,

      discountType:
        defaultValues?.discountType ??
        "",

      discountValue:
        defaultValues?.discountValue !==
        undefined
          ? Number(
              defaultValues.discountValue
            )
          : "",

      discountStartAt:
        defaultValues?.discountStartAt
          ? new Date(
              defaultValues.discountStartAt
            )
              .toISOString()
              .slice(0, 16)
          : "",

      discountEndAt:
        defaultValues?.discountEndAt
          ? new Date(
              defaultValues.discountEndAt
            )
              .toISOString()
              .slice(0, 16)
          : "",

      stock:
        Number(
          defaultValues?.stock ?? 0
        ),

      variantGroups:
        normalizeVariantGroups(
          defaultValues?.variantGroups
        ),

      skus:
        normalizeSkus(
          defaultValues?.skus
        ),

      isPublished:
        defaultValues?.isPublished ??
        true,

      featured:
        defaultValues?.featured ??
        false,
    });

  /**
   * ==========================================================
   * PRODUCT IMAGE STATE
   * ==========================================================
   */

  const [
    selectedImages,
    setSelectedImages,
  ] =
    useState<File[]>([]);

    const imageInputRef =
  useRef<HTMLInputElement | null>(
    null
  );

  useEffect(() => {
  if (!imageInputRef.current) {
    return;
  }

  const dataTransfer =
    new DataTransfer();

  selectedImages.forEach((file) => {
    dataTransfer.items.add(file);
  });

  imageInputRef.current.files =
    dataTransfer.files;
}, [selectedImages]);

  const [
    imagePreviews,
    setImagePreviews,
  ] =
    useState<string[]>([]);

  /**
   * ==========================================================
   * CLEANUP OBJECT URL
   * ==========================================================
   */

  useEffect(() => {
    return () => {
      imagePreviews.forEach(
        (preview) => {
          if (
            preview.startsWith(
              "blob:"
            )
          ) {
            URL.revokeObjectURL(
              preview
            );
          }
        }
      );
    };
  }, [
    imagePreviews,
  ]);

  /**
   * ==========================================================
   * SYNC FILE INPUT
   * ==========================================================
   */

  useEffect(() => {
    const input =
      imageInputRef.current;

    if (!input) {
      return;
    }

    const dataTransfer =
      new DataTransfer();

    selectedImages.forEach(
      (file) => {
        dataTransfer.items.add(
          file
        );
      }
    );

    input.files =
      dataTransfer.files;
  }, [
    selectedImages,
  ]);

  /**
   * ==========================================================
   * ACTION RESULT
   * ==========================================================
   */

  useEffect(() => {
    if (!state.message) {
      return;
    }

    if (state.success) {
      window.alert(
        state.message
      );

      router.push(
        "/admin/products"
      );

      router.refresh();

      return;
    }

    window.alert(
      state.message
    );
  }, [
    state.success,
    state.message,
    router,
  ]);

  /**
   * ==========================================================
  /**
   * ==========================================================
   * VARIANT GROUP HANDLERS
   * ==========================================================
   */

  const updateVariantGroups = (
    updater: (
      previous: ProductVariantGroupValue[]
    ) => ProductVariantGroupValue[]
  ) => {
    setForm((previous) => {
      const nextGroups =
        updater(
          previous.variantGroups
        );

      return {
        ...previous,
        variantGroups:
          nextGroups,
        skus:
          syncSkusForGroups(
            nextGroups,
            previous.skus,
            previous.sku
          ),
      };
    });
  };

  const addVariantGroup = () => {
    updateVariantGroups(
      (previous) => [
        ...previous,
        {
          name: "",
          sortOrder:
            previous.length,
          isActive: true,
          clientKey:
            createClientKey(
              "group"
            ),
          options: [],
        },
      ]
    );
  };

  const updateVariantGroupName = (
    groupIndex: number,
    value: string
  ) => {
    updateVariantGroups(
      (previous) =>
        previous.map(
          (group, index) =>
            index === groupIndex
              ? {
                  ...group,
                  name: value,
                }
              : group
        )
    );
  };

  const removeVariantGroup = (
    groupIndex: number
  ) => {
    updateVariantGroups(
      (previous) =>
        previous
          .filter(
            (_group, index) =>
              index !== groupIndex
          )
          .map(
            (group, index) => ({
              ...group,
              sortOrder: index,
            })
          )
    );
  };

  const addVariantOption = (
    groupIndex: number
  ) => {
    updateVariantGroups(
      (previous) =>
        previous.map(
          (group, index) => {
            if (
              index !== groupIndex
            ) {
              return group;
            }

            const optionKey =
              `${group.clientKey}::${createClientKey(
                "option"
              )}`;

            return {
              ...group,
              options: [
                ...group.options,
                {
                  key: optionKey,
                  label: "",
                  sortOrder:
                    group.options.length,
                  isActive: true,
                },
              ],
            };
          }
        )
    );
  };

  const updateVariantOptionLabel = (
    groupIndex: number,
    optionIndex: number,
    value: string
  ) => {
    updateVariantGroups(
      (previous) =>
        previous.map(
          (group, groupPosition) =>
            groupPosition ===
            groupIndex
              ? {
                  ...group,
                  options:
                    group.options.map(
                      (
                        option,
                        position
                      ) =>
                        position ===
                        optionIndex
                          ? {
                              ...option,
                              label: value,
                            }
                          : option
                    ),
                }
              : group
        )
    );
  };

  const removeVariantOption = (
    groupIndex: number,
    optionIndex: number
  ) => {
    updateVariantGroups(
      (previous) =>
        previous.map(
          (group, groupPosition) =>
            groupPosition ===
            groupIndex
              ? {
                  ...group,
                  options:
                    group.options
                      .filter(
                        (
                          _option,
                          position
                        ) =>
                          position !==
                          optionIndex
                      )
                      .map(
                        (
                          option,
                          position
                        ) => ({
                          ...option,
                          sortOrder:
                            position,
                        })
                      ),
                }
              : group
        )
    );
  };

  const updateSku = (
    index: number,
    field:
      | "sku"
      | "price"
      | "stock",
    value: string
  ) => {
    setForm(
      (previous) => ({
        ...previous,
        skus:
          previous.skus.map(
            (sku, skuIndex) => {
              if (
                skuIndex !== index
              ) {
                return sku;
              }

              if (
                field === "sku"
              ) {
                return {
                  ...sku,
                  sku: value,
                };
              }

              const numeric =
                Number(value);

              return {
                ...sku,
                [field]:
                  Number.isFinite(
                    numeric
                  )
                    ? Math.max(
                        0,
                        field ===
                          "stock"
                          ? Math.trunc(
                              numeric
                            )
                          : numeric
                      )
                    : 0,
              };
            }
          ),
      })
    );
  };

  const getSkuCombinationLabel = (
    sku: ProductSkuValue
  ): string => {
    return sku.optionRefs
      .map((ref) => {
        for (
          const group of
          form.variantGroups
        ) {
          const option =
            group.options.find(
              (candidate) =>
                getOptionRef(
                  candidate
                ) === ref
            );

          if (option) {
            return `${group.name}: ${option.label}`;
          }
        }

        return ref;
      })
      .join(" × ");
  };

  const variantGroupsPayload =
    serializeVariantGroups(
      form.variantGroups
    );

  const skusPayload =
    serializeSkus(
      form.skus
    );

    const hasVariants =
  form.variantGroups.length > 0;

const totalSkuStock =
  calculateTotalSkuStock(
    form.skus
  );

  const handleFormSubmit = (
    event: FormEvent<HTMLFormElement>
  ) => {
    const groups =
      form.variantGroups;

    if (groups.length === 0) {
      return;
    }

    const invalidGroup =
      groups.find(
        (group) =>
          !group.name.trim() ||
          group.options.filter(
            (option) =>
              option.label.trim()
          ).length === 0
      );

    if (invalidGroup) {
      event.preventDefault();

      window.alert(
        "Setiap group varian wajib memiliki nama dan minimal satu option."
      );

      return;
    }

    if (
      form.skus.length === 0
    ) {
      event.preventDefault();

      window.alert(
        "Belum ada kombinasi SKU yang dapat disimpan."
      );
    }
  };

  /**
   * IMAGE HANDLERS
   * ==========================================================
   */

  const handleImageChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const files =
      Array.from(
        event.target.files ?? []
      );

    if (
      files.length === 0
    ) {
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    const maxSize =
      5 * 1024 * 1024;

    const validFiles =
      files.filter(
        (file) => {
          if (
            !allowedTypes.includes(
              file.type
            )
          ) {
            window.alert(
              `${file.name} bukan format gambar yang didukung.`
            );

            return false;
          }

          if (
            file.size >
            maxSize
          ) {
            window.alert(
              `${file.name} melebihi batas 5 MB.`
            );

            return false;
          }

          return true;
        }
      );

    if (
      validFiles.length === 0
    ) {
      return;
    }

    const newFiles =
      validFiles.filter(
        (file) => {
          return !selectedImages.some(
            (
              existingFile
            ) =>
              existingFile.name ===
                file.name &&
              existingFile.size ===
                file.size &&
              existingFile.lastModified ===
                file.lastModified
          );
        }
      );

    if (
      newFiles.length === 0
    ) {
      return;
    }

    const previews =
      newFiles.map(
        (file) =>
          URL.createObjectURL(
            file
          )
      );

    setSelectedImages(
      (previous) => [
        ...previous,
        ...newFiles,
      ]
    );

    setImagePreviews(
      (previous) => [
        ...previous,
        ...previews,
      ]
    );

    /**
     * Reset value agar file yang sama
     * dapat dipilih kembali setelah dihapus.
     */

    event.target.value = "";
  };

  const removeSelectedImage = (
    index: number
  ) => {
    setImagePreviews(
      (previous) => {
        const preview =
          previous[index];

        if (
          preview?.startsWith(
            "blob:"
          )
        ) {
          URL.revokeObjectURL(
            preview
          );
        }

        return previous.filter(
          (
            _preview,
            previewIndex
          ) =>
            previewIndex !== index
        );
      }
    );

    setSelectedImages(
      (previous) =>
        previous.filter(
          (
            _image,
            imageIndex
          ) =>
            imageIndex !== index
        )
    );
  };

  /**
   * ==========================================================
   * FORM
   * ==========================================================
   */

  return (
    <form
      action={formAction}
      onSubmit={handleFormSubmit}
      className="space-y-5 sm:space-y-6"
    >
      {/* ====================================================== */}
      {/* ERROR MESSAGE */}
      {/* ====================================================== */}

      {state.message &&
        !state.success && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.message}
          </div>
        )}

      {/* ====================================================== */}
      {/* INFORMASI PRODUK */}
      {/* ====================================================== */}

      <Card className="space-y-5 p-4 sm:space-y-6 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold">
            Informasi Produk
          </h2>

          <p className="text-sm text-muted-foreground">
            Masukkan informasi dasar produk.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="categoryId">
              Kategori
            </Label>

            <select
              id="categoryId"
              name="categoryId"
              className="w-full rounded-md border bg-background px-3 py-2"
              value={
                form.categoryId
              }
              onChange={(
                event
              ) =>
                setForm(
                  (
                    previous
                  ) => ({
                    ...previous,

                    categoryId:
                      event.target
                        .value,
                  })
                )
              }
              required
            >
              <option value="">
                Pilih Kategori
              </option>

              {categories.map(
                (
                  category
                ) => (
                  <option
                    key={
                      category.id
                    }
                    value={
                      category.id
                    }
                  >
                    {
                      category.name
                    }
                  </option>
                )
              )}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">
              Nama Produk
            </Label>

            <Input
              id="name"
              name="name"
              value={form.name}
              onChange={(event) => {
                const name =
                  event.target.value;

                setForm(
                  (previous) => ({
                    ...previous,

                    name,

                    slug:
                      slugManuallyEditedRef.current
                        ? previous.slug
                        : generateSlug(name),
                  })
                );
              }}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">
              Slug
            </Label>

            <Input
              id="slug"
              name="slug"
              value={form.slug}
              onChange={(event) => {
                slugManuallyEditedRef.current =
                  true;

                setForm(
                  (previous) => ({
                    ...previous,

                    slug: generateSlug(
                      event.target.value
                    ),
                  })
                );
              }}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sku">
              SKU
            </Label>

            <Input
              id="sku"
              name="sku"
              value={form.sku}
              onChange={(
                event
              ) =>
                setForm(
                  (
                    previous
                  ) => ({
                    ...previous,

                    sku:
                      event.target
                        .value,
                  })
                )
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">
            Deskripsi Produk
          </Label>

          <Textarea
            id="description"
            name="description"
            value={
              form.description
            }
            onChange={(
              event
            ) =>
              setForm(
                (
                  previous
                ) => ({
                  ...previous,

                  description:
                    event.target
                      .value,
                })
              )
            }
            rows={5}
          />
        </div>
      </Card>

      {showImageUpload && (
        <>
      {/* ====================================================== */}
      {/* GAMBAR PRODUK */}
      {/* ====================================================== */}

      <Card className="space-y-5 p-4 sm:space-y-6 sm:p-6">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <ImagePlus className="h-5 w-5" />

            Gambar Produk
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Upload satu atau beberapa gambar produk.
            Format JPG, PNG, atau WEBP dengan ukuran
            maksimal 5 MB per gambar.
          </p>
        </div>

        <input
          ref={imageInputRef}
          id="product-images"
          name="images"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={
            handleImageChange
          }
        />

        <label
          htmlFor="product-images"
          className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-6 transition hover:bg-muted/50"
        >
          <Upload className="mb-3 h-8 w-8 text-muted-foreground" />

          <span className="text-sm font-medium">
            Klik untuk memilih gambar
          </span>

          <span className="mt-1 text-xs text-muted-foreground">
            Bisa memilih beberapa gambar sekaligus
          </span>
        </label>

        {imagePreviews.length >
          0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {imagePreviews.map(
              (
                preview,
                index
              ) => (
                <div
                  key={`${preview}-${index}`}
                  className="group relative overflow-hidden rounded-xl border bg-muted"
                >
                  <img
                    src={preview}
                    alt={`Preview produk ${
                      index + 1
                    }`}
                    className="aspect-square w-full object-cover"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      removeSelectedImage(
                        index
                      )
                    }
                    className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-background/90 shadow-sm transition hover:bg-destructive hover:text-destructive-foreground"
                    aria-label="Hapus gambar"
                    title="Hapus gambar"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  <div className="absolute inset-x-0 bottom-0 bg-background/85 px-2 py-1.5">
                    <p className="truncate text-xs">
                      {selectedImages[
                        index
                      ]?.name ??
                        "Gambar produk"}
                    </p>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </Card>

        </>
      )}

      {/* ====================================================== */}
      {/* HARGA DAN STOK */}
      {/* ====================================================== */}

      <Card className="space-y-5 p-4 sm:space-y-6 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold">
            Harga & Stok
          </h2>

          <p className="text-sm text-muted-foreground">
            Harga dasar dan stok produk digunakan
            sebagai fallback untuk produk tanpa varian.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="price">
              Harga Dasar Produk
            </Label>

            <Input
              id="price"
              name="price"
              type="number"
              min="0"
              step="1"
              value={form.price}
              onChange={(
                event
              ) =>
                setForm(
                  (
                    previous
                  ) => ({
                    ...previous,

                    price:
                      Math.max(
                        0,
                        Number(
                          event.target
                            .value
                        ) || 0
                      ),
                  })
                )
              }
              required
            />
          </div>

          <div className="space-y-2">
  <Label htmlFor="stock">
    Stok Produk
  </Label>

  <Input
    id="stock"
    name="stock"
    type="number"
    min="0"
    step="1"
    value={
      hasVariants
        ? totalSkuStock
        : form.stock
    }
    onChange={
      hasVariants
        ? undefined
        : (event) =>
            setForm(
              (previous) => ({
                ...previous,

                stock:
                  Math.max(
                    0,
                    Number(
                      event.target
                        .value
                    ) || 0
                  ),
              })
            )
    }
    readOnly={
      hasVariants
    }
    required
  />

  <p className="text-xs text-muted-foreground">
    {hasVariants
      ? "Stok otomatis dihitung dari total stok seluruh SKU."
      : "Masukkan jumlah stok produk yang tersedia."}
  </p>
</div>
        </div>
      </Card>

      {/* ====================================================== */}
      {/* DISKON PRODUK */}
      {/* ====================================================== */}

      <Card className="space-y-5 p-4 sm:space-y-6 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold">
            Diskon Produk
          </h2>

          <p className="text-sm text-muted-foreground">
            Atur diskon khusus untuk produk ini.
            Untuk produk dengan SKU, harga promo
            mengikuti harga SKU yang digunakan customer.
          </p>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
          <div>
            <Label htmlFor="isDiscountActive">
              Aktifkan Diskon
            </Label>

            <p className="mt-1 text-sm text-muted-foreground">
              Aktifkan jika produk ini memiliki
              harga promo.
            </p>
          </div>

          <Switch
            id="isDiscountActive"
            checked={
              form.isDiscountActive
            }
            onCheckedChange={(
              checked
            ) =>
              setForm(
                (
                  previous
                ) => ({
                  ...previous,

                  isDiscountActive:
                    checked,

                  /**
                   * Bersihkan konfigurasi
                   * ketika diskon dimatikan.
                   */
                  discountType:
                    checked
                      ? previous.discountType
                      : "",

                  discountValue:
                    checked
                      ? previous.discountValue
                      : "",

                  discountStartAt:
                    checked
                      ? previous.discountStartAt
                      : "",

                  discountEndAt:
                    checked
                      ? previous.discountEndAt
                      : "",
                })
              )
            }
          />
        </div>

        <input
          type="hidden"
          name="isDiscountActive"
          value={
            form.isDiscountActive
              ? "true"
              : "false"
          }
        />

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="discountType">
              Jenis Diskon
            </Label>

            <select
              id="discountType"
              name="discountType"
              disabled={
                !form.isDiscountActive
              }
              value={
                form.discountType
              }
              onChange={(
                event
              ) =>
                setForm(
                  (
                    previous
                  ) => ({
                    ...previous,

                    discountType:
                      event.target
                        .value as
                        | "PERCENTAGE"
                        | "FIXED_AMOUNT"
                        | "",
                  })
                )
              }
              className="w-full rounded-md border bg-background px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">
                Pilih Jenis Diskon
              </option>

              <option value="PERCENTAGE">
                Persentase (%)
              </option>

              <option value="FIXED_AMOUNT">
                Nominal (Rp)
              </option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="discountValue">
              Nilai Diskon
            </Label>

            <Input
              id="discountValue"
              name="discountValue"
              type="number"
              min="0"
              step="1"
              disabled={
                !form.isDiscountActive
              }
              value={
                form.discountValue
              }
              placeholder={
                form.discountType ===
                "PERCENTAGE"
                  ? "Contoh: 10"
                  : "Contoh: 5000"
              }
              onChange={(
                event
              ) => {
                const rawValue =
                  event.target.value;

                if (
                  rawValue === ""
                ) {
                  setForm(
                    (
                      previous
                    ) => ({
                      ...previous,

                      discountValue:
                        "",
                    })
                  );

                  return;
                }

                const value =
                  Number(rawValue);

                setForm(
                  (
                    previous
                  ) => ({
                    ...previous,

                    discountValue:
                      Number.isFinite(
                        value
                      )
                        ? Math.max(
                            0,
                            value
                          )
                        : 0,
                  })
                );
              }}
            />

            {form.discountType ===
              "PERCENTAGE" && (
              <p className="text-xs text-muted-foreground">
                Maksimal diskon adalah 100%.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="discountStartAt">
              Mulai Diskon
            </Label>

            <Input
              id="discountStartAt"
              name="discountStartAt"
              type="datetime-local"
              disabled={
                !form.isDiscountActive
              }
              value={
                form.discountStartAt
              }
              onChange={(
                event
              ) =>
                setForm(
                  (
                    previous
                  ) => ({
                    ...previous,

                    discountStartAt:
                      event.target
                        .value,
                  })
                )
              }
            />

            <p className="text-xs text-muted-foreground">
              Kosongkan agar diskon langsung aktif.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="discountEndAt">
              Berakhir Diskon
            </Label>

            <Input
              id="discountEndAt"
              name="discountEndAt"
              type="datetime-local"
              disabled={
                !form.isDiscountActive
              }
              value={
                form.discountEndAt
              }
              onChange={(
                event
              ) =>
                setForm(
                  (
                    previous
                  ) => ({
                    ...previous,

                    discountEndAt:
                      event.target
                        .value,
                  })
                )
              }
            />

            <p className="text-xs text-muted-foreground">
              Kosongkan jika diskon tidak memiliki
              batas waktu.
            </p>
          </div>
        </div>
      </Card>

      {/* ====================================================== */}
      {/* ====================================================== */}
      {/* VARIANT GROUPS & SKU */}
      {/* ====================================================== */}

      <Card className="space-y-5 p-4 sm:space-y-6 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              Varian Produk
            </h2>

            <p className="text-sm text-muted-foreground">
              Buat group varian tanpa batas. Berat,
              kondisi, grade, ukuran, warna, dan pilihan
              lain diperlakukan dengan struktur yang sama.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={
              addVariantGroup
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Tambah Group
          </Button>
        </div>

        {form.variantGroups.length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            Produk ini belum memiliki varian.
            <br />
            Jika tidak ada varian, harga dan stok di
            bagian Harga & Stok digunakan sebagai fallback
            produk.
          </div>
        ) : (
          <div className="space-y-5">
            {form.variantGroups.map(
              (group, groupIndex) => (
                <div
                  key={group.clientKey}
                  className="rounded-xl border p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="flex-1 space-y-2">
                      <Label
                        htmlFor={`variant-group-${groupIndex}`}
                      >
                        Nama Group
                      </Label>

                      <Input
                        id={`variant-group-${groupIndex}`}
                        value={
                          group.name
                        }
                        placeholder="Contoh: Berat, Kondisi, Grade"
                        onChange={(
                          event
                        ) =>
                          updateVariantGroupName(
                            groupIndex,
                            event.target.value
                          )
                        }
                      />
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        removeVariantGroup(
                          groupIndex
                        )
                      }
                      aria-label={`Hapus group ${
                        group.name ||
                        groupIndex + 1
                      }`}
                      title="Hapus group"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">
                          Options
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Minimal satu option per group.
                        </p>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          addVariantOption(
                            groupIndex
                          )
                        }
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Option
                      </Button>
                    </div>

                    {group.options.length === 0 ? (
                      <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                        Belum ada option.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {group.options.map(
                          (
                            option,
                            optionIndex
                          ) => (
                            <div
                              key={
                                option.id ??
                                option.key ??
                                `${group.clientKey}-${optionIndex}`
                              }
                              className="flex gap-2"
                            >
                              <Input
                                value={
                                  option.label
                                }
                                placeholder={`Option ${
                                  optionIndex + 1
                                }`}
                                onChange={(
                                  event
                                ) =>
                                  updateVariantOptionLabel(
                                    groupIndex,
                                    optionIndex,
                                    event.target.value
                                  )
                                }
                              />

                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() =>
                                  removeVariantOption(
                                    groupIndex,
                                    optionIndex
                                  )
                                }
                                aria-label="Hapus option"
                                title="Hapus option"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </Card>

      {/* ====================================================== */}
      {/* SKU COMBINATIONS */}
      {/* ====================================================== */}

      {form.variantGroups.length > 0 && (
        <Card className="space-y-5 p-4 sm:space-y-6 sm:p-6">
          <div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  SKU & Harga
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Sistem membuat Cartesian Product dari
                  seluruh group. Harga dan stok disimpan
                  per SKU.
                </p>
              </div>

              <div className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium">
                {form.skus.length} kombinasi SKU
              </div>
            </div>
          </div>

          {form.skus.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              Lengkapi nama group dan minimal satu option
              pada setiap group untuk membentuk kombinasi SKU.
            </div>
          ) : (
            <div className="space-y-4">
              {form.skus.map(
                (sku, skuIndex) => (
                  <div
                    key={
                      sku.id ??
                      `${combinationKey(
                        sku.optionRefs
                      )}-${skuIndex}`
                    }
                    className="rounded-xl border p-4"
                  >
                    <div className="mb-4">
                      <p className="font-medium">
                        {getSkuCombinationLabel(
                          sku
                        )}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        Setiap kombinasi memiliki SKU,
                        harga, dan stok sendiri.
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label
                          htmlFor={`sku-code-${skuIndex}`}
                        >
                          SKU
                        </Label>

                        <Input
                          id={`sku-code-${skuIndex}`}
                          value={
                            sku.sku
                          }
                          onChange={(
                            event
                          ) =>
                            updateSku(
                              skuIndex,
                              "sku",
                              event.target.value
                            )
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor={`sku-price-${skuIndex}`}
                        >
                          Harga
                        </Label>

                        <Input
                          id={`sku-price-${skuIndex}`}
                          type="number"
                          min="0"
                          step="1"
                          value={
                            sku.price
                          }
                          onChange={(
                            event
                          ) =>
                            updateSku(
                              skuIndex,
                              "price",
                              event.target.value
                            )
                          }
                        />

                        <p className="text-xs text-muted-foreground">
                          {formatRupiah(
                            sku.price
                          )}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor={`sku-stock-${skuIndex}`}
                        >
                          Stok
                        </Label>

                        <Input
                          id={`sku-stock-${skuIndex}`}
                          type="number"
                          min="0"
                          step="1"
                          value={
                            sku.stock
                          }
                          onChange={(
                            event
                          ) =>
                            updateSku(
                              skuIndex,
                              "stock",
                              event.target.value
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          <input
            type="hidden"
            name="variantGroups"
            value={JSON.stringify(
              variantGroupsPayload
            )}
            readOnly
          />

          <input
            type="hidden"
            name="skus"
            value={JSON.stringify(
              skusPayload
            )}
            readOnly
          />
        </Card>
      )}

      {/* STATUS PRODUK */}
      {/* ====================================================== */}

      <Card className="space-y-5 p-4 sm:space-y-6 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold">
            Status Produk
          </h2>

          <p className="text-sm text-muted-foreground">
            Atur status publikasi dan produk unggulan.
          </p>
        </div>

        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
            <div>
              <Label htmlFor="isPublished">
                Publikasikan Produk
              </Label>

              <p className="mt-1 text-sm text-muted-foreground">
                Produk akan tampil di halaman customer.
              </p>
            </div>

            <Switch
              id="isPublished"
              checked={
                form.isPublished
              }
              onCheckedChange={(
                checked
              ) =>
                setForm(
                  (
                    previous
                  ) => ({
                    ...previous,

                    isPublished:
                      checked,
                  })
                )
              }
            />
          </div>

          <input
            type="hidden"
            name="isPublished"
            value={
              form.isPublished
                ? "true"
                : "false"
            }
          />

          <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
            <div>
              <Label htmlFor="featured">
                Produk Unggulan
              </Label>

              <p className="mt-1 text-sm text-muted-foreground">
                Tampilkan produk sebagai produk unggulan.
              </p>
            </div>

            <Switch
              id="featured"
              checked={
                form.featured
              }
              onCheckedChange={(
                checked
              ) =>
                setForm(
                  (
                    previous
                  ) => ({
                    ...previous,

                    featured:
                      checked,
                  })
                )
              }
            />
          </div>

          <input
            type="hidden"
            name="featured"
            value={
              form.featured
                ? "true"
                : "false"
            }
          />
        </div>
      </Card>

      {/* ====================================================== */}
      {/* ACTION */}
      {/* ====================================================== */}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href="/admin/products"
          className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Batal
        </Link>

        <SubmitButton
          label={
            submitLabel
          }
        />
      </div>
    </form>
  );
}

export default ProductForm;
