import settingsService from "@/services/settings/settings.service";

const DEFAULT_LANDING_PAGE_URL = "https://pusatikansegar.com";
const DEFAULT_STOREFRONT_URL = "https://app.pusatikansegar.com";

export interface SiteUrls {
  landingPageUrl: string;
  storefrontUrl: string;
  landingHost: string;
  landingHosts: string[];
  storefrontHost: string;
}

function normalizeUrl(
  value: string | null | undefined,
  fallback: string,
): string {
  const raw = value?.trim() || fallback;

  try {
    const url = new URL(raw);

    if (!["http:", "https:"].includes(url.protocol)) {
      return fallback;
    }

    if (url.username || url.password) {
      return fallback;
    }

    if (url.search || url.hash) {
      return fallback;
    }

    return url.toString().replace(/\/$/, "");
  } catch {
    return fallback;
  }
}

export async function getSiteUrls(): Promise<SiteUrls> {
  const settings = await settingsService.getSettings();

  const landingPageUrl = normalizeUrl(
    settings.landingPageUrl,
    DEFAULT_LANDING_PAGE_URL,
  );

  const storefrontUrl = normalizeUrl(
    settings.storefrontUrl,
    DEFAULT_STOREFRONT_URL,
  );

  const landingHost = new URL(landingPageUrl).hostname
    .trim()
    .toLowerCase();

  const storefrontHost = new URL(storefrontUrl).hostname
    .trim()
    .toLowerCase();

  const baseLandingHost = landingHost.replace(/^www\./, "");

  return {
    landingPageUrl,
    storefrontUrl,
    landingHost,
    landingHosts: [
      baseLandingHost,
      `www.${baseLandingHost}`,
    ],
    storefrontHost,
  };
}