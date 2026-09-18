import { Prisma } from "@prisma/client";

import settingsRepository from "@/repositories/settings/settings.repository";

import landingPageRepository from "./landing-page.repository";

import StorageService from "@/services/storage/storage.service";

import { getSiteUrls } from "@/services/site/site-url.service";

import { normalizeLandingPageConfig } from "./landing-page.validation";

import {
  RewardCatalogService,
} from "@/services/reward/reward-catalog.service";

import type {
  LandingPageAndroidAppData,
  LandingPageConfig,
  LandingPageSeoAnalysisData,
  LandingPageSettingsData,
  PublicLandingPageData,
  PublicLandingPageReward,
} from "./landing-page.types";

import type {
  LandingPageIosAppData,
} from "./landing-page-ios.types";

/**
 * ============================================================
 * LANDING PAGE SERVICE
 * ============================================================
 *
 * Business logic untuk Landing Page.
 *
 * Flow:
 *
 * Server Action / API / Page
 *        ↓
 * LandingPageService
 *        ↓
 * LandingPageRepository
 *        ↓
 * Prisma
 *
 * Service bertanggung jawab terhadap:
 *
 * - normalisasi config JSON
 * - fallback config
 * - transformasi data repository
 * - business rules sederhana
 * - upload APK
 * - cleanup file APK lama
 * - validasi sederhana konfigurasi iOS
 * - mengambil reward catalog untuk public landing page
 *
 * ============================================================
 */

/**
 * ============================================================
 * CONVERT VALUE TO PRISMA JSON VALUE
 * ============================================================
 */

function toInputJsonValue(
  value: unknown,
): Prisma.InputJsonValue {
  return JSON.parse(
    JSON.stringify(value),
  ) as Prisma.InputJsonValue;
}

/**
 * ============================================================
 * LANDING PAGE SERVICE
 * ============================================================
 */

class LandingPageService {
  /**
   * ==========================================================
   * UPDATE LANDING PAGE IMAGES
   * ==========================================================
   */

  async updateLandingPageImages(input: {
    hero?: string | null;
    app?: string | null;
    ogImage?: string | null;
  }) {
    const landingPage =
      await this.getLandingPage();

    const currentImages =
      landingPage.config.images ?? {};

    const images = {
      ...currentImages,
      ...input,
    };

    const config: LandingPageConfig = {
      ...landingPage.config,
      images,
    };

    return landingPageRepository.update({
      enabled: landingPage.enabled,
      config: toInputJsonValue(config),
    });
  }

  /**
   * ==========================================================
   * GET LANDING PAGE
   * ==========================================================
   */

  async getLandingPage(): Promise<LandingPageSettingsData> {
    const settings =
      await landingPageRepository.getOrCreate();

    return {
      id: settings.id,
      key: settings.key,
      enabled: settings.enabled,
      config: normalizeLandingPageConfig(
        settings.config,
      ),
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    };
  }

  /**
   * ==========================================================
   * GET PUBLIC LANDING PAGE
   * ==========================================================
   *
   * Mengambil seluruh data yang diperlukan oleh
   * public landing page.
   *
   * Android:
   * - URL hanya diberikan jika enabled = true
   * - fileUrl tersedia
   *
   * iOS:
   * - URL hanya diberikan jika enabled = true
   * - appStoreUrl tersedia
   *
   * Reward:
   * - hanya reward aktif
   * - hanya reward dengan stock > 0
   * - urutan mengikuti RewardCatalogRepository
   *
   * Reward TIDAK disimpan di LandingPageSettings.
   * Reward diambil langsung dari RewardCatalog.
   *
   * ==========================================================
   */

