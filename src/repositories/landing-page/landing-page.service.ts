import { Prisma } from "@prisma/client";

import settingsRepository from "@/repositories/settings/settings.repository";
import landingPageRepository from "./landing-page.repository";
import StorageService from "@/services/storage/storage.service";

import {
  normalizeLandingPageConfig,
} from "./landing-page.validation";

import type {
  LandingPageAndroidAppData,
  LandingPageConfig,
  LandingPageSeoAnalysisData,
  LandingPageSettingsData,
  PublicLandingPageData,
} from "./landing-page.types";

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
 * - normalisasi config JSON
 * - fallback config
 * - transformasi data repository
 * - business rules sederhana
 * - upload APK
 * - cleanup file APK lama
 *
 * ============================================================
 */

const LANDING_STORE_URL =
  "https://app.pusatikansegar.com";

function toInputJsonValue(
  value: unknown,
): Prisma.InputJsonValue {
  return JSON.parse(
    JSON.stringify(value),
  ) as Prisma.InputJsonValue;
}

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
   */

  async getPublicLandingPage(): Promise<PublicLandingPageData> {
    const [
      landingPage,
      storeSettings,
      androidApp,
    ] = await Promise.all([
      this.getLandingPage(),
      settingsRepository.getOrCreate(),
      landingPageRepository.getAndroidApp(),
    ]);

    return {
      enabled: landingPage.enabled,

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

      config: landingPage.config,

      androidApp,

      urls: {
        store: LANDING_STORE_URL,

        android:
          androidApp?.enabled &&
          androidApp.fileUrl
            ? androidApp.fileUrl
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
      enabled: data.enabled,

      config:
        data.config === undefined
          ? undefined
          : toInputJsonValue(data.config),
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
      id: analysis.id,
      landingPageSettingsId:
        analysis.landingPageSettingsId,
      score: analysis.score,
      analysis: analysis.analysis,
      recommendations:
        analysis.recommendations,
      source: analysis.source,
      createdAt: analysis.createdAt,
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
      score: data.score,
      analysis: toInputJsonValue(
        data.analysis,
      ),
      recommendations: toInputJsonValue(
        data.recommendations,
      ),
      source: data.source,
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

  async getOrCreateAndroidApp(): Promise<LandingPageAndroidAppData> {
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
    const currentApp =
      await landingPageRepository.getAndroidApp();

    /*
     * Simpan APK baru terlebih dahulu.
     *
     * StorageService bertanggung jawab terhadap:
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
      /*
       * Setelah file berhasil disimpan,
       * update metadata database.
       */
      const updated =
        await landingPageRepository.updateAndroidApp(
          {
            fileName: uploaded.fileName,
            fileUrl: uploaded.fileUrl,
            mimeType: uploaded.mimeType,
            fileSize: uploaded.fileSize,
            sha256: uploaded.sha256,
          },
        );

      /*
       * Database sudah menunjuk ke APK baru.
       *
       * Sekarang APK lama aman untuk dihapus.
       */
      if (
        currentApp?.fileUrl &&
        currentApp.fileUrl !== uploaded.fileUrl
      ) {
        try {
          await StorageService.deleteLandingAndroidApk(
            currentApp.fileUrl,
          );
        } catch (cleanupError) {
          /*
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
      /*
       * Database gagal.
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

const landingPageService =
  new LandingPageService();

export default landingPageService;