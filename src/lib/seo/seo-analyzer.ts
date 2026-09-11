import {
  SEO_DESCRIPTION_MAX_LENGTH,
  SEO_TITLE_MAX_LENGTH,
} from "./seo.constants";

export type SeoAnalysisSeverity =
  | "error"
  | "warning"
  | "info"
  | "success";

export type SeoAnalysisIssue = {
  code: string;
  severity: SeoAnalysisSeverity;
  field: string;
  message: string;
  recommendation?: string;
};

export type SeoAnalysisInput = {
  title?: string | null;
  description?: string | null;
  slug?: string | null;
  canonicalUrl?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;

  /**
   * Optional entity context.
   *
   * Digunakan untuk analisis SEO yang lebih kontekstual
   * pada site, product, dan category.
   */
  entityType?: "site" | "product" | "category";

  /**
   * Nama entity utama.
   *
   * Contoh:
   * - Product name
   * - Category name
   * - Store/site name
   */
  name?: string | null;

  /**
   * Context kategori untuk product.
   */
  categoryName?: string | null;
  categorySlug?: string | null;

  /**
   * Product content signals.
   */
  ingredients?: string | null;
  nutritionInformation?: unknown;
  storageInstructions?: string | null;
  usageInstructions?: string | null;
};

export type SeoAnalysisResult = {
  score: number;
  issues: SeoAnalysisIssue[];
  analyzedAt: string;
};

function normalize(value?: string | null): string {
  return value?.trim() ?? "";
}

function getWordCount(value?: string | null): number {
  const normalized = normalize(value);

  if (!normalized) {
    return 0;
  }

  return normalized.split(/\s+/).length;
}

