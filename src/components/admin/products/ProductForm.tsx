"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
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
 * PRODUCT VARIANT OPTION
 * ============================================================
 *
 * Contoh:
 *
 * {
 *   label: "Utuh",
 *   priceAdjustment: 0
 * }
 *
 * {
 *   label: "Dibersihkan",
 *   priceAdjustment: 5000
 * }
 */

export interface ProductVariantOptionValue {
  id?: string;

  label: string;

  priceAdjustment: number;
}

/**
 * ============================================================
 * PRODUCT WEIGHT OPTION
 * ============================================================
 *
 * Contoh:
 *
 * {
 *   label: "500gr",
 *   price: 30000
 * }
 */

export interface ProductWeightOptionValue {
  id?: string;

  label: string;

  price: number;
}

/**
 * ============================================================
 * PRODUCT WEIGHT × VARIANT PRICE
 * ============================================================
 */

export interface ProductWeightVariantPriceValue {
  weightLabel: string;
  variantLabel: string;
  price: number;
}

/**
 * ============================================================
 * PRODUCT FORM VALUES
 * ============================================================
 */

export interface ProductFormValues {
  categoryId: string;

  name: string;

  slug: string;

  description: string;

  sku: string;

  /**
   * Harga dasar produk.
   */

  price: number;

    /**
   * ============================================================
   * PRODUCT DISCOUNT
   * ============================================================
   */

  isDiscountActive: boolean;

  discountType:
    | "PERCENTAGE"
    | "FIXED_AMOUNT"
    | "";

  discountValue: number | "";

  discountStartAt: string;

  discountEndAt: string;

  stock: number;

  /**
   * Varian produk.
   */

  variantOptions:
    ProductVariantOptionValue[];

  /**
   * Pilihan berat produk.
   */

  weightOptions:
    ProductWeightOptionValue[];

  weightVariantPrices:
    ProductWeightVariantPriceValue[];

  isPublished: boolean;

  featured: boolean;
}

/**
 * ============================================================
 * PRODUCT FORM PROPS
 * ============================================================
 */

interface ProductFormProps {
  categories: CategoryOption[];

  defaultValues?: Partial<
    Omit<
      ProductFormValues,
      | "variantOptions"
      | "weightOptions"
      | "weightVariantPrices"
    >
  > & {
    /**
     * Support format lama:
     *
     * ["Utuh", "Dibersihkan"]
     *
     * dan format baru:
     *
     * [
     *   {
     *     label: "Utuh",
     *     priceAdjustment: 0
     *   }
     * ]
     */

    variantOptions?:
      | ProductVariantOptionValue[]
      | string[];

    /**
     * Support format lama:
     *
     * ["500gr", "1kg"]
     *
     * dan format baru:
     *
     * [
     *   {
     *     label: "500gr",
     *     price: 30000
     *   }
     * ]
     */

    weightOptions?:
      | ProductWeightOptionValue[]
      | string[];

    weightVariantPrices?:
      | ProductWeightVariantPriceValue[]
      | Array<{
          weightLabel: string;
          variantLabel: string;
          price: number;
        }>;
  };

  submitLabel?: string;

  /**
   * Tampilkan upload gambar di dalam ProductForm.
   *
   * Create Product  -> true (default)
   * Edit Product    -> false karena gallery ditangani
   *                    oleh ProductGallery.
   */
  showImageUpload?: boolean;

  action: (
    state: ActionResult,
    formData: FormData
  ) => Promise<ActionResult>;
}

/**
 * ============================================================
 * INITIAL ACTION STATE
 * ============================================================
 */

const initialState: ActionResult = {
  success: false,
  message: "",
};

/**
 * ============================================================
 * DEFAULT VARIANT OPTIONS
 * ============================================================
 */

const defaultVariantOptions:
  ProductVariantOptionValue[] = [
    {
      label: "Utuh",
      priceAdjustment: 0,
    },
    {
      label: "Dibersihkan",
      priceAdjustment: 0,
    },
  ];

/**
 * ============================================================
 * DEFAULT WEIGHT OPTIONS
 * ============================================================
 */