  async getPublicLandingPage(): Promise<PublicLandingPageData> {
    /**
     * ========================================================
     * LOAD LANDING PAGE DATA
     * ========================================================
     *
     * Semua resource independen diambil secara paralel.
     */

    const [
      landingPage,
      storeSettings,
      androidApp,
      iosApp,
      availableRewards,
    ] = await Promise.all([
      this.getLandingPage(),

      settingsRepository.getOrCreate(),

      landingPageRepository.getAndroidApp(),

      landingPageRepository.getIosApp(),

      RewardCatalogService.getAvailableRewards(),
    ]);

    /**
     * ========================================================
     * SITE URLS
     * ========================================================
     */

    const siteUrls =
      await getSiteUrls();

    /**
     * ========================================================
     * TRANSFORM REWARD DATA
     * ========================================================
     *
     * Hanya expose field yang memang diperlukan
     * oleh public landing page.
     *
     * Tidak expose:
     * - claims
     * - category internal
     * - createdAt
     * - updatedAt
     * - field internal lainnya
     */

    const rewards: PublicLandingPageReward[] =
      availableRewards.map((reward) => ({
        id: reward.id,

        name: reward.name,

        description:
          reward.description ?? null,

        image:
          reward.image ?? null,

        requiredPoints:
          reward.requiredPoints,

        stock:
          reward.stock,

        sortOrder:
          reward.sortOrder,
      }));

    /**
     * ========================================================
     * PUBLIC RESPONSE
     * ========================================================
     */

    return {
      enabled:
        landingPage.enabled,

      brand: {
        storeName:
          storeSettings.storeName?.trim() ||
          "Pisjo Market",

        storeDescription:
          storeSettings.storeDescription?.trim() ||
          "Fresh Seafood",

        siteLogo:
          storeSettings.siteLogo?.trim() ||
          null,
      },

      config:
        landingPage.config,

      rewards,

      androidApp,

      urls: {
        store:
          siteUrls.storefrontUrl,

        android:
          androidApp?.enabled &&
          androidApp.fileUrl
            ? androidApp.fileUrl
            : null,

        ios:
          iosApp?.enabled &&
          iosApp.appStoreUrl
            ? iosApp.appStoreUrl
            : null,
      },
    };
  }

  /**
   * ==========================================================
   * GET CONFIG
   * ==========================================================
   */

  async getConfig(): Promise<LandingPageConfig> {
    const landingPage =
      await this.getLandingPage();

    return landingPage.config;
  }

  /**
   * ==========================================================
   * UPDATE LANDING PAGE
   * ==========================================================
   */

  async updateLandingPage(data: {
    enabled?: boolean;
    config?: LandingPageConfig;
  }) {
    return landingPageRepository.update({
      enabled:
        data.enabled,

      config:
        data.config === undefined
          ? undefined
          : toInputJsonValue(
              data.config,
            ),
    });
  }

  /**
   * ==========================================================
   * GET SEO ANALYSES
   * ==========================================================
   */

  async getSeoAnalyses(): Promise<
    LandingPageSeoAnalysisData[]
  > {
    const analyses =
      await landingPageRepository.getSeoAnalyses();

    return analyses.map((analysis) => ({
      id:
        analysis.id,

      landingPageSettingsId:
        analysis.landingPageSettingsId,

      score:
        analysis.score,

      analysis:
        analysis.analysis,

      recommendations:
        analysis.recommendations,

      source:
        analysis.source,

      createdAt:
        analysis.createdAt,
    }));
  }

  /**
   * ==========================================================
   * CREATE SEO ANALYSIS
   * ==========================================================
   */

  async createSeoAnalysis(data: {
    score: number;
    analysis: Record<string, unknown>;
    recommendations: Record<string, unknown>;
    source?: string;
  }) {
    return landingPageRepository.createSeoAnalysis({
      score:
        data.score,

      analysis:
        toInputJsonValue(
          data.analysis,
        ),

      recommendations:
        toInputJsonValue(
          data.recommendations,
        ),

      source:
        data.source,
    });
  }

  /**
   * ==========================================================
   * GET ANDROID APP
   * ==========================================================
   */

  async getAndroidApp(): Promise<
    LandingPageAndroidAppData | null
  > {
    return landingPageRepository.getAndroidApp();
  }

  /**
   * ==========================================================
   * GET OR CREATE ANDROID APP
   * ==========================================================
   */

  async getOrCreateAndroidApp(): Promise<
    LandingPageAndroidAppData
  > {
    return landingPageRepository.getOrCreateAndroidApp();
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
    return landingPageRepository.updateAndroidApp(
      data,
    );
  }

  /**
   * ==========================================================
   * GET IOS APP
   * ==========================================================
   *
   * Mengambil konfigurasi aplikasi iOS.
   *
   * ==========================================================
   */

  async getIosApp(): Promise<
    LandingPageIosAppData | null
  > {
    return landingPageRepository.getIosApp();
  }

  /**
   * ==========================================================
   * GET OR CREATE IOS APP
   * ==========================================================
   *
   * Mengambil konfigurasi iOS.
   *
   * Jika belum ada record, repository akan membuat
   * konfigurasi default.
   *
   * ==========================================================
   */

  async getOrCreateIosApp(): Promise<
    LandingPageIosAppData
  > {
    return landingPageRepository.getOrCreateIosApp();
  }

  /**
   * ==========================================================
   * UPDATE IOS APP
   * ==========================================================
   *
   * Business logic konfigurasi aplikasi iOS.
   *
   * Tidak ada upload IPA.
   * iOS menggunakan URL App Store.
   *
   * ==========================================================
   */

