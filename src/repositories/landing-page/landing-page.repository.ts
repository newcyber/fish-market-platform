import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * ============================================================
 * LANDING PAGE REPOSITORY
 * ============================================================
 *
 * Repository khusus untuk akses database:
 * - LandingPageSettings
 * - LandingPageSeoAnalysis
 * - LandingPageAndroidApp
 * - LandingPageIosApp
 *
 * Landing Page bersifat singleton menggunakan:
 * key = "default"
 *
 * Repository hanya menangani akses database.
 * Business logic tetap berada di service layer.
 *
 * ============================================================
 */

const LANDING_PAGE_KEY = "default";

/**
 * ============================================================
 * LANDING PAGE REPOSITORY
 * ============================================================
 */

class LandingPageRepository {
  /**
   * ==========================================================
   * GET LANDING PAGE SETTINGS
   * ==========================================================
   */

  async get() {
    return prisma.landingPageSettings.findUnique({
      where: {
        key: LANDING_PAGE_KEY,
      },
    });
  }

  /**
   * ==========================================================
   * GET OR CREATE LANDING PAGE SETTINGS
   * ==========================================================
   */

  async getOrCreate(config: Prisma.InputJsonValue = {}) {
    return prisma.landingPageSettings.upsert({
      where: {
        key: LANDING_PAGE_KEY,
      },
      update: {},
      create: {
        key: LANDING_PAGE_KEY,
        enabled: true,
        config,
      },
    });
  }

  /**
   * ==========================================================
   * UPDATE LANDING PAGE SETTINGS
   * ==========================================================
   */

  async update(data: {
    enabled?: boolean;
    config?: Prisma.InputJsonValue;
  }) {
    return prisma.landingPageSettings.update({
      where: {
        key: LANDING_PAGE_KEY,
      },
      data,
    });
  }

  /**
   * ==========================================================
   * GET SEO ANALYSES
   * ==========================================================
   */

  async getSeoAnalyses() {
    return prisma.landingPageSeoAnalysis.findMany({
      where: {
        landingPageSettings: {
          key: LANDING_PAGE_KEY,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * ==========================================================
   * CREATE SEO ANALYSIS
   * ==========================================================
   */

  async createSeoAnalysis(data: {
    score: number;
    analysis: Prisma.InputJsonValue;
    recommendations: Prisma.InputJsonValue;
    source?: string;
  }) {
    const landingPageSettings = await this.getOrCreate();

    return prisma.landingPageSeoAnalysis.create({
      data: {
        landingPageSettingsId: landingPageSettings.id,
        score: data.score,
        analysis: data.analysis,
        recommendations: data.recommendations,
        source: data.source ?? "RULE_ENGINE",
      },
    });
  }

  /**
   * ==========================================================
   * GET ANDROID APP
   * ==========================================================
   */

  async getAndroidApp() {
    return prisma.landingPageAndroidApp.findUnique({
      where: {
        key: LANDING_PAGE_KEY,
      },
    });
  }

  /**
   * ==========================================================
   * GET OR CREATE ANDROID APP
   * ==========================================================
   */

  async getOrCreateAndroidApp() {
    const existingApp = await this.getAndroidApp();

    if (existingApp) {
      return existingApp;
    }

    return prisma.landingPageAndroidApp.create({
      data: {
        key: LANDING_PAGE_KEY,
        enabled: false,
        appName: "Pisjo Market",
        version: "1.0.0",
      },
    });
  }

  /**
   * ==========================================================
   * UPDATE ANDROID APP
   * ==========================================================
   */

  async updateAndroidApp(data: {
    enabled?: boolean;
    appName?: string;
    version?: string;
    description?: string | null;
    fileName?: string | null;
    fileUrl?: string | null;
    mimeType?: string | null;
    fileSize?: number | null;
    sha256?: string | null;
  }) {
    return prisma.landingPageAndroidApp.upsert({
      where: {
        key: LANDING_PAGE_KEY,
      },
      create: {
        key: LANDING_PAGE_KEY,
        enabled: data.enabled ?? false,
        appName: data.appName ?? "Pisjo Market",
        version: data.version ?? "1.0.0",
        description: data.description ?? null,
        fileName: data.fileName ?? null,
        fileUrl: data.fileUrl ?? null,
        mimeType: data.mimeType ?? null,
        fileSize: data.fileSize ?? null,
        sha256: data.sha256 ?? null,
      },
      update: data,
    });
  }

  /**
   * ==========================================================
   * GET IOS APP
   * ==========================================================
   *
   * Mengambil konfigurasi iOS berdasarkan singleton key.
   *
   * Binary IPA TIDAK disimpan di database.
   * Database hanya menyimpan metadata aplikasi dan
   * URL App Store.
   *
   * ==========================================================
   */

  async getIosApp() {
    return prisma.landingPageIosApp.findUnique({
      where: {
        key: LANDING_PAGE_KEY,
      },
    });
  }

  /**
   * ==========================================================
   * GET OR CREATE IOS APP
   * ==========================================================
   *
   * Membuat konfigurasi default iOS jika belum tersedia.
   *
   * Default:
   * - enabled  = false
   * - appName  = Pisjo Market
   * - version  = 1.0.0
   * - URL       = null
   *
   * ==========================================================
   */

  async getOrCreateIosApp() {
    const existingApp = await this.getIosApp();

    if (existingApp) {
      return existingApp;
    }

    return prisma.landingPageIosApp.create({
      data: {
        key: LANDING_PAGE_KEY,
        enabled: false,
        appName: "Pisjo Market",
        version: "1.0.0",
        description: null,
        appStoreUrl: null,
      },
    });
  }

  /**
   * ==========================================================
   * UPDATE IOS APP
   * ==========================================================
   *
   * Update atau create konfigurasi iOS.
   *
   * Tidak ada upload IPA.
   * iOS menggunakan URL resmi App Store.
   *
   * ==========================================================
   */

  async updateIosApp(data: {
    enabled?: boolean;
    appName?: string;
    version?: string;
    description?: string | null;
    appStoreUrl?: string | null;
  }) {
    return prisma.landingPageIosApp.upsert({
      where: {
        key: LANDING_PAGE_KEY,
      },
      create: {
        key: LANDING_PAGE_KEY,
        enabled: data.enabled ?? false,
        appName: data.appName ?? "Pisjo Market",
        version: data.version ?? "1.0.0",
        description: data.description ?? null,
        appStoreUrl: data.appStoreUrl ?? null,
      },
      update: data,
    });
  }
}

/**
 * ============================================================
 * SINGLETON INSTANCE
 * ============================================================
 */

const landingPageRepository = new LandingPageRepository();

export default landingPageRepository;