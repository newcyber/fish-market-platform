import type { SiteUrls } from "@/services/site/site-url.service";

import socialStoreLinksService from "@/services/social-store-links/social-store-links.service";

type NumericLike = number | { toString(): string };

type SiteJsonLdProps = {
  settings?: {
    storeName?: string | null;
    storeDescription?: string | null;
    siteLogo?: string | null;
    email?: string | null;
    whatsapp?: string | null;
    address?: string | null;
    city?: string | null;
    province?: string | null;
    postalCode?: string | null;
    latitude?: NumericLike | null;
    longitude?: NumericLike | null;
  };

  siteUrls?: SiteUrls;

  // Direct props are kept for the About/Contact pages.
  baseUrl?: string;
  storeName?: string | null;
  storeDescription?: string | null;
  logo?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
  latitude?: NumericLike | null;
  longitude?: NumericLike | null;

  pageType?: "WebPage" | "AboutPage" | "ContactPage";
  pageName?: string;
  pageDescription?: string;
  pathname?: string;
};

function normalizeWhatsapp(value?: string | null) {
  const digits = value?.replace(/\D/g, "") || "";

  if (!digits) {
    return null;
  }

  if (digits.startsWith("0")) {
    return `62${digits.slice(1)}`;
  }

  if (digits.startsWith("62")) {
    return digits;
  }

  return `62${digits}`;
}

function toNumber(value?: NumericLike | null) {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed =
    typeof value === "number" ? value : Number(value.toString());

  return Number.isFinite(parsed) ? parsed : null;
}

