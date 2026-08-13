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
  /**
   * Daftar kategori.
   */
  static async getCategories(
    filters: CategoryFilters = {}
  ) {
    return CategoryRepository.findMany(
      filters
    );
  }

  /**
   * Detail kategori.
   */
  static async getCategoryById(
    id: string
  ) {
    return CategoryRepository.findById(
      id
    );
  }

  /**
   * Membuat kategori.
   */
  static async createCategory(
    input: CreateCategoryInput
  ) {
    await this.assertSlugUnique(
      input.slug
    );

    return CategoryRepository.create({
      name: input.name,

      slug: input.slug,

      image:
        input.image ?? null,

      description:
        input.description ?? null,

      sortOrder:
        input.sortOrder ?? 0,

      isActive:
        input.isActive ?? true,
    });
  }

  /**
   * Update kategori.
   */
  static async updateCategory(
    id: string,
    input: UpdateCategoryInput
  ) {
    await this.assertExists(id);

    if (input.slug) {
      await this.assertSlugUnique(
        input.slug,
        id
      );
    }

    return CategoryRepository.update(
      id,
      input
    );
  }

  /**
   * Soft delete kategori.
   */
  static async deleteCategory(
    id: string
  ) {
    await this.assertExists(id);

    return CategoryRepository.softDelete(
      id
    );
  }

  /**
   * Aktifkan kategori.
   */
  static async activateCategory(
    id: string
  ) {
    await this.assertExists(id);

    return CategoryRepository.activate(
      id
    );
  }

  /**
   * Nonaktifkan kategori.
   */
  static async deactivateCategory(
    id: string
  ) {
    await this.assertExists(id);

    return CategoryRepository.deactivate(
      id
    );
  }

  /**
   * Restore kategori.
   */
  static async restoreCategory(
    id: string
  ) {
    return CategoryRepository.restore(
      id
    );
  }

  /**
   * Pastikan kategori ada.
   */
  private static async assertExists(
    id: string
  ) {
    const category =
      await CategoryRepository.findById(
        id
      );

    if (!category) {
      throw new Error(
        "Kategori tidak ditemukan."
      );
    }

    return category;
  }

  /**
   * Pastikan slug unik.
   */
  private static async assertSlugUnique(
    slug: string,
    ignoreId?: string
  ) {
    const exists =
      await CategoryRepository.existsBySlug(
        slug,
        ignoreId
      );

    if (exists) {
      throw new Error(
        "Slug kategori sudah digunakan."
      );
    }
  }
}