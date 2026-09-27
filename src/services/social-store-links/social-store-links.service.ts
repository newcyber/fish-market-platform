import socialStoreLinksRepository, {
  type UpdateSocialStoreLinksPayload,
} from "@/repositories/social-store-links/social-store-links.repository";

/**
 * ============================================================
 * SOCIAL & STORE LINKS SERVICE
 * ============================================================
 */

export interface UpdateSocialStoreLinksServicePayload {
  googlePlayUrl?: string | null;
  shopeeUrl?: string | null;
  tokopediaUrl?: string | null;
  tiktokUrl?: string | null;
  instagramUrl?: string | null;
}

class SocialStoreLinksService {
  /**
   * ==========================================================
   * GET LINKS
   * ==========================================================
   */

  async getLinks() {
    return socialStoreLinksRepository.getOrCreate();
  }

  /**
   * ==========================================================
   * UPDATE LINKS
   * ==========================================================
   */

  async updateLinks(
    payload: UpdateSocialStoreLinksServicePayload,
  ) {
    const normalized: UpdateSocialStoreLinksPayload = {
      googlePlayUrl:
        this.normalizeUrl(payload.googlePlayUrl),

      shopeeUrl:
        this.normalizeUrl(payload.shopeeUrl),

      tokopediaUrl:
        this.normalizeUrl(payload.tokopediaUrl),

      tiktokUrl:
        this.normalizeUrl(payload.tiktokUrl),

      instagramUrl:
        this.normalizeUrl(payload.instagramUrl),
    };

    return socialStoreLinksRepository.update(
      normalized,
    );
  }

  /**
   * ==========================================================
   * NORMALIZE URL
   * ==========================================================
   */

  private normalizeUrl(
    value?: string | null,
  ): string | null {
    const normalized =
      value?.trim() || "";

    if (!normalized) {
      return null;
    }

    try {
      const url = new URL(normalized);

      if (
        url.protocol !== "http:" &&
        url.protocol !== "https:"
      ) {
        throw new Error(
          "URL harus menggunakan HTTP atau HTTPS.",
        );
      }

      return url.toString();
    } catch {
      throw new Error(
        `URL tidak valid: ${normalized}`,
      );
    }
  }
}

const socialStoreLinksService =
  new SocialStoreLinksService();

export default socialStoreLinksService;