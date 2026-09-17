import CategoryRepository, {
  type CategoryFilters,
} from "@/repositories/CategoryRepository";

export interface CreateCategoryInput {
  name: string;
  slug: string;
  image?: string | null;
  description?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export type UpdateCategoryInput =
  Partial<CreateCategoryInput>;

export default class CategoryService {
  static async getCategories(
    filters: CategoryFilters = {},
  ) {
    return CategoryRepository.findMany(
      filters,
    );
  }

  static async getCategoriesPaginated(
    filters: CategoryFilters = {},
    page = 1,
    limit = 20,
  ) {
    return CategoryRepository.findManyPaginated(
      filters,
      page,
      limit,
    );
  }

  static async getCategoryById(
    id: string,
  ) {
    return CategoryRepository.findById(id);
  }

  static async createCategory(
    input: CreateCategoryInput,
  ) {
    await this.assertSlugUnique(
      input.slug,
    );

    return CategoryRepository.create({
      name: input.name,
      slug: input.slug,
      image: input.image ?? null,
      description:
        input.description ?? null,
      sortOrder:
        input.sortOrder ?? 0,
      isActive:
        input.isActive ?? true,
    });
  }

  static async updateCategory(
    id: string,
    input: UpdateCategoryInput,
  ) {
    await this.assertExists(id);

    if (input.slug) {
      await this.assertSlugUnique(
        input.slug,
        id,
      );
    }

    return CategoryRepository.update(
      id,
      input,
    );
  }

  /**
   * Update category sort order.
   *
   * Sort order dikelola melalui repository
   * agar perubahan posisi dilakukan secara
   * konsisten dan tidak menghasilkan
   * duplicate sortOrder.
   */
  static async updateCategorySortOrder(
    id: string,
    sortOrder: number,
  ) {
    const category =
      await this.assertExists(id);

    if (
      !Number.isInteger(sortOrder) ||
      sortOrder < 0 ||
      sortOrder > 999999
    ) {
      throw new Error(
        "Urutan harus berupa angka bulat antara 0 sampai 999.999.",
      );
    }

    if (
      category.sortOrder ===
      sortOrder
    ) {
      return category;
    }

    return CategoryRepository.setSortOrder(
      id,
      sortOrder,
    );
  }

  static async deleteCategory(
    id: string,
  ) {
    const category =
      await this.assertExists(id);

    const totalProducts =
      category._count?.products ?? 0;

    if (totalProducts > 0) {
      throw new Error(
        `Kategori "${category.name}" tidak dapat dihapus karena masih memiliki ${totalProducts.toLocaleString(
          "id-ID",
        )} produk. Pindahkan produk ke kategori lain terlebih dahulu.`,
      );
    }

    return CategoryRepository.softDelete(
      id,
    );
  }

  static async activateCategory(
    id: string,
  ) {
    await this.assertExists(id);

    return CategoryRepository.activate(
      id,
    );
  }

  static async deactivateCategory(
    id: string,
  ) {
    await this.assertExists(id);

    return CategoryRepository.deactivate(
      id,
    );
  }

  static async restoreCategory(
  id: string,
) {
  if (
    typeof id !== "string" ||
    !id.trim()
  ) {
    throw new Error(
      "ID kategori tidak valid.",
    );
  }

  const normalizedId = id.trim();

  const category =
    await CategoryRepository.findDeletedById(
      normalizedId,
    );

  if (!category) {
    throw new Error(
      "Kategori terhapus tidak ditemukan.",
    );
  }

  /*
   * Slug harus tetap unik ketika kategori
   * dikembalikan ke daftar aktif.
   */
  const slugOwner =
    await CategoryRepository.findBySlugAnyState(
      category.slug,
      normalizedId,
    );

  if (slugOwner) {
    throw new Error(
      `Kategori tidak dapat dipulihkan karena slug "${category.slug}" sudah digunakan kategori lain.`,
    );
  }

  return CategoryRepository.restore(
    normalizedId,
  );
}

static async permanentDeleteCategory(
  id: string,
) {
  if (
    typeof id !== "string" ||
    !id.trim()
  ) {
    throw new Error(
      "ID kategori tidak valid.",
    );
  }

  const normalizedId = id.trim();

  const category =
    await CategoryRepository.findDeletedById(
      normalizedId,
    );

  if (!category) {
    throw new Error(
      "Kategori terhapus tidak ditemukan.",
    );
  }

  const totalProducts =
    category._count?.products ?? 0;

  if (totalProducts > 0) {
    throw new Error(
      `Kategori "${category.name}" tidak dapat dihapus permanen karena masih memiliki ${totalProducts.toLocaleString("id-ID")} produk. Pindahkan produk terlebih dahulu.`,
    );
  }

  const result =
    await CategoryRepository.permanentDelete(
      normalizedId,
    );

  if (result.count === 0) {
    throw new Error(
      "Kategori tidak dapat dihapus permanen karena statusnya sudah berubah. Silakan muat ulang halaman.",
    );
  }

  return result;
}

  private static async assertExists(
    id: string,
  ) {
    const category =
      await CategoryRepository.findById(
        id,
      );

    if (!category) {
      throw new Error(
        "Kategori tidak ditemukan.",
      );
    }

    return category;
  }

  private static async assertSlugUnique(
    slug: string,
    ignoreId?: string,
  ) {
    const exists =
      await CategoryRepository.existsBySlug(
        slug,
        ignoreId,
      );

    if (exists) {
      throw new Error(
        "Slug kategori sudah digunakan.",
      );
    }
  }
}