type StoreJsonLdProps = {
  storeName: string;
  storeDescription?: string | null;
  siteUrl: string;
  logoUrl?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  pageType: "about" | "contact";
  pageUrl: string;
};

function normalizeWhatsappNumber(value?: string | null) {
  const number = value?.replace(/\D/g, "") || "";

  if (!number) {
    return "";
  }

  if (number.startsWith("0")) {
    return `62${number.slice(1)}`;
  }

  if (number.startsWith("62")) {
    return number;
  }

  return `62${number}`;
}

export default function StoreJsonLd({
  storeName,
  storeDescription,
  siteUrl,
  logoUrl,
  email,
  whatsapp,
  address,
  city,
  province,
  postalCode,
  latitude,
  longitude,
  pageType,
  pageUrl,
}: StoreJsonLdProps) {
  const normalizedSiteUrl = siteUrl.replace(/\/+$/, "");
  const normalizedPageUrl = pageUrl.replace(/\/+$/, "");
  const whatsappNumber = normalizeWhatsappNumber(whatsapp);

  const addressParts = [
    address,
    city,
    province,
    postalCode,
  ].filter((value): value is string => Boolean(value?.trim()));

  const organization: Record<string, unknown> = {
    "@type": "Organization",
    "@id": `${normalizedSiteUrl}/#organization`,
    name: storeName,
    url: normalizedSiteUrl,
    description: storeDescription || undefined,
    logo: logoUrl || undefined,
  };

  if (email) {
    organization.email = email;
  }

  if (whatsappNumber) {
    organization.contactPoint = {
      "@type": "ContactPoint",
      contactType: "customer service",
      telephone: `+${whatsappNumber}`,
      availableLanguage: ["id", "Indonesian"],
    };
  }

  if (addressParts.length > 0) {
    organization.address = {
      "@type": "PostalAddress",
      streetAddress: address?.trim() || undefined,
      addressLocality: city?.trim() || undefined,
      addressRegion: province?.trim() || undefined,
      postalCode: postalCode?.trim() || undefined,
      addressCountry: "ID",
    };
  }

  if (latitude && longitude) {
    organization.location = {
      "@type": "Place",
      geo: {
        "@type": "GeoCoordinates",
        latitude,
        longitude,
      },
    };
  }

  const pageSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": pageType === "about" ? "AboutPage" : "ContactPage",
        "@id": `${normalizedPageUrl}#webpage`,
        url: normalizedPageUrl,
        name: pageType === "about"
          ? `Tentang Kami | ${storeName}`
          : `Kontak Kami | ${storeName}`,
        isPartOf: {
          "@type": "WebSite",
          "@id": `${normalizedSiteUrl}/#website`,
          url: normalizedSiteUrl,
          name: storeName,
        },
        about: {
          "@id": `${normalizedSiteUrl}/#organization`,
        },
        publisher: {
          "@id": `${normalizedSiteUrl}/#organization`,
        },
      },
      organization,
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(pageSchema),
      }}
    />
  );
}
