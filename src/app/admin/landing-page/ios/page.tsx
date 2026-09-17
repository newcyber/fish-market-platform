import { requireSuperAdmin } from "@/lib/auth/admin";

import LandingPageIosForm from "@/components/admin/landing-page/LandingPageIosForm";
import landingPageService from "@/repositories/landing-page/landing-page.service";

export default async function AdminLandingPageIos() {
  await requireSuperAdmin();

  const iosApp =
    await landingPageService.getOrCreateIosApp();

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          iOS App
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Kelola aplikasi iOS Pisjo Market dan URL
          App Store yang digunakan pada Landing Page.
        </p>
      </div>

      <LandingPageIosForm
        iosApp={iosApp}
      />
    </div>
  );
}