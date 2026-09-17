import { requireSuperAdmin } from "@/lib/auth/admin";

import LandingPageContentForm from "@/components/admin/landing-page/LandingPageContentForm";

import landingPageService from "@/repositories/landing-page/landing-page.service";

export default async function AdminLandingPage() {
  await requireSuperAdmin();

  const landingPage =
    await landingPageService.getLandingPage();

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Landing Page
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Kelola konten halaman marketing
          pusatikansegar.com.
        </p>
      </div>

      <LandingPageContentForm
        enabled={landingPage.enabled}
        config={landingPage.config}
      />

    </div>
  );
}