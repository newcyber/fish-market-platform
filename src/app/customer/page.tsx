import SharedHomePage from "@/components/customer/home/SharedHomePage";

export const dynamic = "force-dynamic";

export default async function CustomerDashboardPage() {
  return (
    <SharedHomePage mode="customer" />
  );
}