export function analyzeSeoMetadata(
  input: SeoAnalysisInput,
): SeoAnalysisResult {
  const issues: SeoAnalysisIssue[] = [];

  const title = normalize(input.title);
  const description = normalize(input.description);
  const slug = normalize(input.slug);
  const canonicalUrl = normalize(input.canonicalUrl);
  const ogTitle = normalize(input.ogTitle);
  const ogDescription = normalize(input.ogDescription);
  const ogImage = normalize(input.ogImage);

  const name = normalize(input.name);
  const categoryName = normalize(input.categoryName);
  const ingredients = normalize(input.ingredients);
  const storageInstructions = normalize(
    input.storageInstructions,
  );
  const usageInstructions = normalize(
    input.usageInstructions,
  );

  /**
   * ============================================================
   * SEO TITLE
   * ============================================================
   */

  if (!title) {
    issues.push({
      code: "TITLE_MISSING",
      severity: "error",
      field: "title",
      message: "SEO title belum tersedia.",
      recommendation:
        "Tambahkan SEO title yang relevan dengan halaman.",
    });
  } else if (title.length > SEO_TITLE_MAX_LENGTH) {
    issues.push({
      code: "TITLE_TOO_LONG",
      severity: "warning",
      field: "title",
      message: `SEO title melebihi ${SEO_TITLE_MAX_LENGTH} karakter.`,
      recommendation:
        "Ringkas title agar lebih mudah ditampilkan pada hasil pencarian.",
    });
  } else {
    issues.push({
      code: "TITLE_OK",
      severity: "success",
      field: "title",
      message:
        "SEO title tersedia dan berada dalam batas panjang.",
    });
  }

  /**
   * ============================================================
   * TITLE / ENTITY RELEVANCE
   * ============================================================
   */

  if (name && title) {
    const titleLower = title.toLowerCase();
    const nameLower = name.toLowerCase();

    if (!titleLower.includes(nameLower)) {
      issues.push({
        code: "TITLE_NAME_MISMATCH",
        severity: "warning",
        field: "title",
        message:
          "SEO title belum terlihat mencantumkan nama entity.",
        recommendation:
          `Pertimbangkan memasukkan "${name}" ke dalam SEO title jika tetap natural.`,
      });
    } else {
      issues.push({
        code: "TITLE_NAME_MATCH",
        severity: "success",
        field: "title",
        message:
          "SEO title relevan dengan nama entity.",
      });
    }
  }

  /**
   * ============================================================
   * META DESCRIPTION
   * ============================================================
   */

  if (!description) {
    issues.push({
      code: "DESCRIPTION_MISSING",
      severity: "error",
      field: "description",
      message: "Meta description belum tersedia.",
      recommendation:
        "Tambahkan deskripsi singkat yang menjelaskan halaman.",
    });
  } else if (
    description.length > SEO_DESCRIPTION_MAX_LENGTH
  ) {
    issues.push({
      code: "DESCRIPTION_TOO_LONG",
      severity: "warning",
      field: "description",
      message: `Meta description melebihi ${SEO_DESCRIPTION_MAX_LENGTH} karakter.`,
      recommendation:
        "Ringkas meta description agar lebih efektif pada hasil pencarian.",
    });
  } else {
    issues.push({
      code: "DESCRIPTION_OK",
      severity: "success",
      field: "description",
      message:
        "Meta description tersedia dan berada dalam batas panjang.",
    });
  }

  /**
   * ============================================================
   * SLUG
   * ============================================================
   */

  if (!slug) {
    issues.push({
      code: "SLUG_MISSING",
      severity: "warning",
      field: "slug",
      message: "Slug belum tersedia.",
      recommendation:
        "Gunakan slug yang singkat, deskriptif, dan mudah dibaca.",
    });
  } else {
    issues.push({
      code: "SLUG_OK",
      severity: "success",
      field: "slug",
      message: "Slug tersedia.",
    });

    if (slug !== slug.toLowerCase()) {
      issues.push({
        code: "SLUG_UPPERCASE",
        severity: "warning",
        field: "slug",
        message:
          "Slug masih mengandung huruf kapital.",
        recommendation:
          "Gunakan slug dengan huruf kecil agar konsisten dan mudah dibaca.",
      });
    }

    if (/\s/.test(slug)) {
      issues.push({
        code: "SLUG_CONTAINS_SPACE",
        severity: "warning",
        field: "slug",
        message:
          "Slug masih mengandung spasi.",
        recommendation:
          "Gunakan tanda hubung (-) sebagai pemisah kata pada slug.",
      });
    }
  }

  /**
   * ============================================================
   * CANONICAL
   * ============================================================
   */

  if (!canonicalUrl) {
    issues.push({
      code: "CANONICAL_MISSING",
      severity: "warning",
      field: "canonicalUrl",
      message: "Canonical URL belum tersedia.",
      recommendation:
        "Pastikan halaman memiliki canonical URL yang sesuai.",
    });
  } else {
    issues.push({
      code: "CANONICAL_OK",
      severity: "success",
      field: "canonicalUrl",
      message: "Canonical URL tersedia.",
    });
  }

  /**
   * ============================================================
   * OPEN GRAPH
   * ============================================================
   */

  if (!ogTitle) {
    issues.push({
      code: "OG_TITLE_MISSING",
      severity: "info",
      field: "ogTitle",
      message:
        "Open Graph title belum tersedia.",
    });
  } else {
    issues.push({
      code: "OG_TITLE_OK",
      severity: "success",
      field: "ogTitle",
      message:
        "Open Graph title tersedia.",
    });
  }

  if (!ogDescription) {
    issues.push({
      code: "OG_DESCRIPTION_MISSING",
      severity: "info",
      field: "ogDescription",
      message:
        "Open Graph description belum tersedia.",
    });
  } else {
    issues.push({
      code: "OG_DESCRIPTION_OK",
      severity: "success",
      field: "ogDescription",
      message:
        "Open Graph description tersedia.",
    });
  }

  if (!ogImage) {
    issues.push({
      code: "OG_IMAGE_MISSING",
      severity: "info",
      field: "ogImage",
      message:
        "Open Graph image belum tersedia.",
    });
  } else {
    issues.push({
      code: "OG_IMAGE_OK",
      severity: "success",
      field: "ogImage",
      message:
        "Open Graph image tersedia.",
    });
  }

  /**
   * ============================================================
   * PRODUCT ANALYSIS
   * ============================================================
   */

  if (input.entityType === "product") {
    const descriptionWordCount =
      getWordCount(input.description);

    /**
     * Product description content.
     *
     * DESCRIPTION_MISSING di atas sudah menangani
     * keberadaan metadata description.
     *
     * Di sini kita hanya menilai kedalaman content
     * product agar tidak terjadi duplicate issue.
     */

    if (description && descriptionWordCount < 20) {
      issues.push({
        code: "PRODUCT_DESCRIPTION_THIN",
        severity: "warning",
        field: "description",
        message:
          "Deskripsi produk masih sangat singkat.",
        recommendation:
          "Perkaya deskripsi dengan karakteristik produk, kegunaan, kondisi, atau informasi yang relevan.",
      });
    } else if (description) {
      issues.push({
        code: "PRODUCT_DESCRIPTION_CONTENT",
        severity: "success",
        field: "description",
        message:
          "Deskripsi produk memiliki content yang cukup untuk dianalisis.",
      });
    }

    /**
     * Product category.
     */

    if (!categoryName) {
      issues.push({
        code: "PRODUCT_CATEGORY_MISSING",
        severity: "warning",
        field: "category",
        message:
          "Produk belum memiliki konteks nama kategori.",
        recommendation:
          "Pastikan produk berada pada kategori yang relevan.",
      });
    } else {
      issues.push({
        code: "PRODUCT_CATEGORY_OK",
        severity: "success",
        field: "category",
        message:
          `Produk memiliki kategori "${categoryName}".`,
      });
    }

    /**
     * Product ingredients.
     */

    if (!ingredients) {
      issues.push({
        code: "PRODUCT_INGREDIENTS_MISSING",
        severity: "info",
        field: "ingredients",
        message:
          "Informasi bahan/kandungan belum tersedia.",
      });
    } else {
      issues.push({
        code: "PRODUCT_INGREDIENTS_OK",
        severity: "success",
        field: "ingredients",
        message:
          "Informasi bahan/kandungan tersedia.",
      });
    }

    /**
     * Product nutrition.
     */

    if (
      input.nutritionInformation === null ||
      input.nutritionInformation === undefined
    ) {
      issues.push({
        code: "PRODUCT_NUTRITION_MISSING",
        severity: "info",
        field: "nutritionInformation",
        message:
          "Informasi nutrisi belum tersedia.",
      });
    } else {
      issues.push({
        code: "PRODUCT_NUTRITION_OK",
        severity: "success",
        field: "nutritionInformation",
        message:
          "Informasi nutrisi tersedia.",
      });
    }

    /**
     * Storage instructions.
     */

    if (!storageInstructions) {
      issues.push({
        code: "PRODUCT_STORAGE_MISSING",
        severity: "info",
        field: "storageInstructions",
        message:
          "Informasi penyimpanan belum tersedia.",
      });
    } else {
      issues.push({
        code: "PRODUCT_STORAGE_OK",
        severity: "success",
        field: "storageInstructions",
        message:
          "Informasi penyimpanan tersedia.",
      });
    }

    /**
     * Usage instructions.
     */

    if (!usageInstructions) {
      issues.push({
        code: "PRODUCT_USAGE_MISSING",
        severity: "info",
        field: "usageInstructions",
        message:
          "Informasi penggunaan/pengolahan belum tersedia.",
      });
    } else {
      issues.push({
        code: "PRODUCT_USAGE_OK",
        severity: "success",
        field: "usageInstructions",
        message:
          "Informasi penggunaan/pengolahan tersedia.",
      });
    }
  }

  /**
   * ============================================================
   * CATEGORY ANALYSIS
   * ============================================================
   */

  if (input.entityType === "category") {
    if (!name) {
      issues.push({
        code: "CATEGORY_NAME_MISSING",
        severity: "error",
        field: "name",
        message:
          "Nama kategori belum tersedia.",
        recommendation:
          "Tambahkan nama kategori yang jelas dan relevan.",
      });
    } else {
      issues.push({
        code: "CATEGORY_NAME_OK",
        severity: "success",
        field: "name",
        message:
          "Nama kategori tersedia.",
      });
    }

    if (!description) {
      issues.push({
        code: "CATEGORY_DESCRIPTION_MISSING",
        severity: "warning",
        field: "description",
        message:
          "Kategori belum memiliki deskripsi.",
        recommendation:
          "Tambahkan deskripsi kategori yang menjelaskan produk yang termasuk di dalamnya.",
      });
    }
  }

  /**
   * ============================================================
   * SCORE
   * ============================================================
   *
   * INFO tidak mempengaruhi score.
   *
   * Yang dihitung:
   * - success
   * - warning
   * - error
   */

  const scoredIssues = issues.filter(
    (issue) => issue.severity !== "info",
  );

  const totalChecks = scoredIssues.length;

  const positiveChecks = scoredIssues.filter(
    (issue) => issue.severity === "success",
  ).length;

  const score =
    totalChecks === 0
      ? 0
      : Math.round(
          (positiveChecks / totalChecks) * 100,
        );

  return {
    score,
    issues,
    analyzedAt: new Date().toISOString(),
  };
}