const defaultWeightOptions:
  ProductWeightOptionValue[] = [
    {
      label: "250gr",
      price: 0,
    },
    {
      label: "500gr",
      price: 0,
    },
    {
      label: "1kg",
      price: 0,
    },
  ];

/**
 * ============================================================
 * NORMALIZE VARIANT OPTIONS
 * ============================================================
 *
 * Tujuan:
 *
 * - Mempertahankan ID option lama dari database.
 * - Mendukung option baru tanpa ID.
 * - Mendukung format lama berupa string.
 * - Membersihkan label.
 * - Menormalisasi priceAdjustment.
 */

function normalizeVariantOptions(
  options:
    | ProductVariantOptionValue[]
    | string[]
    | undefined
): ProductVariantOptionValue[] {
  if (
    !options ||
    options.length === 0
  ) {
    return defaultVariantOptions.map(
      (option) => ({
        ...option,
      })
    );
  }

  return options.map(
    (option) => {
      if (
        typeof option === "string"
      ) {
        return {
          label: option,
          priceAdjustment: 0,
        };
      }

      return {
        id: option.id,

        label:
          String(
            option.label ?? ""
          ).trim(),

        priceAdjustment:
          Number(
            option.priceAdjustment ?? 0
          ),
      };
    }
  );
}

/**
 * ============================================================
 * NORMALIZE WEIGHT OPTIONS
 * ============================================================
 *
 * Tujuan:
 *
 * - Mempertahankan ID weight lama dari database.
 * - Mendukung weight baru tanpa ID.
 * - Mendukung format lama berupa string.
 * - Membersihkan label.
 * - Menormalisasi harga.
 */

function normalizeWeightOptions(
  options:
    | ProductWeightOptionValue[]
    | string[]
    | undefined
): ProductWeightOptionValue[] {
  if (
    !options ||
    options.length === 0
  ) {
    return defaultWeightOptions.map(
      (option) => ({
        ...option,
      })
    );
  }

  return options.map(
    (option) => {
      if (
        typeof option === "string"
      ) {
        return {
          label: option,
          price: 0,
        };
      }

      return {
        id: option.id,

        label:
          String(
            option.label ?? ""
          ).trim(),

        price:
          Number(
            option.price ?? 0
          ),
      };
    }
  );
}

/**
 * ============================================================
 * NORMALIZE WEIGHT × VARIANT PRICES
 * ============================================================
 */

function normalizeWeightVariantPrices(
  options:
    | ProductWeightVariantPriceValue[]
    | undefined
): ProductWeightVariantPriceValue[] {
  if (!options || options.length === 0) {
    return [];
  }

  return options
    .map((option) => {
      const price = Number(option.price ?? 0);

      return {
        weightLabel: String(
          option.weightLabel ?? ""
        ).trim(),
        variantLabel: String(
          option.variantLabel ?? ""
        ).trim(),
        price:
          Number.isFinite(price)
            ? Math.max(0, price)
            : 0,
      };
    })
    .filter(
      (option) =>
        option.weightLabel.length > 0 &&
        option.variantLabel.length > 0
    );
}

/**
 * ============================================================
 * PRICE FORMATTER
 * ============================================================
 */

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

