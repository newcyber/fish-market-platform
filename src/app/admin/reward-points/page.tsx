import { requireSuperAdmin } from "@/lib/auth/admin";
import rewardPointSettingsService from "@/services/reward-point/reward-point-settings.service";
import RewardPointSettingsForm from "@/components/admin/reward-point/RewardPointSettingsForm";

export default async function RewardPointPage() {
  await requireSuperAdmin();

  const settings =
    await rewardPointSettingsService.getSettings();

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Reward Point Calculator
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Atur reward pembelian berdasarkan berat produk dan bonus
          poin untuk customer baru yang berhasil memverifikasi akun.
        </p>
      </div>

      <RewardPointSettingsForm
        initialPointsPerKg={settings.pointsPerKg}
        initialSignupBonusPoints={settings.signupBonusPoints}
      />
    </div>
  );
}
