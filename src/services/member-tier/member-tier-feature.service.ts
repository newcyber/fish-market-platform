import { prisma } from "@/lib/prisma";

/**
 * Global feature switch for the PISJO member tier system.
 *
 * OFF:
 * - customer tier calculation is disabled
 * - customer tier UI is hidden
 * - existing MemberTier data is preserved
 */
export async function isMemberTierEnabled(): Promise<boolean> {
  const settings = await prisma.storeSettings.findFirst({
    select: {
      tierSystemEnabled: true,
    },
  });

  return settings?.tierSystemEnabled ?? true;
}
