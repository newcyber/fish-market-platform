import { prisma } from "@/lib/prisma";

const LOCK_KEY =
  "flash-sale-row-visibility-test";

async function main() {
  console.log(
    "=== ADVISORY LOCK + ROW VISIBILITY TEST ==="
  );

  await prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`
        SELECT pg_advisory_xact_lock(
          hashtext(${LOCK_KEY})
        )
      `;

      await tx.$executeRaw`
        SELECT pg_sleep(3)
      `;

      await tx.$executeRaw`
        SELECT 1
      `;
    }
  );

  console.log(
    "=== BASIC TEST PASSED ==="
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });