import { ProductRepository } from "@/repositories/ProductRepository";
import { Prisma, ProductDiscountType } from "@prisma/client";

/**
 * ============================================================
 * PRODUCT FILTERS
 * ============================================================
 */
export interface ProductFilters {
  search?: string;
  categoryId?: string;
  categoryIds?: string[];
  discounted?: boolean;
  published?: boolean;
  featured?: boolean;
}

/**
 * ============================================================
 * NEW VARIANT / SKU INPUT
 * ============================================================
 *
 * Variant group is completely generic.
 *
 * Example:
 * [
 *   {
 *     name: "Kondisi",
 *     options: [{ label: "Utuh" }, { label: "Dibersihkan" }]
 *   },
 *   {
 *     name: "Berat",
 *     options: [{ label: "500 gr" }, { label: "1 Kg" }]
 *   }
 * ]
 *
 * SKU can reference existing DB option IDs (update) OR stable
 * "Group::Option" keys (create/update from a form before IDs exist).
 */
export interface ProductVariantOptionInput {
  id?: string;
  key?: string;
  label: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface ProductVariantGroupInput {
  id?: string;
  name: string;
  options: ProductVariantOptionInput[];
  sortOrder?: number;
}

export interface ProductSkuInput {
  id?: string;
  sku: string;
  price: number;
  stock: number;
  /**
   * Reference to a ProductVariantOption.
   *
   * It can be:
   * - an existing database option ID
   * - a temporary/client option key
   */
  optionRefs?: string[];
  isActive?: boolean;
}

export interface CreateProductInput {
  categoryId: string;
  name: string;
  slug: string;
  description?: string | null;
  sku?: string | null;

  /** Legacy fallback for products without variant groups. */
  price: number;
  stock: number;

  isDiscountActive?: boolean;
  discountType?: ProductDiscountType | null;
  discountValue?: number | null;
  discountStartAt?: Date | null;
  discountEndAt?: Date | null;

  isPublished?: boolean;
  featured?: boolean;

  /**
   * IMPORTANT:
   * undefined = do not configure variants
   * []        = explicitly no variants
   * [...]     = configure variant groups
   */
  variantGroups?: ProductVariantGroupInput[];