/**
 * ============================================================
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

      /**
       * IMPORTANT:
       *
       * variantOptions sekarang selalu
       * berbentuk object.
       */

      variantOptions:
        normalizeVariantOptions(
          defaultValues?.variantOptions
        ),

      weightOptions:
        normalizeWeightOptions(
          defaultValues?.weightOptions
        ),

      weightVariantPrices:
        normalizeWeightVariantPrices(
          defaultValues?.weightVariantPrices
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
   * VARIANT HANDLERS
   * ==========================================================
   */

  const updateVariantLabel = (
    index: number,
    value: string
  ) => {
    setForm((previous) => {
      const oldLabel =
        previous.variantOptions[index]
          ?.label ?? "";

      return {
        ...previous,
        variantOptions:
          previous.variantOptions.map(
            (item, itemIndex) =>
              itemIndex === index
                ? {
                    ...item,
                    label: value,
                  }
                : item
          ),
        weightVariantPrices:
          previous.weightVariantPrices.map(
            (entry) =>
              entry.variantLabel === oldLabel
                ? {
                    ...entry,
                    variantLabel: value,
                  }
                : entry
          ),
      };
    });
  };

  const updateVariantPriceAdjustment = (
    index: number,
    value: string
  ) => {
    const normalizedValue =
      value.trim();

    const parsedValue =
      normalizedValue === ""
        ? 0
        : Number(
            normalizedValue
          );

    const priceAdjustment =
      Number.isFinite(
        parsedValue
      )
        ? Math.max(
            0,
            parsedValue
          )
        : 0;

    setForm(
      (previous) => ({
        ...previous,

        variantOptions:
          previous.variantOptions.map(
            (
              item,
              itemIndex
            ) =>
              itemIndex === index
                ? {
                    ...item,

                    priceAdjustment,
                  }
                : item
          ),
      })
    );
  };

  const removeVariant = (
    index: number
  ) => {
    setForm((previous) => {
      const removedLabel =
        previous.variantOptions[index]
          ?.label ?? "";

      return {
        ...previous,
        variantOptions:
          previous.variantOptions.filter(
            (_item, itemIndex) =>
              itemIndex !== index
          ),
        weightVariantPrices:
          previous.weightVariantPrices.filter(
            (entry) =>
              entry.variantLabel !==
              removedLabel
          ),
      };
    });
  };

  const addVariant = () => {
    setForm(
      (previous) => ({
        ...previous,

        variantOptions: [
          ...previous.variantOptions,
          {
            label: "",
            priceAdjustment: 0,
          },
        ],
      })
    );
  };

  /**
   * ==========================================================
   * WEIGHT HANDLERS
   * ==========================================================
   */

  const updateWeightLabel = (
    index: number,
    value: string
  ) => {
    setForm((previous) => {
      const oldLabel =
        previous.weightOptions[index]
          ?.label ?? "";

      return {
        ...previous,
        weightOptions:
          previous.weightOptions.map(
            (item, itemIndex) =>
              itemIndex === index
                ? {
                    ...item,
                    label: value,
                  }
                : item
          ),
        weightVariantPrices:
          previous.weightVariantPrices.map(
            (entry) =>
              entry.weightLabel === oldLabel
                ? {
                    ...entry,
                    weightLabel: value,
                  }
                : entry
          ),
      };
    });
  };

  const updateWeightPrice = (
    index: number,
    value: string
  ) => {
    const normalizedValue =
      value.trim();

    const parsedPrice =
      normalizedValue === ""
        ? 0
        : Number(
            normalizedValue
          );

    const price =
      Number.isFinite(
        parsedPrice
      )
        ? Math.max(
            0,
            parsedPrice
          )
        : 0;

    setForm(
      (previous) => ({
        ...previous,

        weightOptions:
          previous.weightOptions.map(
            (
              item,
              itemIndex
            ) =>
              itemIndex === index
                ? {
                    ...item,
                    price,
                  }
                : item
          ),
      })
    );
  };

  const removeWeight = (
    index: number
  ) => {
    setForm((previous) => {
      const removedLabel =
        previous.weightOptions[index]
          ?.label ?? "";

      return {
        ...previous,
        weightOptions:
          previous.weightOptions.filter(
            (_item, itemIndex) =>
              itemIndex !== index
          ),
        weightVariantPrices:
          previous.weightVariantPrices.filter(
            (entry) =>
              entry.weightLabel !==
              removedLabel
          ),
      };
    });
  };

  const addWeight = () => {
    setForm(
      (previous) => ({
        ...previous,

        weightOptions: [
          ...previous.weightOptions,
          {
            label: "",
            price: 0,
          },
        ],
      })
    );
  };

  /**
   * ==========================================================
   * WEIGHT × VARIANT PRICE HELPERS
   * ==========================================================
   */

  const getMatrixPrice = (
    weightLabel: string,
    variantLabel: string
  ): number => {
    const item =
      form.weightVariantPrices.find(
        (entry) =>
          entry.weightLabel === weightLabel &&
          entry.variantLabel === variantLabel
      );

    return item?.price ?? 0;
  };

  const updateMatrixPrice = (
    weightLabel: string,
    variantLabel: string,
    value: string
  ) => {
    const normalized = value.trim();

    const parsed =
      normalized === ""
        ? 0
        : Number(normalized);

    const price =
      Number.isFinite(parsed)
        ? Math.max(0, parsed)
        : 0;

    setForm((previous) => {
      const existingIndex =
        previous.weightVariantPrices.findIndex(
          (entry) =>
            entry.weightLabel === weightLabel &&
            entry.variantLabel === variantLabel
        );

      const nextPrices = [
        ...previous.weightVariantPrices,
      ];

      if (existingIndex >= 0) {
        nextPrices[existingIndex] = {
          ...nextPrices[existingIndex],
          price,
        };
      } else {
        nextPrices.push({
          weightLabel,
          variantLabel,
          price,
        });
      }

      return {
        ...previous,
        weightVariantPrices:
          nextPrices,
      };
    });
  };

  const buildWeightVariantPricesPayload =
    (): ProductWeightVariantPriceValue[] => {
      return form.weightVariantPrices.filter(
        (entry) =>
          entry.weightLabel.trim() &&
          entry.variantLabel.trim()
      );
    };

  /**
   * ==========================================================
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
            Harga dasar digunakan sebagai fallback.
            Harga pilihan berat dan varian dapat
            menyesuaikan total harga produk.
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
              value={form.stock}
              onChange={(
                event
              ) =>
                setForm(
                  (
                    previous
                  ) => ({
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
              required
            />

            <p className="text-xs text-muted-foreground">
              Masukkan jumlah stok produk yang tersedia.
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
            Diskon akan dihitung setelah harga berat
            dan tambahan harga varian diterapkan.
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
      {/* VARIAN PRODUK */}
      {/* ====================================================== */}

      <Card className="space-y-5 p-4 sm:space-y-6 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              Varian Produk
            </h2>

            <p className="text-sm text-muted-foreground">
              Tambahkan varian dan biaya tambahan
              apabila diperlukan.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={
              addVariant
            }
          >
            <Plus className="mr-2 h-4 w-4" />

            Tambah Varian
          </Button>
        </div>

        <div className="space-y-3">
          {form.variantOptions
            .length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Belum ada varian.
              Klik Tambah Varian untuk menambahkan
              pilihan.
            </div>
          ) : (
            form.variantOptions.map(
              (
                variant,
                index
              ) => (
                <div
                  key={`variant-${index}`}
                  className="grid gap-3 md:grid-cols-[1fr_1fr_auto]"
                >
                  <div className="space-y-2">
                    <Label
                      htmlFor={`variant-label-${index}`}
                    >
                      Nama Varian
                    </Label>
{variant.id && (
  <input
    type="hidden"
    name="variantOptionIds"
    value={variant.id}
  />
)}
                    <Input
                      id={`variant-label-${index}`}
                      name="variantOptions"
                      value={
                        variant.label
                      }
                      placeholder="Contoh: Utuh"
                      onChange={(
                        event
                      ) =>
                        updateVariantLabel(
                          index,
                          event.target
                            .value
                        )
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor={`variant-price-${index}`}
                    >
                      Tambahan Harga
                    </Label>

                    <Input
                      id={`variant-price-${index}`}
                      name="variantOptionPrices"
                      type="number"
                      min="0"
                      step="1"
                      value={
                        variant.priceAdjustment
                      }
                      placeholder="Contoh: 5000"
                      onChange={(
                        event
                      ) =>
                        updateVariantPriceAdjustment(
                          index,
                          event.target
                            .value
                        )
                      }
                    />
                  </div>

                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        removeVariant(
                          index
                        )
                      }
                      aria-label={`Hapus varian ${
                        variant.label ||
                        index + 1
                      }`}
                      title="Hapus varian"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            )
          )}
        </div>
      </Card>

      {/* ====================================================== */}
      {/* PILIHAN BERAT DAN HARGA */}
      {/* ====================================================== */}

      <Card className="space-y-5 p-4 sm:space-y-6 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              Pilihan Berat & Harga
            </h2>

            <p className="text-sm text-muted-foreground">
              Setiap produk dapat memiliki harga
              berbeda untuk setiap pilihan berat.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={
              addWeight
            }
          >
            <Plus className="mr-2 h-4 w-4" />

            Tambah Berat
          </Button>
        </div>

        <div className="space-y-3">
          {form.weightOptions
            .length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Belum ada pilihan berat.
              Klik Tambah Berat untuk menambahkan
              pilihan.
            </div>
          ) : (
            form.weightOptions.map(
              (
                weight,
                index
              ) => (
                <div
                  key={`weight-${index}`}
                  className="grid gap-3 md:grid-cols-[1fr_1fr_auto]"
                >
                  <div className="space-y-2">
                    <Label
                      htmlFor={`weight-label-${index}`}
                    >
                      Berat
                    </Label>
{weight.id && (
  <input
    type="hidden"
    name="weightOptionIds"
    value={weight.id}
  />
)}
                    <Input
                      id={`weight-label-${index}`}
                      name="weightOptions"
                      value={
                        weight.label
                      }
                      placeholder="Contoh: 500gr"
                      onChange={(
                        event
                      ) =>
                        updateWeightLabel(
                          index,
                          event.target
                            .value
                        )
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor={`weight-price-${index}`}
                    >
                      Harga
                    </Label>

                    <Input
                      id={`weight-price-${index}`}
                      name="weightOptionPrices"
                      type="number"
                      min="0"
                      step="1"
                      value={
                        weight.price
                      }
                      placeholder="Contoh: 30000"
                      onChange={(
                        event
                      ) =>
                        updateWeightPrice(
                          index,
                          event.target
                            .value
                        )
                      }
                    />
                  </div>

                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        removeWeight(
                          index
                        )
                      }
                      aria-label={`Hapus pilihan berat ${
                        weight.label ||
                        index + 1
                      }`}
                      title="Hapus pilihan berat"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            )
          )}
        </div>
      </Card>

      {/* ====================================================== */}
      {/* HARGA BERAT × VARIAN */}
      {/* ====================================================== */}

      <Card className="space-y-5 p-4 sm:space-y-6 sm:p-6">
        <div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">
                Harga Berat × Varian
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Atur harga khusus untuk setiap kombinasi
                berat dan varian. Kosongkan kombinasi
                jika ingin menggunakan harga fallback.
              </p>
            </div>

            <div className="hidden rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium sm:block">
              {form.weightOptions.length} berat ×{" "}
              {form.variantOptions.length} varian
            </div>
          </div>
        </div>

        {form.weightOptions.length === 0 ||
        form.variantOptions.length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            Tambahkan minimal satu pilihan berat dan
            satu varian untuk mengatur harga kombinasi.
          </div>
        ) : (
          <>
            {/* Desktop / tablet matrix */}
            <div className="hidden overflow-x-auto rounded-xl border md:block">
              <table className="w-full min-w-[680px] border-collapse">
                <thead>
                  <tr className="bg-muted/40">
                    <th className="sticky left-0 z-10 min-w-[150px] border-b border-r bg-muted/40 px-4 py-3 text-left text-sm font-semibold">
                      Berat
                    </th>

                    {form.variantOptions.map(
                      (variant, variantIndex) => (
                        <th
                          key={`matrix-header-${variantIndex}`}
                          className="min-w-[210px] border-b px-4 py-3 text-left text-sm font-semibold"
                        >
                          <div className="truncate">
                            {variant.label ||
                              `Varian ${variantIndex + 1}`}
                          </div>

                          <div className="mt-0.5 text-xs font-normal text-muted-foreground">
                            Harga khusus
                          </div>
                        </th>
                      )
                    )}
                  </tr>
                </thead>

                <tbody>
                  {form.weightOptions.map(
                    (weight, weightIndex) => (
                      <tr
                        key={`matrix-row-${weightIndex}`}
                        className="transition-colors hover:bg-muted/20"
                      >
                        <td className="sticky left-0 z-10 border-r bg-background px-4 py-4 align-top">
                          <div className="font-medium">
                            {weight.label ||
                              `Berat ${weightIndex + 1}`}
                          </div>

                          <div className="mt-1 text-xs text-muted-foreground">
                            Fallback:{" "}
                            {formatRupiah(
                              weight.price
                            )}
                          </div>
                        </td>

                        {form.variantOptions.map(
                          (
                            variant,
                            variantIndex
                          ) => {
                            const matrixPrice =
                              getMatrixPrice(
                                weight.label,
                                variant.label
                              );

                            return (
                              <td
                                key={`matrix-cell-${weightIndex}-${variantIndex}`}
                                className="border-b px-4 py-4 align-top"
                              >
                                <div className="space-y-2">
                                  <Input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={
                                      matrixPrice || ""
                                    }
                                    placeholder={String(
                                      weight.price
                                    )}
                                    onChange={(
                                      event
                                    ) =>
                                      updateMatrixPrice(
                                        weight.label,
                                        variant.label,
                                        event.target
                                          .value
                                      )
                                    }
                                    aria-label={`Harga ${weight.label} ${variant.label}`}
                                  />

                                  <div className="text-xs text-muted-foreground">
                                    {matrixPrice > 0
                                      ? formatRupiah(
                                          matrixPrice
                                        )
                                      : "Fallback aktif"}
                                  </div>
                                </div>
                              </td>
                            );
                          }
                        )}
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile matrix */}
            <div className="space-y-4 md:hidden">
              {form.weightOptions.map(
                (weight, weightIndex) => (
                  <div
                    key={`mobile-matrix-${weightIndex}`}
                    className="rounded-xl border bg-background p-4 shadow-sm"
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold">
                          {weight.label ||
                            `Berat ${weightIndex + 1}`}
                        </div>

                        <div className="mt-1 text-xs text-muted-foreground">
                          Fallback:{" "}
                          {formatRupiah(
                            weight.price
                          )}
                        </div>
                      </div>

                      <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium">
                        {form.variantOptions.length} varian
                      </span>
                    </div>

                    <div className="space-y-3">
                      {form.variantOptions.map(
                        (
                          variant,
                          variantIndex
                        ) => {
                          const matrixPrice =
                            getMatrixPrice(
                              weight.label,
                              variant.label
                            );

                          return (
                            <div
                              key={`mobile-matrix-cell-${weightIndex}-${variantIndex}`}
                              className="rounded-lg border bg-muted/20 p-3"
                            >
                              <div className="mb-2 flex items-center justify-between gap-3">
                                <span className="text-sm font-medium">
                                  {variant.label ||
                                    `Varian ${
                                      variantIndex + 1
                                    }`}
                                </span>

                                <span className="text-[11px] text-muted-foreground">
                                  {matrixPrice > 0
                                    ? "Harga khusus"
                                    : "Fallback"}
                                </span>
                              </div>

                              <Input
                                type="number"
                                min="0"
                                step="1"
                                value={
                                  matrixPrice || ""
                                }
                                placeholder={String(
                                  weight.price
                                )}
                                onChange={(
                                  event
                                ) =>
                                  updateMatrixPrice(
                                    weight.label,
                                    variant.label,
                                    event.target
                                      .value
                                  )
                                }
                                aria-label={`Harga ${weight.label} ${variant.label}`}
                              />

                              <div className="mt-2 text-xs text-muted-foreground">
                                {matrixPrice > 0
                                  ? formatRupiah(
                                      matrixPrice
                                    )
                                  : `Fallback ${formatRupiah(
                                      weight.price
                                    )}`}
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                )
              )}
            </div>

            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="flex gap-3">
                <div className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />

                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>
                    <strong className="text-foreground">
                      Harga khusus
                    </strong>{" "}
                    akan digunakan jika nilainya diisi.
                  </p>

                  <p>
                    Jika kosong, sistem menggunakan
                    harga berat sebagai fallback dan
                    kemudian menerapkan penyesuaian
                    varian sesuai pricing engine.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        <input
          type="hidden"
          name="weightVariantPrices"
          value={JSON.stringify(
            buildWeightVariantPricesPayload()
          )}
          readOnly
        />
      </Card>

      {/* ====================================================== */}
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