  async updateIosApp(data: {
    enabled?: boolean;

    appName?: string;

    version?: string;

    description?: string | null;

    appStoreUrl?: string | null;
  }): Promise<LandingPageIosAppData> {
    const appName =
      data.appName?.trim() ||
      "";

    const version =
      data.version?.trim() ||
      "";

    const description =
      data.description?.trim() ||
      null;

    const appStoreUrl =
      data.appStoreUrl?.trim() ||
      null;

    /**
     * ========================================================
     * VALIDATE APP NAME
     * ========================================================
     */

    if (!appName) {
      throw new Error(
        "Nama aplikasi iOS wajib diisi.",
      );
    }

    /**
     * ========================================================
     * VALIDATE VERSION
     * ========================================================
     */

    if (!version) {
      throw new Error(
        "Versi aplikasi iOS wajib diisi.",
      );
    }

    /**
     * ========================================================
     * VALIDATE APP STORE URL
     * ========================================================
     *
     * Jika URL diberikan:
     *
     * - harus valid
     * - harus menggunakan HTTPS
     */

    if (appStoreUrl) {
      try {
        const url =
          new URL(appStoreUrl);

        if (
          url.protocol !== "https:"
        ) {
          throw new Error(
            "URL App Store harus menggunakan HTTPS.",
          );
        }
      } catch {
        throw new Error(
          "URL App Store tidak valid.",
        );
      }
    }

    /**
     * ========================================================
     * UPDATE IOS
     * ========================================================
     */

    return landingPageRepository.updateIosApp({
      enabled:
        data.enabled ?? false,

      appName,

      version,

      description,

      appStoreUrl,
    });
  }

  /**
   * ==========================================================
   * UPLOAD ANDROID APK
   * ==========================================================
   *
   * Flow:
   *
   * API Route
   *    ↓
   * Service
   *    ↓
   * StorageService
   *    ↓
   * Simpan APK baru
   *    ↓
   * Update database
   *    ↓
   * Hapus APK lama
   *
   * Jika database gagal:
   * APK baru akan dihapus kembali agar tidak
   * menjadi orphan file.
   *
   * ==========================================================
   */

  async uploadAndroidApk(
    file: File,
  ): Promise<LandingPageAndroidAppData> {
    /**
     * ========================================================
     * GET CURRENT APP
     * ========================================================
     */

    const currentApp =
      await landingPageRepository.getAndroidApp();

    /**
     * ========================================================
     * SAVE NEW APK
     * ========================================================
     *
     * StorageService bertanggung jawab terhadap:
     *
     * - validasi file
     * - generate filename
     * - penyimpanan file
     * - SHA-256
     * - metadata file
     */

    const uploaded =
      await StorageService.saveLandingAndroidApk(
        file,
      );

    try {
      /**
       * ======================================================
       * UPDATE DATABASE
       * ======================================================
       *
       * Setelah file berhasil disimpan,
       * update metadata database.
       */

      const updated =
        await landingPageRepository.updateAndroidApp(
          {
            fileName:
              uploaded.fileName,

            fileUrl:
              uploaded.fileUrl,

            mimeType:
              uploaded.mimeType,

            fileSize:
              uploaded.fileSize,

            sha256:
              uploaded.sha256,
          },
        );

      /**
       * ======================================================
       * DELETE OLD APK
       * ======================================================
       *
       * Database sudah menunjuk ke APK baru.
       * Sekarang APK lama aman untuk dihapus.
       */

      if (
        currentApp?.fileUrl &&
        currentApp.fileUrl !==
          uploaded.fileUrl
      ) {
        try {
          await StorageService.deleteLandingAndroidApk(
            currentApp.fileUrl,
          );
        } catch (cleanupError) {
          /**
           * Cleanup gagal tidak boleh membuat
           * upload APK baru dianggap gagal.
           *
           * File baru dan database sudah benar.
           * APK lama hanya menjadi cleanup task.
           */

          console.error(
            "Gagal menghapus APK Android lama:",
            cleanupError,
          );
        }
      }

      return updated;
    } catch (error) {
      /**
       * ======================================================
       * DATABASE FAILED
       * ======================================================
       *
       * Hapus APK baru supaya tidak meninggalkan
       * orphan file di filesystem.
       */

      try {
        await StorageService.deleteLandingAndroidApk(
          uploaded.fileUrl,
        );
      } catch (cleanupError) {
        console.error(
          "Gagal membersihkan APK Android baru:",
          cleanupError,
        );
      }

      throw error;
    }
  }
}

/**
 * ============================================================
 * SINGLETON SERVICE
 * ============================================================
 */

const landingPageService =
  new LandingPageService();

export default landingPageService;