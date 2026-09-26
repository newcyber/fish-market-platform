type InformationalJsonLdProps = {
  type: "AboutPage" | "ContactPage";
  name: string;
  description: string;
  url: string;
  siteUrl: string;
  breadcrumbs: Array<{ name: string; url: string }>;
};

export default function InformationalJsonLd({
  type,
  name,
  description,
  url,
  siteUrl,
  breadcrumbs,
}: InformationalJsonLdProps) {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": type,
        "@id": `${url}#${type.toLowerCase()}`,
        name,
        description,
        url,
        isPartOf: { "@id": `${siteUrl}/#website` },
        about: { "@id": `${siteUrl}/#organization` },
        inLanguage: "id-ID",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbs.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: item.url,
        })),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
