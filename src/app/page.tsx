import DynamicSiteFooter from "@/components/layout/DynamicSiteFooter";

import DynamicSiteHeader from "@/components/layout/DynamicSiteHeader";

import SharedHomePage from "@/components/customer/home/SharedHomePage";

export default async function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      <DynamicSiteHeader activePage="home" />

      <SharedHomePage mode="guest" />

      <DynamicSiteFooter />

    </main>
  );
}