import { notFound } from "next/navigation";

import { MemberTierForm } from "@/components/admin/member-tiers/MemberTierForm";
import { AdminMemberTierService } from "@/services/member-tier/admin-member-tier.service";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditMemberTierPage({ params }: PageProps) {
  const { id } = await params;

  let tier;

  try {
    tier = await AdminMemberTierService.getById(id);
  } catch (error) {
    console.error("[ADMIN_MEMBER_TIER_EDIT_PAGE]", error);
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Member Tier</h1>
        <p className="mt-1 text-sm text-gray-500">
          Perbarui threshold dan benefit membership customer.
        </p>
      </div>

      <MemberTierForm
        mode="edit"
        initialData={{
          id: tier.id,
          name: tier.name,
          slug: tier.slug,
          minSpend: tier.minSpend.toNumber(),
          bonusPointsPercent: tier.bonusPointsPercent,
          freeShipping: tier.freeShipping,
          prioritySupport: tier.prioritySupport,
          exclusivePricing: tier.exclusivePricing,
          isActive: tier.isActive,
          sortOrder: tier.sortOrder,
        }}
      />
    </div>
  );
}