  /**
   * If omitted:
   * - no variants => one default SKU
   * - variants => Cartesian combinations with product price and stock=0
   *
   * If supplied, each SKU must select exactly one option from
   * every active group.
   */
  skus?: ProductSkuInput[];
}

export type UpdateProductInput = Partial<CreateProductInput>;

type Tx = Prisma.TransactionClient;

type CreatedOption = {
  id: string;
  groupId: string;
  label: string;
  key?: string;
  /**
   * Temporary/client reference used by the form before DB IDs exist.
   * Example: "group-xxx::option-yyy"
   */
  clientRef?: string;
};

type CreatedGroup = {
  id: string;
  name: string;
  options: CreatedOption[];
  clientRef?: string;
};

type ExistingVariantGroup = {
  id: string;
  name: string;
  isActive: boolean;
  options: Array<{
    id: string;
    groupId: string;
    label: string;
    isActive: boolean;
  }>;
};

function mapExistingVariantGroups(
  groups: ExistingVariantGroup[]
): CreatedGroup[] {
  return groups
    .filter((group) => group.isActive)
    .map((group) => ({
      id: group.id,
      name: group.name,
      options: group.options
        .filter((option) => option.isActive)
        .map((option) => ({
          id: option.id,
          groupId: option.groupId,
          label: option.label,
        })),
    }))
    .filter((group) => group.options.length > 0);
}

function cleanLabel(value: string, field: string): string {
  const label = value.trim();
  if (!label) throw new Error(`${field} tidak boleh kosong.`);
  return label;
}

function normalizeKey(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function optionKey(groupName: string, label: string): string {
  return `${normalizeKey(groupName)}::${normalizeKey(label)}`;
}

function skuKey(optionIds: string[]): string {
  return [...optionIds].sort().join("|");
}

function slugPart(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildGeneratedSku(
  productCode: string,
  labels: string[],
  index: number
): string {
  const base = slugPart(productCode) || "PRODUCT";
  const suffix = labels.map(slugPart).filter(Boolean).join("-");
  return `${base}-${suffix || `OPTION-${index + 1}`}`;
}

function validateVariantGroups(
  groups: ProductVariantGroupInput[]
): ProductVariantGroupInput[] {
  const seenGroups = new Set<string>();

  return groups.map((rawGroup, groupIndex) => {
    const name = cleanLabel(
      rawGroup.name,
      `Nama variant group #${groupIndex + 1}`
    );

    const groupKey = normalizeKey(name);
    if (seenGroups.has(groupKey)) {
      throw new Error(`Variant group "${name}" duplikat.`);
    }
    seenGroups.add(groupKey);

    if (!Array.isArray(rawGroup.options) || rawGroup.options.length === 0) {
      throw new Error(`Variant group "${name}" harus memiliki minimal 1 option.`);
    }

    const seenOptions = new Set<string>();

    const options = rawGroup.options.map((rawOption, optionIndex) => {
      const label = cleanLabel(
        rawOption.label,
        `Option ${optionIndex + 1} pada "${name}"`
      );

      const key = normalizeKey(label);
      if (seenOptions.has(key)) {
        throw new Error(
          `Option "${label}" duplikat pada variant group "${name}".`
        );
      }
      seenOptions.add(key);

      return {
        id: rawOption.id,
        key: rawOption.key,
        label,
        sortOrder: rawOption.sortOrder ?? optionIndex,
      };
    });

    return {
      id: rawGroup.id,
      name,
      options,
      sortOrder: rawGroup.sortOrder ?? groupIndex,
    };
  });
}

function cartesian<T>(lists: T[][]): T[][] {
  if (lists.length === 0) return [];

  return lists.reduce<T[][]>(
    (acc, current) =>
      acc.flatMap((prefix) =>
        current.map((item) => [...prefix, item])
      ),
    [[]]
  );
}

async function createGroupsAndOptions(
  tx: Tx,
  productId: string,
  groups: ProductVariantGroupInput[]
): Promise<CreatedGroup[]> {
  const result: CreatedGroup[] = [];

  for (let groupIndex = 0; groupIndex < groups.length; groupIndex++) {
    const groupInput = groups[groupIndex];

    const group = await tx.productVariantGroup.create({
      data: {
        productId,
        name: groupInput.name,
        sortOrder: groupInput.sortOrder ?? groupIndex,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
    });

    const options: CreatedOption[] = [];

    for (let optionIndex = 0; optionIndex < groupInput.options.length; optionIndex++) {
      const optionInput = groupInput.options[optionIndex];

      const option = await tx.productVariantOption.create({
        data: {
          groupId: group.id,
          label: optionInput.label,
          sortOrder: optionInput.sortOrder ?? optionIndex,
          isActive: true,
        },
        select: {
          id: true,
          groupId: true,
          label: true,
        },
      });

      options.push({
        ...option,
        key: optionInput.key,
        clientRef:
          groupInput.id && optionInput.id
            ? `${groupInput.id}::${optionInput.id}`
            : undefined,
      });
    }

    result.push({
      id: group.id,
      name: group.name,
      options,
      clientRef: groupInput.id,
    });
  }

  return result;
}

function buildOptionMaps(groups: CreatedGroup[]) {
  const byKey = new Map<string, CreatedOption>();
  const byId = new Map<string, CreatedOption>();
  const groupById = new Map<string, CreatedGroup>();

  for (const group of groups) {
    groupById.set(group.id, group);

    for (const option of group.options) {
      byKey.set(optionKey(group.name, option.label), option);

      if (option.key) {
        byKey.set(normalizeKey(option.key), option);
      }

      if (option.clientRef) {
        byKey.set(normalizeKey(option.clientRef), option);
      }

      byId.set(option.id, option);
    }
  }

  return { byKey, byId, groupById };
}

function resolveSkuOptionIds(
  input: ProductSkuInput,
  groups: CreatedGroup[],
  maps: ReturnType<typeof buildOptionMaps>
): string[] {
  const refs = input.optionRefs ?? [];

  if (refs.length === 0) {
    throw new Error(
      `SKU "${input.sku}" harus memiliki optionRefs.`
    );
  }

  const ids = refs.map((ref) => {
    const normalizedRef = normalizeKey(ref);

    // Existing DB ID
    const byId = maps.byId.get(ref);
    if (byId) return byId.id;

    // Client key or Group::Option key
    const byKey = maps.byKey.get(normalizedRef);
    if (byKey) return byKey.id;

    throw new Error(
      `Option reference "${ref}" pada SKU "${input.sku}" tidak ditemukan.`
    );
  });

  const uniqueIds = [...new Set(ids)];

  if (uniqueIds.length !== ids.length) {
    throw new Error(
      `SKU "${input.sku}" tidak boleh memilih option yang sama lebih dari satu kali.`
    );
  }

  if (uniqueIds.length !== groups.length) {
    throw new Error(
      `SKU "${input.sku}" harus memilih tepat 1 option dari setiap variant group.`
    );
  }

  const selected = uniqueIds.map((id) => maps.byId.get(id)!);
  const groupIds = new Set(
    selected.map((option) => option.groupId)
  );

  if (groupIds.size !== groups.length) {
    throw new Error(
      `SKU "${input.sku}" memiliki lebih dari satu option dari group yang sama atau tidak lengkap.`
    );
  }

  return uniqueIds;
}

function validateSkuNumbers(input: ProductSkuInput) {
  const sku = input.sku.trim();
  if (!sku) throw new Error("SKU tidak boleh kosong.");

  if (!Number.isFinite(input.price) || input.price < 0) {
    throw new Error(`Harga SKU "${sku}" tidak valid.`);
  }

  if (!Number.isInteger(input.stock) || input.stock < 0) {
    throw new Error(`Stok SKU "${sku}" harus bilangan bulat >= 0.`);
  }

  return sku;
}

export class ProductService {
  static async getProducts(filters: ProductFilters = {}) {
    return ProductRepository.findMany(filters);
  }

  static async getProductById(id: string) {
    return ProductRepository.findById(id);
  }

  static async getProductForAdmin(id: string) {
    return ProductRepository.findByIdForAdmin(id);
  }

  static async getProductBySlug(slug: string) {
    return ProductRepository.findBySlug(slug);
  }

    static async createProduct(input: CreateProductInput) {
    const slug = input.slug.trim();

    if (!slug) {
      throw new Error("Slug produk wajib diisi.");
    }

    if (await ProductRepository.existsBySlug(slug)) {
      throw new Error("Slug produk sudah digunakan.");
    }

    const parentSku = input.sku?.trim() || null;

    if (
      parentSku &&
      (await ProductRepository.existsByProductSku(parentSku))
    ) {
      throw new Error("SKU produk sudah digunakan.");
    }

    const hasVariantPayload =
      input.variantGroups !== undefined;

    const groups = hasVariantPayload
      ? validateVariantGroups(
          input.variantGroups ?? []
        )
      : [];

    if (
  input.skus &&
  input.skus.length > 0 &&
  groups.length === 0 &&
  input.skus.length !== 1
) {
  throw new Error(
    "Produk tanpa variant hanya boleh memiliki satu SKU."
  );
}

    /**
     * ==========================================================
     * CREATE PRODUCT + SKU + OPTIONS
     * ==========================================================
     *
     * SEMUA operasi CREATE dilakukan di dalam transaction.
     *
     * PENTING:
     *
     * Jangan memanggil:
     *
     * ProductRepository.findByIdForAdmin()
     *
     * dari dalam transaction karena method tersebut menggunakan
     * Prisma client biasa, bukan transaction client (tx).
     *
     * Transaction hanya mengembalikan product.id.
     * Setelah transaction COMMIT, product dibaca kembali
     * menggunakan ProductRepository biasa.
     *
     * ==========================================================
     */

    const createdProductId =
      await ProductRepository.transaction(
        async (tx) => {
          /**
           * ======================================================
           * CREATE PRODUCT
           * ======================================================
           */

          const product =
            await tx.product.create({
              data: {
                categoryId:
                  input.categoryId,

                name:
                  input.name.trim(),

                slug,

                description:
                  input.description?.trim() ||
                  null,

                sku:
                  parentSku,

                price:
                  input.price,

                /**
                 * Jika product mempunyai variant,
                 * stock Product = 0.
                 *
                 * Stock sebenarnya berada di ProductSku.
                 */
                stock:
                  groups.length > 0
                    ? 0
                    : input.stock,

                isDiscountActive:
                  input.isDiscountActive ??
                  false,

                discountType:
                  input.isDiscountActive
                    ? input.discountType ??
                      null
                    : null,

                discountValue:
                  input.isDiscountActive
                    ? input.discountValue ??
                      null
                    : null,

                discountStartAt:
                  input.isDiscountActive
                    ? input.discountStartAt ??
                      null
                    : null,

                discountEndAt:
                  input.isDiscountActive
                    ? input.discountEndAt ??
                      null
                    : null,

                isPublished:
                  input.isPublished ??
                  true,

                featured:
                  input.featured ??
                  false,
              },
            });

          /**
           * ======================================================
           * PRODUCT TANPA VARIANT
           * ======================================================
           */

          if (groups.length === 0) {
            const skuInput =
              input.skus?.[0];

            const sku =
              skuInput
                ? validateSkuNumbers(
                    skuInput
                  )
                : parentSku ||
                  buildGeneratedSku(
                    product.sku ||
                      product.slug,
                    [],
                    0
                  );

            /**
             * Pastikan SKU belum digunakan.
             */

            const skuExists =
              await tx.productSku.findUnique({
                where: {
                  sku,
                },

                select: {
                  id: true,
                },
              });

            if (skuExists) {
              throw new Error(
                `SKU "${sku}" sudah digunakan.`
              );
            }

            /**
             * CREATE PRODUCT SKU
             */

            await tx.productSku.create({
              data: {
                productId:
                  product.id,

                sku,

                price:
                  skuInput?.price ??
                  input.price,

                stock:
                  skuInput?.stock ??
                  input.stock,

                isActive:
                  skuInput?.isActive ??
                  true,
              },
            });

            /**
             * PENTING:
             *
             * Jangan:
             *
             * return ProductRepository.findByIdForAdmin(...)
             *
             * karena kita masih berada di transaction.
             *
             * Cukup return ID.
             */

            return product.id;
          }

          /**
           * ======================================================
           * CREATE VARIANT GROUPS + OPTIONS
           * ======================================================
           */

          const createdGroups =
            await createGroupsAndOptions(
              tx,
              product.id,
              groups
            );

          /**
           * ======================================================
           * BUILD OPTION MAP
           * ======================================================
           */

          const maps =
            buildOptionMaps(
              createdGroups
            );

          /**
           * ======================================================
           * BUILD COMBINATIONS
           * ======================================================
           */

          const combinations =
            cartesian(
              createdGroups.map(
                (group) =>
                  group.options
              )
            );

          /**
           * ======================================================
           * PREPARE SKU INPUT
           * ======================================================
           */

          const skuInputs:
            ProductSkuInput[] =
            input.skus &&
            input.skus.length > 0
              ? input.skus
              : combinations.map(
                  (
                    options,
                    index
                  ) => ({
                    sku:
                      buildGeneratedSku(
                        input.sku?.trim() ||
                          product.slug,

                        options.map(
                          (option) =>
                            option.label
                        ),

                        index
                      ),

                    price:
                      input.price,

                    stock:
                      0,

                    optionRefs:
                      options.map(
                        (option) =>
                          option.id
                      ),

                    isActive:
                      true,
                  })
                );

          /**
           * ======================================================
           * DUPLICATE DETECTION
           * ======================================================
           */

          const seenCombinationKeys =
            new Set<string>();

          const seenSkus =
            new Set<string>();

          /**
           * ======================================================
           * CREATE EACH SKU
           * ======================================================
           */

          for (
            const skuInput of skuInputs
          ) {
            const sku =
              validateSkuNumbers(
                skuInput
              );

            /**
             * Resolve option IDs
             */

            const optionIds =
              resolveSkuOptionIds(
                skuInput,
                createdGroups,
                maps
              );

            /**
             * Combination key
             */

            const combinationKey =
              skuKey(optionIds);

            if (
              seenCombinationKeys.has(
                combinationKey
              )
            ) {
              throw new Error(
                `Kombinasi option untuk SKU "${sku}" duplikat.`
              );
            }

            seenCombinationKeys.add(
              combinationKey
            );

            /**
             * SKU duplicate dalam request
             */

            const skuKeyNormalized =
              sku.toLowerCase();

            if (
              seenSkus.has(
                skuKeyNormalized
              )
            ) {
              throw new Error(
                `SKU "${sku}" duplikat dalam request.`
              );
            }

            seenSkus.add(
              skuKeyNormalized
            );

            /**
             * Cek SKU di database
             */

            const existingSku =
              await tx.productSku.findUnique(
                {
                  where: {
                    sku,
                  },

                  select: {
                    id: true,
                  },
                }
              );

            if (existingSku) {
              throw new Error(
                `SKU "${sku}" sudah digunakan.`
              );
            }

            /**
             * CREATE PRODUCT SKU
             */

            const createdSku =
              await tx.productSku.create(
                {
                  data: {
                    productId:
                      product.id,

                    sku,

                    price:
                      skuInput.price,

                    stock:
                      skuInput.stock,

                    isActive:
                      skuInput.isActive ??
                      true,
                  },

                  select: {
                    id: true,
                  },
                }
              );

            /**
             * ==================================================
             * CONNECT SKU ↔ VARIANT OPTIONS
             * ==================================================
             */

            await tx.productSkuOption.createMany(
              {
                data:
                  optionIds.map(
                    (
                      variantOptionId
                    ) => ({
                      skuId:
                        createdSku.id,

                      variantOptionId,
                    })
                  ),

                skipDuplicates:
                  true,
              }
            );
          }

          /**
           * ======================================================
           * TRANSACTION HANYA RETURN PRODUCT ID
           * ======================================================
           */

          return product.id;
        }
      );

    /**
     * ==========================================================
     * TRANSACTION SUDAH COMMIT
     * ==========================================================
     *
     * Sekarang aman menggunakan ProductRepository biasa.
     *
     * Ini adalah bagian yang memperbaiki bug sebelumnya.
     *
     * ==========================================================
     */

    const createdProduct =
      await ProductRepository.findByIdForAdmin(
        createdProductId
      );

    /**
     * ==========================================================
     * FINAL SAFETY CHECK
     * ==========================================================
     */

    if (!createdProduct) {
      throw new Error(
        "Produk berhasil disimpan tetapi gagal dibaca kembali setelah transaction."
      );
    }

    /**
     * ==========================================================
     * RETURN CREATED PRODUCT
     * ==========================================================
     */

    return createdProduct;
  }

    static async updateProduct(
    id: string,
    input: UpdateProductInput
  ) {
    /**
     * ==========================================================
     * GET EXISTING PRODUCT
     * ==========================================================
     */

    const existing =
      await ProductRepository.findByIdForAdmin(
        id
      );

    if (!existing) {
      throw new Error(
        "Produk tidak ditemukan."
      );
    }

    /**
     * ==========================================================
     * VALIDATE SLUG
     * ==========================================================
     */

    if (
      input.slug !== undefined &&
      input.slug.trim() !== existing.slug &&
      (await ProductRepository.existsBySlug(
        input.slug.trim()
      ))
    ) {
      throw new Error(
        "Slug produk sudah digunakan."
      );
    }

    /**
 * ==========================================================
 * VALIDATE PRODUCT SKU
 * ==========================================================
 *
 * input.sku dapat berupa:
 * - undefined -> tidak mengubah SKU parent
 * - null      -> mengosongkan SKU parent
 * - ""        -> mengosongkan SKU parent
 * - string    -> set SKU parent baru
 */

const normalizedSku =
  input.sku?.trim() || null;

if (
  normalizedSku !== null &&
  normalizedSku !== existing.sku &&
  (await ProductRepository.existsByProductSku(
    normalizedSku
  ))
) {
  throw new Error(
    "SKU produk sudah digunakan."
  );
}

    /**
     * ==========================================================
     * VARIANT PAYLOAD SEMANTICS
     * ==========================================================
     *
     * undefined
     * = jangan mengubah konfigurasi variant.
     *
     * []
     * = produk sengaja tidak memiliki variant.
     *
     * [...]
     * = konfigurasi variant dikirim dan harus disinkronkan.
     */

    const variantGroupsProvided =
      input.variantGroups !==
      undefined;

    const groups =
      variantGroupsProvided
        ? validateVariantGroups(
            input.variantGroups ?? []
          )
        : undefined;

        if (
  groups !== undefined
) {
  const groupNames =
    new Set<string>();

  for (
    const group of groups
  ) {
    const normalizedGroupName =
      group.name
        .trim()
        .toLowerCase();

    if (
      groupNames.has(
        normalizedGroupName
      )
    ) {
      throw new Error(
        `Variant group "${group.name}" duplikat.`
      );
    }

    groupNames.add(
      normalizedGroupName
    );

    const optionLabels =
      new Set<string>();

    for (
      const option of group.options
    ) {
      const normalizedOptionLabel =
        option.label
          .trim()
          .toLowerCase();

      if (
        optionLabels.has(
          normalizedOptionLabel
        )
      ) {
        throw new Error(
          `Option "${option.label}" duplikat pada variant "${group.name}".`
        );
      }

      optionLabels.add(
        normalizedOptionLabel
      );
    }
  }
}

    /**
     * ==========================================================
     * TRANSACTION
     * ==========================================================
     */

    return ProductRepository.transaction(
      async (tx) => {
        /**
         * ========================================================
         * UPDATE PRODUCT CORE
         * ========================================================
         */

        const product =
          await tx.product.update({
            where: {
              id,
            },

            data: {
              /**
               * --------------------------------------------------
               * BASIC PRODUCT DATA
               * --------------------------------------------------
               */

              ...(input.categoryId !==
                undefined && {
                categoryId:
                  input.categoryId,
              }),

              ...(input.name !==
                undefined && {
                name:
                  input.name.trim(),
              }),

              ...(input.slug !==
                undefined && {
                slug:
                  input.slug.trim(),
              }),

              ...(input.description !==
                undefined && {
                description:
                  input.description?.trim() ||
                  null,
              }),

              ...(input.sku !==
                undefined && {
                sku:
                  input.sku?.trim() ||
                  null,
              }),

              /**
               * --------------------------------------------------
               * BASE PRICE
               * --------------------------------------------------
               */

              ...(input.price !==
                undefined && {
                price:
                  input.price,
              }),

              /**
               * --------------------------------------------------
               * LEGACY PRODUCT STOCK
               * --------------------------------------------------
               *
               * Product.stock hanya boleh diubah langsung
               * jika konfigurasi variant tidak sedang dikirim.
               *
               * Untuk produk variant:
               *
               * ProductSku.stock
               *
               * adalah canonical stock.
               */

              ...(input.stock !==
                undefined &&
                groups === undefined && {
                  stock:
                    input.stock,
                }),

              /**
               * --------------------------------------------------
               * DISCOUNT
               * --------------------------------------------------
               */

              ...(input.isDiscountActive !==
                undefined && {
                isDiscountActive:
                  input.isDiscountActive,
              }),

              ...(input.discountType !==
                undefined && {
                discountType:
                  input.isDiscountActive ===
                  false
                    ? null
                    : input.discountType,
              }),

              ...(input.discountValue !==
                undefined && {
                discountValue:
                  input.isDiscountActive ===
                  false
                    ? null
                    : input.discountValue,
              }),

              ...(input.discountStartAt !==
                undefined && {
                discountStartAt:
                  input.isDiscountActive ===
                  false
                    ? null
                    : input.discountStartAt,
              }),

              ...(input.discountEndAt !==
                undefined && {
                discountEndAt:
                  input.isDiscountActive ===
                  false
                    ? null
                    : input.discountEndAt,
              }),

              /**
               * --------------------------------------------------
               * STATUS
               * --------------------------------------------------
               */

              ...(input.isPublished !==
                undefined && {
                isPublished:
                  input.isPublished,
              }),

              ...(input.featured !==
                undefined && {
                featured:
                  input.featured,
              }),
            },
          });

        /**
         * ========================================================
         * CASE 1
         * ========================================================
         *
         * variantGroups === undefined
         *
         * Artinya caller hanya ingin mengubah data product
         * biasa atau SKU tanpa mengubah struktur variant group.
         *
         * Contoh:
         *
         * - ubah nama
         * - ubah harga
         * - ubah stock produk non-variant
         * - ubah discount
         * - update SKU existing
         *
         * Struktur variant lama harus dipertahankan.
         */

        if (
          !variantGroupsProvided
        ) {
          if (
            input.skus !==
            undefined
          ) {
            await this.syncSkus(
              tx,
              id,
              input.skus,
              mapExistingVariantGroups(
                existing.variantGroups
              )
            );
          }

          /**
 * ============================================================
 * SYNC PRODUCT STOCK FROM SKU STOCK
 * ============================================================
 *
 * Untuk product dengan variant, Product.stock adalah
 * agregasi seluruh stock SKU aktif.
 *
 * Contoh:
 *
 * SKU A = 20
 * SKU B = 15
 * SKU C = 10
 *
 * Product.stock = 45
 */

const stockAggregate =
  await tx.productSku.aggregate({
    where: {
      productId:
        product.id,

      isActive:
        true,
    },

    _sum: {
      stock:
        true,
    },
  });

const totalSkuStock =
  stockAggregate._sum.stock ??
  0;

await tx.product.update({
  where: {
    id:
      product.id,
  },

  data: {
    stock:
      totalSkuStock,
  },
});

          return ProductRepository.findByIdForAdmin(
            product.id
          );
        }

        /**
         * ========================================================
         * CASE 2
         * ========================================================
         *
         * Explicit []
         *
         * Artinya product sengaja diubah menjadi
         * product tanpa variant.
         *
         * Variant lama TIDAK dihapus secara fisik.
         * Hanya dinonaktifkan agar histori OrderItem,
         * StockLedger, Cart, FlashSale, dll tetap aman.
         */

        if (
          groups!.length ===
          0
        ) {
          /**
           * ------------------------------------------------------
           * DEACTIVATE VARIANT GROUP
           * ------------------------------------------------------
           */

          await tx.productVariantGroup.updateMany({
            where: {
              productId:
                id,
            },

            data: {
              isActive:
                false,
            },
          });

          /**
           * ------------------------------------------------------
           * DEACTIVATE VARIANT OPTION
           * ------------------------------------------------------
           */

          await tx.productVariantOption.updateMany({
            where: {
              group: {
                productId:
                  id,
              },
            },

            data: {
              isActive:
                false,
            },
          });

          /**
           * ------------------------------------------------------
           * DEACTIVATE SKU
           * ------------------------------------------------------
           */

          await tx.productSku.updateMany({
            where: {
              productId:
                id,
            },

            data: {
              isActive:
                false,
            },
          });

          /**
           * ------------------------------------------------------
           * DEFAULT SKU
           * ------------------------------------------------------
           *
           * Prioritas:
           *
           * 1. SKU dari request
           * 2. Product.sku dari request
           * 3. Product.sku existing
           * 4. Generated SKU
           */

          const defaultSkuInput =
            input.skus?.[0];

          const defaultSku =
            defaultSkuInput
              ? validateSkuNumbers(
                  defaultSkuInput
                )
              : input.sku?.trim() ||
                existing.sku ||
                buildGeneratedSku(
                  product.slug,
                  [],
                  0
                );

          /**
           * ------------------------------------------------------
           * DEFAULT PRICE
           * ------------------------------------------------------
           */

          const defaultPrice =
            defaultSkuInput?.price ??
            input.price ??
            Number(
              product.price
            );

          /**
           * ------------------------------------------------------
           * DEFAULT STOCK
           * ------------------------------------------------------
           */

          const defaultStock =
            defaultSkuInput?.stock ??
            input.stock ??
            0;

          /**
           * ------------------------------------------------------
           * FIND EXISTING DEFAULT SKU
           * ------------------------------------------------------
           */

          const existingDefaultSku =
            await tx.productSku.findFirst({
              where: {
                productId:
                  id,

                sku:
                  defaultSku,
              },

              select: {
                id: true,
              },
            });

          /**
           * ------------------------------------------------------
           * UPDATE EXISTING DEFAULT SKU
           * ------------------------------------------------------
           */

          if (
            existingDefaultSku
          ) {
            await tx.productSku.update({
              where: {
                id:
                  existingDefaultSku.id,
              },

              data: {
                price:
                  defaultPrice,

                stock:
                  defaultStock,

                isActive:
                  true,
              },
            });
          } else {
            /**
             * ----------------------------------------------------
             * CHECK SKU CONFLICT WITH OTHER PRODUCT
             * ----------------------------------------------------
             */

            const conflictingSku =
              await tx.productSku.findUnique({
                where: {
                  sku:
                    defaultSku,
                },

                select: {
                  id: true,

                  productId:
                    true,
                },
              });

            if (
              conflictingSku &&
              conflictingSku.productId !==
                id
            ) {
              throw new Error(
                `SKU "${defaultSku}" sudah digunakan produk lain.`
              );
            }

            /**
             * ----------------------------------------------------
             * CREATE DEFAULT SKU
             * ----------------------------------------------------
             */

            await tx.productSku.create({
              data: {
                productId:
                  id,

                sku:
                  defaultSku,

                price:
                  defaultPrice,

                stock:
                  defaultStock,

                isActive:
                  true,
              },
            });
          }

          /**
 * ------------------------------------------------------
 * SYNC PRODUCT STOCK FROM DEFAULT SKU
 * ------------------------------------------------------
 *
 * Produk tanpa variant tetap menggunakan ProductSku
 * sebagai canonical stock.
 *
 * Product.stock hanya menjadi mirror/display value.
 */

const defaultSkuRecord =
  await tx.productSku.findFirst({
    where: {
      productId:
        id,

      sku:
        defaultSku,

      isActive:
        true,
    },

    select: {
      stock:
        true,
    },
  });

if (!defaultSkuRecord) {
  throw new Error(
    "Default SKU berhasil diproses tetapi gagal ditemukan saat sinkronisasi stock produk."
  );
}

await tx.product.update({
  where: {
    id,
  },

  data: {
    stock:
      defaultSkuRecord.stock,
  },
});

          return ProductRepository.findByIdForAdmin(
            product.id
          );
        }

        /**
         * ========================================================
         * CASE 3
         * ========================================================
         *
         * Variant groups dikirim.
         *
         * Kita melakukan UPSERT terhadap:
         *
         * ProductVariantGroup
         * ProductVariantOption
         *
         * Existing ID akan dipertahankan.
         * Data baru akan dibuat.
         * Data yang sudah tidak dikirim akan dinonaktifkan.
         */

        const activeGroupIds =
          new Set<string>();

        const activeOptionIds =
          new Set<string>();

        const optionMaps =
          new Map<
            string,
            string
          >();

        const groupRecords:
          CreatedGroup[] = [];

        /**
         * ========================================================
         * UPSERT VARIANT GROUPS
         * ========================================================
         */

        for (
          let groupIndex = 0;
          groupIndex <
          groups!.length;
          groupIndex++
        ) {
          const groupInput =
            groups![
              groupIndex
            ];

          let groupId =
            groupInput.id;

          /**
           * ------------------------------------------------------
           * EXISTING GROUP
           * ------------------------------------------------------
           */

          if (groupId) {
            const ownedGroup =
              await tx.productVariantGroup.findFirst({
                where: {
                  id:
                    groupId,

                  productId:
                    id,
                },

                select: {
                  id: true,
                },
              });

            if (
              !ownedGroup
            ) {
              throw new Error(
                `Variant group "${groupInput.name}" memiliki ID yang tidak valid.`
              );
            }

            await tx.productVariantGroup.update({
              where: {
                id:
                  groupId,
              },

              data: {
                name:
                  groupInput.name,

                sortOrder:
                  groupInput.sortOrder ??
                  groupIndex,

                isActive:
                  true,
              },
            });
          } else {
  /**
   * ----------------------------------------------------
   * FIND EXISTING GROUP BY PRODUCT + NAME
   * ----------------------------------------------------
   *
   * Frontend seharusnya mengirim ID untuk group lama.
   *
   * Tetapi jika ID tidak ikut terkirim, jangan langsung
   * melakukan CREATE karena database memiliki unique
   * constraint:
   *
   * @@unique([productId, name])
   *
   * Cari terlebih dahulu group existing berdasarkan:
   *
   * productId + name
   *
   * Jika ditemukan:
   * - gunakan ID existing
   * - aktifkan kembali
   * - update sortOrder
   *
   * Jika tidak ditemukan:
   * - create group baru
   */

  const existingGroup =
    await tx.productVariantGroup.findFirst({
      where: {
        productId:
          id,

        name:
          groupInput.name,
      },

      select: {
        id: true,
      },
    });

  if (existingGroup) {
    /**
     * ------------------------------------------------------
     * REUSE EXISTING GROUP
     * ------------------------------------------------------
     */

    groupId =
      existingGroup.id;

    await tx.productVariantGroup.update({
      where: {
        id:
          groupId,
      },

      data: {
        name:
          groupInput.name,

        sortOrder:
          groupInput.sortOrder ??
          groupIndex,

        isActive:
          true,
      },
    });
  } else {
    /**
     * ------------------------------------------------------
     * CREATE BRAND NEW GROUP
     * ------------------------------------------------------
     */

    const created =
      await tx.productVariantGroup.create({
        data: {
          productId:
            id,

          name:
            groupInput.name,

          sortOrder:
            groupInput.sortOrder ??
            groupIndex,

          isActive:
            true,
        },

        select: {
          id: true,
        },
      });

    groupId =
      created.id;
  }
}

          activeGroupIds.add(
            groupId
          );

          const optionRecords:
            CreatedOption[] = [];

          /**
           * ======================================================
           * UPSERT OPTIONS
           * ======================================================
           */

          for (
            let optionIndex = 0;
            optionIndex <
            groupInput.options.length;
            optionIndex++
          ) {
            const optionInput =
              groupInput.options[
                optionIndex
              ];

            let optionId =
              optionInput.id;

            /**
             * ----------------------------------------------------
             * EXISTING OPTION
             * ----------------------------------------------------
             */

            if (optionId) {
              const ownedOption =
                await tx.productVariantOption.findFirst({
                  where: {
                    id:
                      optionId,

                    groupId:
                      groupId,
                  },

                  select: {
                    id: true,
                  },
                });

              if (
                !ownedOption
              ) {
                throw new Error(
                  `Option "${optionInput.label}" memiliki ID yang tidak valid.`
                );
              }

              await tx.productVariantOption.update({
                where: {
                  id:
                    optionId,
                },

                data: {
                  label:
                    optionInput.label,

                  sortOrder:
                    optionInput.sortOrder ??
                    optionIndex,

                  isActive:
                    true,
                },
              });
           } else {
  /**
   * --------------------------------------------------
   * FIND EXISTING OPTION BY GROUP + LABEL
   * --------------------------------------------------
   *
   * Sama seperti VariantGroup:
   *
   * jika frontend tidak mengirim option.id,
   * jangan langsung CREATE.
   *
   * Cari terlebih dahulu berdasarkan:
   *
   * groupId + label
   */

  const existingOption =
    await tx.productVariantOption.findFirst({
      where: {
        groupId:
          groupId,

        label:
          optionInput.label,
      },

      select: {
        id: true,
      },
    });

  if (existingOption) {
    /**
     * ------------------------------------------------
     * REUSE EXISTING OPTION
     * ------------------------------------------------
     */

    optionId =
      existingOption.id;

    await tx.productVariantOption.update({
      where: {
        id:
          optionId,
      },

      data: {
        label:
          optionInput.label,

        sortOrder:
          optionInput.sortOrder ??
          optionIndex,

        isActive:
          true,
      },
    });
  } else {
    /**
     * ------------------------------------------------
     * CREATE BRAND NEW OPTION
     * ------------------------------------------------
     */

    const created =
      await tx.productVariantOption.create({
        data: {
          groupId:
            groupId,

          label:
            optionInput.label,

          sortOrder:
            optionInput.sortOrder ??
            optionIndex,

          isActive:
            true,
        },

        select: {
          id: true,
        },
      });

    optionId =
      created.id;
  }
}

            activeOptionIds.add(
              optionId
            );

            const optionRecord =
              {
                id:
                  optionId,

                groupId:
                  groupId,

                label:
                  optionInput.label,

                key:
                  optionInput.key,
              };

            optionRecords.push(
              optionRecord
            );

            optionMaps.set(
              optionKey(
                groupInput.name,
                optionInput.label
              ),
              optionId
            );
          }

          groupRecords.push({
            id:
              groupId,

            name:
              groupInput.name,

            options:
              optionRecords,
          });
        }

        /**
         * ========================================================
         * ARCHIVE REMOVED OPTIONS
         * ========================================================
         */

        await tx.productVariantOption.updateMany({
          where: {
            group: {
              productId:
                id,
            },

            id: {
              notIn:
                [
                  ...activeOptionIds,
                ],
            },
          },

          data: {
            isActive:
              false,
          },
        });

        /**
         * ========================================================
         * ARCHIVE REMOVED GROUPS
         * ========================================================
         */

        await tx.productVariantGroup.updateMany({
          where: {
            productId:
              id,

            id: {
              notIn:
                [
                  ...activeGroupIds,
                ],
            },
          },

          data: {
            isActive:
              false,
          },
        });

        /**
         * ========================================================
         * BUILD OPTION MAPS
         * ========================================================
         */

        const maps =
          buildOptionMaps(
            groupRecords
          );

        /**
         * ========================================================
         * PREPARE SKU INPUT
         * ========================================================
         *
         * Jika SKU dikirim dari form:
         * gunakan SKU tersebut.
         *
         * Jika tidak:
         * generate SKU berdasarkan Cartesian combination.
         */

        const skuInputs:
          ProductSkuInput[] =
          input.skus &&
          input.skus.length > 0
            ? input.skus
            : cartesian(
                groupRecords.map(
                  (
                    group
                  ) =>
                    group.options
                )
              ).map(
                (
                  options,
                  index
                ): ProductSkuInput => ({
                  sku:
                    buildGeneratedSku(
                      input.sku?.trim() ||
                        existing.sku ||
                        product.slug,

                      options.map(
                        (
                          option
                        ) =>
                          option.label
                      ),

                      index
                    ),

                  price:
                    input.price ??
                    Number(
                      product.price
                    ),

                  stock:
                    0,

                  optionRefs:
                    options.map(
                      (
                        option
                      ) =>
                        option.id
                    ),

                  isActive:
                    true,
                })
              );

        /**
         * ========================================================
         * SYNC SKU
         * ========================================================
         */

        await this.syncSkus(
          tx,
          id,
          skuInputs,
          groupRecords,
          maps
        );

        /**
 * ============================================================
 * SYNC PRODUCT STOCK FROM ACTIVE SKU STOCK
 * ============================================================
 *
 * Product dengan variant tidak menggunakan input.stock
 * sebagai sumber stock.
 *
 * Product.stock selalu mengikuti total stock seluruh SKU aktif.
 *
 * Contoh:
 *
 * SKU 1 = 20
 * SKU 2 = 10
 * SKU 3 = 15
 *
 * Product.stock = 45
 */

const stockAggregate =
  await tx.productSku.aggregate({
    where: {
      productId:
        id,

      isActive:
        true,
    },

    _sum: {
      stock:
        true,
    },
  });

const totalSkuStock =
  stockAggregate._sum.stock ??
  0;

await tx.product.update({
  where: {
    id,
  },

  data: {
    stock:
      totalSkuStock,
  },
});

        /**
         * ========================================================
         * RETURN UPDATED PRODUCT
         * ========================================================
         */

        return ProductRepository.findByIdForAdmin(
          product.id
        );
      }
    );
  }

  private static async syncSkus(
  tx: Tx,
  productId: string,
  skuInputs: ProductSkuInput[],
  groups: CreatedGroup[],
  maps?: ReturnType<typeof buildOptionMaps>
) {
  const optionMaps =
    maps || buildOptionMaps(groups);

  const seenCombinationKeys =
    new Set<string>();

  const seenSkuValues =
    new Set<string>();

  const activeSkuIds =
    new Set<string>();

/**
 * ============================================================
 * UPDATE SKU STOCK + LEDGER
 * ============================================================
 *
 * rawInput.stock adalah TARGET STOCK.
 *
 * Admin mengubah stock secara manual, sehingga perubahan
 * dicatat sebagai ADJUSTMENT.
 *
 * Contoh:
 *
 *   DB stock = 10
 *   input     = 20
 *
 *   10 -> 20
 *   +10 ADJUSTMENT
 *
 * Sedangkan:
 *
 *   DB stock = 20
 *   input     = 10
 *
 *   20 -> 10
 *   -10 ADJUSTMENT
 *
 * Tidak membuat ledger jika stock tidak berubah.
 *
 * IMPORTANT:
 *
 * SKU di-lock dengan SELECT ... FOR UPDATE sebelum membaca
 * stock aktual.
 *
 * Dengan demikian perubahan stock melalui admin akan
 * diserialisasikan dengan transaksi lain yang juga mengunci
 * row SKU tersebut.
 */
const updateSkuStockWithLedger =
  async (
    skuId: string,
    targetStock: number
  ) => {
    /**
     * ----------------------------------------------------------
     * VALIDATE TARGET STOCK
     * ----------------------------------------------------------
     */

    if (
      !Number.isInteger(
        targetStock
      ) ||
      targetStock < 0
    ) {
      throw new Error(
        "Stock SKU harus berupa angka bulat lebih dari atau sama dengan 0."
      );
    }

    /**
     * ----------------------------------------------------------
     * LOCK SKU ROW
     * ----------------------------------------------------------
     *
     * Jangan membaca stock melalui findFirst biasa.
     *
     * Gunakan FOR UPDATE agar row ProductSku dikunci
     * sampai transaction selesai.
     *
     * Transaction lain yang mencoba melakukan operasi
     * yang membutuhkan lock pada row yang sama akan
     * menunggu transaction ini selesai.
     */
    const lockedSku =
      await tx.$queryRaw<
        Array<{
          id: string;
          sku: string;
          productId: string;
          stock: number;
          isActive: boolean;
        }>
      >`
        SELECT
          "id",
          "sku",
          "productId",
          "stock",
          "isActive"
        FROM "ProductSku"
        WHERE
          "id" = ${skuId}
          AND "productId" = ${productId}
        FOR UPDATE
      `;

    /**
     * ----------------------------------------------------------
     * SKU NOT FOUND
     * ----------------------------------------------------------
     */

    if (
      lockedSku.length ===
      0
    ) {
      throw new Error(
        "SKU tidak ditemukan saat memperbarui stock."
      );
    }

    const currentSku =
      lockedSku[0];

    /**
     * ----------------------------------------------------------
     * SKU INACTIVE
     * ----------------------------------------------------------
     *
     * syncSkus() hanya seharusnya memproses SKU yang
     * menjadi bagian dari request aktif.
     *
     * Jangan mengubah stock SKU yang sudah tidak aktif.
     */
    if (
      !currentSku.isActive
    ) {
      throw new Error(
        `SKU "${currentSku.sku}" tidak aktif sehingga stock tidak dapat diperbarui.`
      );
    }

    /**
     * ----------------------------------------------------------
     * STOCK TIDAK BERUBAH
     * ----------------------------------------------------------
     *
     * Tidak perlu UPDATE dan tidak perlu membuat ledger.
     */

    if (
      currentSku.stock ===
      targetStock
    ) {
      return currentSku;
    }

    /**
     * ----------------------------------------------------------
     * CALCULATE STOCK DIFFERENCE
     * ----------------------------------------------------------
     */

    const stockBefore =
      currentSku.stock;

    const stockDifference =
      targetStock -
      stockBefore;

    /**
     * ----------------------------------------------------------
     * ADMIN STOCK CHANGE
     * ----------------------------------------------------------
     *
     * Semua perubahan manual melalui edit product
     * dicatat sebagai ADJUSTMENT.
     *
     * RESTOCK reserved untuk proses penerimaan/restock
     * inventory yang memang secara bisnis berarti barang
     * masuk.
     */
    const ledgerType =
      "ADJUSTMENT";

    /**
     * ----------------------------------------------------------
     * UPDATE STOCK
     * ----------------------------------------------------------
     *
     * Row sudah di-lock dengan FOR UPDATE.
     *
     * Tetap gunakan conditional WHERE stock = stockBefore
     * sebagai defensive check tambahan.
     */
    const updatedSku =
      await tx.productSku.updateMany({
        where: {
          id:
            currentSku.id,

          productId:
            currentSku.productId,

          stock:
            stockBefore,
        },

        data: {
          stock:
            targetStock,
        },
      });

    if (
      updatedSku.count !==
      1
    ) {
      throw new Error(
        `Stock SKU "${currentSku.sku}" berubah sebelum stock diperbarui. Silakan muat ulang halaman dan coba lagi.`
      );
    }

    /**
     * ----------------------------------------------------------
     * CREATE STOCK LEDGER
     * ----------------------------------------------------------
     */

    await tx.stockLedger.create({
      data: {
        productId:
          currentSku.productId,

        skuId:
          currentSku.id,

        type:
          ledgerType,

        quantity:
          stockDifference,

        stockBefore,

        stockAfter:
          targetStock,

        note:
          `Penyesuaian stock SKU ${currentSku.sku} melalui update produk.`,
      },
    });

    /**
     * ----------------------------------------------------------
     * RETURN UPDATED SNAPSHOT
     * ----------------------------------------------------------
     */

    return {
      ...currentSku,

      stock:
        targetStock,
    };
  };

  /**
   * ============================================================
   * PROCESS SKU INPUTS
   * ============================================================
   */

  for (
    const rawInput of skuInputs
  ) {
    /**
     * ----------------------------------------------------------
     * VALIDATE SKU
     * ----------------------------------------------------------
     */

    const sku =
      validateSkuNumbers(
        rawInput
      );

    /**
     * ----------------------------------------------------------
     * VALIDATE STOCK
     * ----------------------------------------------------------
     */

    if (
      !Number.isInteger(
        rawInput.stock
      ) ||
      rawInput.stock < 0
    ) {
      throw new Error(
        `Stock SKU "${sku}" harus berupa angka bulat lebih dari atau sama dengan 0.`
      );
    }

    /**
     * ----------------------------------------------------------
     * RESOLVE OPTION IDS
     * ----------------------------------------------------------
     */

    const optionIds =
      resolveSkuOptionIds(
        rawInput,
        groups,
        optionMaps
      );

    /**
     * ----------------------------------------------------------
     * DUPLICATE COMBINATION CHECK
     * ----------------------------------------------------------
     */

    const combinationKey =
      skuKey(optionIds);

    if (
      seenCombinationKeys.has(
        combinationKey
      )
    ) {
      throw new Error(
        `Kombinasi option untuk SKU "${sku}" duplikat.`
      );
    }

    seenCombinationKeys.add(
      combinationKey
    );

    /**
     * ----------------------------------------------------------
     * DUPLICATE SKU CHECK
     * ----------------------------------------------------------
     */

    const skuNormalized =
      sku.toLowerCase();

    if (
      seenSkuValues.has(
        skuNormalized
      )
    ) {
      throw new Error(
        `SKU "${sku}" duplikat dalam request.`
      );
    }

    seenSkuValues.add(
      skuNormalized
    );

    let skuId =
      rawInput.id;

    /**
     * ==========================================================
     * EXISTING SKU BY ID
     * ==========================================================
     */

    if (skuId) {
      const owned =
        await tx.productSku.findFirst({
          where: {
            id:
              skuId,

            productId:
              productId,
          },

          select: {
            id: true,

            stock: true,

            isActive: true,
          },
        });

      if (!owned) {
        throw new Error(
          `SKU "${sku}" memiliki ID yang tidak valid untuk produk ini.`
        );
      }

      /**
       * --------------------------------------------------------
       * SKU CONFLICT
       * --------------------------------------------------------
       */

      const conflicting =
        await tx.productSku.findFirst({
          where: {
            sku,

            NOT: {
              id:
                skuId,
            },
          },

          select: {
            id: true,
          },
        });

      if (conflicting) {
        throw new Error(
          `SKU "${sku}" sudah digunakan.`
        );
      }

      /**
       * --------------------------------------------------------
       * UPDATE STOCK
       * --------------------------------------------------------
       */

      await updateSkuStockWithLedger(
        skuId,
        rawInput.stock
      );

      /**
       * --------------------------------------------------------
       * UPDATE SKU CORE
       * --------------------------------------------------------
       */

      await tx.productSku.update({
        where: {
          id:
            skuId,
        },

        data: {
          sku,

          price:
            rawInput.price,

          isActive:
            rawInput.isActive ??
            true,
        },
      });
    }

    /**
 * ==========================================================
 * FIND EXISTING SKU BY COMBINATION
 * ==========================================================
 *
 * Canonical SKU identity:
 *
 *   productId + exact set of variantOptionId
 *
 * Kombinasi harus benar-benar sama.
 *
 * Contoh:
 *
 * Existing:
 *   [A, B]
 *
 * Request:
 *   [A, B]
 *
 * => SKU yang sama
 *
 * Existing:
 *   [A, B, C]
 *
 * Request:
 *   [A, B]
 *
 * => BUKAN SKU yang sama
 *
 * Existing:
 *   [A, B]
 *
 * Request:
 *   [A, C]
 *
 * => BUKAN SKU yang sama
 *
 * Kita tidak menggunakan `every` Prisma sebagai
 * penentu identity karena `every` tidak menjamin
 * jumlah option sama.
 *
 * Exact comparison dilakukan di application layer.
 */

const existingSkuCandidates =
  await tx.productSku.findMany({
    where: {
      productId,

      isActive:
        true,
    },

    select: {
      id: true,

      stock: true,

      skuOptions: {
        select: {
          variantOptionId:
            true,
        },
      },
    },
  });

/**
 * ----------------------------------------------------------
 * NORMALIZE REQUESTED OPTION IDS
 * ----------------------------------------------------------
 *
 * Sort agar:
 *
 * [A, B]
 *
 * dan
 *
 * [B, A]
 *
 * dianggap kombinasi yang sama.
 */

const requestedOptionIds =
  [...optionIds].sort();

/**
 * ----------------------------------------------------------
 * FIND EXACT COMBINATION
 * ----------------------------------------------------------
 */

const existingByCombination =
  existingSkuCandidates.find(
    (candidate) => {
      const existingOptionIds =
        candidate.skuOptions
          .map(
            (option) =>
              option.variantOptionId
          )
          .sort();

      /**
       * Jumlah option harus sama.
       *
       * Ini mencegah:
       *
       * [A, B, C]
       *
       * dianggap sama dengan:
       *
       * [A, B]
       */

      if (
        existingOptionIds.length !==
        requestedOptionIds.length
      ) {
        return false;
      }

      /**
       * Setiap option ID harus
       * sama pada posisi yang sama
       * setelah di-sort.
       */

      return existingOptionIds.every(
        (
          optionId,
          index
        ) =>
          optionId ===
          requestedOptionIds[index]
      );
    }
  );

if (
  existingByCombination
) {
  /**
   * ========================================================
   * EXISTING SKU FOUND
   * ========================================================
   */

  skuId =
    existingByCombination.id;

  /**
   * --------------------------------------------------------
   * SKU CONFLICT
   * --------------------------------------------------------
   *
   * SKU value harus tetap unique
   * secara global.
   *
   * Jika SKU yang diminta sudah digunakan
   * SKU lain, jangan overwrite SKU tersebut.
   */

  const conflicting =
    await tx.productSku.findFirst({
      where: {
        sku,

        NOT: {
          id:
            skuId,
        },
      },

      select: {
        id: true,
      },
    });

  if (conflicting) {
    throw new Error(
      `SKU "${sku}" sudah digunakan.`
    );
  }

 /**
 * --------------------------------------------------------
 * CREATE STOCK LEDGER
 * --------------------------------------------------------
 *
 * Perubahan stock melalui halaman edit produk
 * selalu dianggap sebagai ADJUSTMENT.
 *
 * RESTOCK tidak digunakan di sini.
 *
 * RESTOCK sebaiknya digunakan oleh proses penerimaan
 * stock/restock khusus.
 */

  await updateSkuStockWithLedger(
    skuId,
    rawInput.stock
  );

  /**
   * --------------------------------------------------------
   * UPDATE SKU CORE
   * --------------------------------------------------------
   *
   * Stock sengaja TIDAK di-update di sini.
   *
   * Stock sudah ditangani oleh:
   *
   *   updateSkuStockWithLedger()
   */

  await tx.productSku.update({
    where: {
      id:
        skuId,
    },

    data: {
      sku,

      price:
        rawInput.price,

      isActive:
        rawInput.isActive ??
        true,
    },
  });
}

/**
 * ==========================================================
 * CREATE NEW SKU
 * ==========================================================
 */

else {
  /**
   * --------------------------------------------------------
   * CHECK SKU CONFLICT
   * --------------------------------------------------------
   *
   * SKU bersifat globally unique.
   */

  const conflicting =
    await tx.productSku.findUnique({
      where: {
        sku,
      },

      select: {
        id: true,
      },
    });

  if (conflicting) {
    throw new Error(
      `SKU "${sku}" sudah digunakan.`
    );
  }

  /**
   * --------------------------------------------------------
   * CREATE SKU
   * --------------------------------------------------------
   *
   * SKU baru tidak membuat StockLedger RESTOCK.
   *
   * Alasannya:
   *
   * stock pada SKU baru adalah initial state,
   * bukan perubahan terhadap stock sebelumnya.
   */

  const created =
    await tx.productSku.create({
      data: {
        productId,

        sku,

        price:
          rawInput.price,

        stock:
          rawInput.stock,

        isActive:
          rawInput.isActive ??
          true,
      },

      select: {
        id: true,
      },
    });

  skuId =
    created.id;
}

    /**
     * ==========================================================
     * MARK SKU ACTIVE IN REQUEST
     * ==========================================================
     */

    activeSkuIds.add(
      skuId
    );

    /**
     * ==========================================================
     * REPLACE SKU OPTIONS
     * ==========================================================
     */

    await tx.productSkuOption.deleteMany({
      where: {
        skuId,
      },
    });

    await tx.productSkuOption.createMany({
      data:
        optionIds.map(
          (
            variantOptionId
          ) => ({
            skuId,

            variantOptionId,
          })
        ),

      skipDuplicates:
        true,
    });
  }

  /**
   * ============================================================
   * ARCHIVE REMOVED SKU COMBINATIONS
   * ============================================================
   *
   * Jangan delete secara fisik.
   *
   * Histori:
   *
   * - OrderItem
   * - StockLedger
   * - Cart
   * - FlashSalePurchase
   *
   * tetap membutuhkan SKU tersebut.
   */

  await tx.productSku.updateMany({
    where: {
      productId,

      id: {
        notIn:
          [
            ...activeSkuIds,
          ],
      },
    },

    data: {
      isActive:
        false,
    },
  });
}

  static async deleteProduct(id: string) {
    const product = await ProductRepository.findById(id);

    if (!product) {
      throw new Error("Produk tidak ditemukan.");
    }

    return ProductRepository.softDelete(id);
  }

  static async publishProduct(id: string) {
    const product = await ProductRepository.findById(id);

    if (!product) {
      throw new Error("Produk tidak ditemukan.");
    }

    return ProductRepository.update(id, {
      isPublished: true,
    });
  }

  static async unpublishProduct(id: string) {
    const product = await ProductRepository.findById(id);

    if (!product) {
      throw new Error("Produk tidak ditemukan.");
    }

    return ProductRepository.update(id, {
      isPublished: false,
    });
  }

  static async togglePublish(id: string) {
    const product = await ProductRepository.findById(id);

    if (!product) {
      throw new Error("Produk tidak ditemukan.");
    }

    return product.isPublished
      ? this.unpublishProduct(id)
      : this.publishProduct(id);
  }

  static async setFeatured(id: string, featured: boolean) {
    const product = await ProductRepository.findById(id);

    if (!product) {
      throw new Error("Produk tidak ditemukan.");
    }

    return ProductRepository.update(id, { featured });
  }
}

export default ProductService;
