import { prisma } from "@/lib/prisma";

/**
 * ============================================================
 * SOCIAL & STORE LINKS REPOSITORY
 * ============================================================
 *
 * Data access layer untuk konfigurasi:
 *
 * - Google Play
 * - Shopee
 * - Tokopedia
 * - TikTok
 * - Instagram
 *
 * ============================================================
 */

export interface UpdateSocialStoreLinksPayload {
  googlePlayUrl?: string | null;
  shopeeUrl?: string | null;
  tokopediaUrl?: string | null;
  tiktokUrl?: string | null;
  instagramUrl?: string | null;
}

class SocialStoreLinksRepository {
  /**
   * ==========================================================
   * GET OR CREATE
   * ==========================================================
   */

  async getOrCreate() {
    const existing =
      await prisma.socialStoreLinks.findFirst();

    if (existing) {
      return existing;
    }

    return prisma.socialStoreLinks.create({
      data: {},
    });
  }

  /**
   * ==========================================================
   * UPDATE
   * ==========================================================
   */

  async update(
    payload: UpdateSocialStoreLinksPayload,
  ) {
    const current =
      await this.getOrCreate();

    return prisma.socialStoreLinks.update({
      where: {
        id: current.id,
      },
      data: payload,
    });
  }
}

const socialStoreLinksRepository =
  new SocialStoreLinksRepository();

export default socialStoreLinksRepository;