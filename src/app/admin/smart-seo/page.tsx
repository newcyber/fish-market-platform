import { Sparkles } from "lucide-react";

import SmartSeoForm from "@/components/admin/smart-seo/SmartSeoForm";
import { requireSuperAdmin } from "@/lib/auth/admin";
import settingsService from "@/services/settings/settings.service";
import ProductService from "@/services/product/product.service";

export default async function SmartSeoPage() {
  await requireSuperAdmin();

  const settings = await settingsService.getSettings();

  const products = await ProductService.getProducts({
  published: true,
});

  const seoTitle =
    settings.seoTitle?.trim() ||
    settings.storeName?.trim() ||
    "Pisjo Market Platform";

  const seoDescription =
    settings.seoDescription?.trim() ||
    settings.storeDescription?.trim() ||
    "Modern Pisjo Marketplace";

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight">
              Smart SEO Setting
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Kelola SEO, optimasi mesin pencari, dan AI SEO Pisjo Market.
            </p>
          </div>
        </div>
      </div>

      <section className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">
            SEO Title
          </p>

          <p className="mt-3 line-clamp-2 font-semibold">
            {seoTitle}
          </p>

          <p className="mt-2 text-xs text-muted-foreground">
            {seoTitle.length}/60 karakter
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">
            SEO Description
          </p>

          <p className="mt-3 line-clamp-3 text-sm leading-6">
            {seoDescription}
          </p>

          <p className="mt-2 text-xs text-muted-foreground">
            {seoDescription.length}/160 karakter
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">
            Search Engine
          </p>

          <p className="mt-3 font-semibold">
            {settings.seoRobotsIndex &&
            settings.seoRobotsFollow
              ? "Index + Follow"
              : settings.seoRobotsIndex
                ? "Index"
                : "No Index"}
          </p>

          <p className="mt-2 text-xs text-muted-foreground">
            Kontrol robots halaman.
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">
            AI SEO
          </p>

          <p className="mt-3 font-semibold">
            {settings.seoAiEnabled
              ? "Aktif"
              : "Nonaktif"}
          </p>

          <p className="mt-2 text-xs text-muted-foreground">
            AI akan digunakan untuk saran optimasi SEO.
          </p>
        </div>
      </section>

<SmartSeoForm
  settings={{
    seoTitle: settings.seoTitle,
    seoDescription: settings.seoDescription,
    seoKeywords: settings.seoKeywords,
    seoCanonicalUrl: settings.seoCanonicalUrl,
    seoOgTitle: settings.seoOgTitle,
    seoOgDescription: settings.seoOgDescription,
    seoOgImage: settings.seoOgImage,
    seoTwitterCard: settings.seoTwitterCard,
    seoRobotsIndex: settings.seoRobotsIndex,
    seoRobotsFollow: settings.seoRobotsFollow,
    seoGoogleVerification:
      settings.seoGoogleVerification,
    seoAiEnabled: settings.seoAiEnabled,
  }}
  products={products.map((product) => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
  }))}
/>
    </div>
  );
}
