import { requireSuperAdmin } from "@/lib/auth/admin";

import SocialStoreLinksForm from "@/components/admin/social-store-links/SocialStoreLinksForm";
import socialStoreLinksService from "@/services/social-store-links/social-store-links.service";

export default async function SocialStoreLinksPage() {
  await requireSuperAdmin();

  const links =
    await socialStoreLinksService.getLinks();

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Social & Store Links
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Kelola link Google Play, marketplace, dan social media
          yang ditampilkan pada storefront Pisjo Market.
        </p>
      </div>

      <SocialStoreLinksForm
        initialValues={{
          googlePlayUrl:
            links.googlePlayUrl ?? "",

          shopeeUrl:
            links.shopeeUrl ?? "",

          tokopediaUrl:
            links.tokopediaUrl ?? "",

          tiktokUrl:
            links.tiktokUrl ?? "",

          instagramUrl:
            links.instagramUrl ?? "",
        }}
      />

    </div>
  );
}