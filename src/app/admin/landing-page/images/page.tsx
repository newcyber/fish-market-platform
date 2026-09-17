import { requireSuperAdmin } from "@/lib/auth/admin";

import LandingPageImagesForm from "@/components/admin/landing-page/LandingPageImagesForm";
import landingPageService from "@/repositories/landing-page/landing-page.service";

export default async function AdminLandingPageImages() {
  await requireSuperAdmin();

  const landingPage =
    await landingPageService.getLandingPage();

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Image Landing Page
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Kelola gambar yang digunakan pada Landing Page
          pusatikansegar.com.
        </p>
      </div>

      <LandingPageImagesForm
        images={landingPage.config.images}
      />
    </div>
  );
}