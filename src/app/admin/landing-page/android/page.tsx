import { requireSuperAdmin } from "@/lib/auth/admin";

import LandingPageAndroidForm from "@/components/admin/landing-page/LandingPageAndroidForm";
import landingPageService from "@/repositories/landing-page/landing-page.service";

export default async function AdminLandingPageAndroid() {
  await requireSuperAdmin();

  const androidApp =
    await landingPageService.getOrCreateAndroidApp();

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Android App
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Kelola aplikasi Android Pisjo Market yang
          digunakan pada Landing Page.
        </p>
      </div>

      <LandingPageAndroidForm
        androidApp={androidApp}
      />
    </div>
  );
}