export default async function SiteJsonLd({
  settings,
  siteUrls,
  baseUrl,
  storeName: directStoreName,
  storeDescription: directStoreDescription,
  logo: directLogo,
  email: directEmail,
  whatsapp: directWhatsapp,
  address: directAddress,
  city: directCity,
  province: directProvince,
  postalCode: directPostalCode,
  latitude: directLatitude,
  longitude: directLongitude,
  pageType,
  pageName,
  pageDescription,
  pathname,
}: SiteJsonLdProps) {
  /**
   * ==========================================================
   * BASE URL
   * ==========================================================
   */

  const resolvedBaseUrl = (
    baseUrl ||
    siteUrls?.landingPageUrl ||
    ""
  ).replace(/\/+$/, "");

  /**
   * ==========================================================
   * STORE INFORMATION
   * ==========================================================
   */

  const name =
    directStoreName?.trim() ||
    settings?.storeName?.trim() ||
    "Pisjo Market";

  const description =
    directStoreDescription?.trim() ||
    settings?.storeDescription?.trim() ||
    undefined;

  const logo =
    directLogo?.trim() ||
    settings?.siteLogo?.trim() ||
    undefined;

  const email =
    directEmail?.trim() ||
    settings?.email?.trim() ||
    undefined;

  /**
   * ==========================================================
   * WHATSAPP
   * ==========================================================
   */

  const whatsapp = normalizeWhatsapp(
    directWhatsapp?.trim() || settings?.whatsapp,
  );

  /**
   * ==========================================================
   * ADDRESS
   * ==========================================================
   */

  const streetAddress =
    directAddress?.trim() ||
    settings?.address?.trim() ||
    undefined;

  const addressLocality =
    directCity?.trim() ||
    settings?.city?.trim() ||
    undefined;

  const addressRegion =
    directProvince?.trim() ||
    settings?.province?.trim() ||
    undefined;

  const postalCode =
    directPostalCode?.trim() ||
    settings?.postalCode?.trim() ||
    undefined;

  /**
   * ==========================================================
   * GEO LOCATION
   * ==========================================================
   */

  const latitude = toNumber(
    directLatitude !== undefined
      ? directLatitude
      : settings?.latitude,
  );

  const longitude = toNumber(
    directLongitude !== undefined
      ? directLongitude
      : settings?.longitude,
  );

  /**
   * ==========================================================
   * SOCIAL & STORE LINKS
   *
   * Sumber:
   * Admin > Social & Store Links
   *
   * URL yang kosong tidak dimasukkan ke sameAs.
   * ==========================================================
   */

  const socialStoreLinks =
    await socialStoreLinksService.getLinks();

  const sameAs = [
    socialStoreLinks.shopeeUrl,
    socialStoreLinks.tokopediaUrl,
    socialStoreLinks.tiktokUrl,
    socialStoreLinks.instagramUrl,
  ]
    .map((url) => url?.trim())
    .filter(
      (url): url is string =>
        Boolean(url),
  );

  /**
   * ==========================================================
   * ORGANIZATION
   * ==========================================================
   */

  const organization: Record<string, unknown> = {
    // Pisjo is a local retail business. Keep one entity/@id while
    // exposing the more specific LocalBusiness/Store types.
    "@type": ["Organization", "LocalBusiness", "Store"],

    "@id": `${resolvedBaseUrl}/#organization`,

    name,

    url: resolvedBaseUrl,

    ...(description
      ? {
          description,
        }
      : {}),

    ...(logo
      ? {
          logo,
          image: logo,
        }
      : {}),

    ...(email
      ? {
          email,
        }
      : {}),

    /**
     * Social / marketplace identity.
     *
     * Google dapat menggunakan sameAs
     * untuk memahami profil resmi yang
     * merepresentasikan organisasi yang sama.
     */
    ...(sameAs.length > 0
      ? {
          sameAs,
        }
      : {}),

    ...(whatsapp
      ? {
          telephone: `+${whatsapp}`,
        }
      : {}),

    ...(email || whatsapp
      ? {
          contactPoint: {
            "@type": "ContactPoint",

            ...(email
              ? {
                  email,
                }
              : {}),

            ...(whatsapp
              ? {
                  telephone: `+${whatsapp}`,
                }
              : {}),

            contactType: "customer service",

            availableLanguage: ["id"],
          },
        }
      : {}),

    ...(streetAddress ||
    addressLocality ||
    addressRegion ||
    postalCode
      ? {
          address: {
            "@type": "PostalAddress",

            ...(streetAddress
              ? {
                  streetAddress,
                }
              : {}),

            ...(addressLocality
              ? {
                  addressLocality,
                }
              : {}),

            ...(addressRegion
              ? {
                  addressRegion,
                }
              : {}),

            ...(postalCode
              ? {
                  postalCode,
                }
              : {}),

            addressCountry: "ID",
          },
        }
      : {}),

    ...(latitude !== null && longitude !== null
      ? {
          geo: {
            "@type": "GeoCoordinates",

            latitude,

            longitude,
          },
        }
      : {}),
  };

  /**
   * ==========================================================
   * WEBSITE
   * ==========================================================
   */

  const website = {
    "@type": "WebSite",

    "@id": `${resolvedBaseUrl}/#website`,

    url: resolvedBaseUrl,

    name,

    publisher: {
      "@id": `${resolvedBaseUrl}/#organization`,
    },

    inLanguage: "id-ID",
  };

  /**
   * ==========================================================
   * GRAPH
   * ==========================================================
   */

  const graphItems: Record<string, unknown>[] = [
    organization,
    website,
  ];

  /**
   * ==========================================================
   * OPTIONAL PAGE JSON-LD
   *
   * Digunakan untuk About / Contact pages.
   * ==========================================================
   */

  if (pageType && pageName && pathname) {
    const pageUrl =
      `${resolvedBaseUrl}${pathname}`;

    /**
     * WebPage / AboutPage / ContactPage
     */

    graphItems.push({
      "@type": pageType,

      "@id": `${pageUrl}#webpage`,

      url: pageUrl,

      name: pageName,

      ...(pageDescription
        ? {
            description: pageDescription,
          }
        : {}),

      isPartOf: {
        "@id": `${resolvedBaseUrl}/#website`,
      },

      about: {
        "@id": `${resolvedBaseUrl}/#organization`,
      },

      publisher: {
        "@id": `${resolvedBaseUrl}/#organization`,
      },

      inLanguage: "id-ID",
    });

    /**
     * BreadcrumbList
     */

    graphItems.push({
      "@type": "BreadcrumbList",

      "@id": `${pageUrl}#breadcrumb`,

      itemListElement: [
        {
          "@type": "ListItem",

          position: 1,

          name: "Beranda",

          item: resolvedBaseUrl,
        },

        {
          "@type": "ListItem",

          position: 2,

          name: pageName
            .split("|")[0]
            .trim(),

          item: pageUrl,
        },
      ],
    });
  }

  /**
   * ==========================================================
   * FINAL JSON-LD GRAPH
   * ==========================================================
   */

  const graph = {
    "@context": "https://schema.org",

    "@graph": graphItems,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(graph),
      }}
    />
  );
}