import { prisma } from "@/lib/prisma";

const LOCK_KEY =
  "TEST-FLASH-SALE-ADVISORY-LOCK";

async function main() {
  console.log("=== ADVISORY LOCK TEST ===");

  const startedAt = Date.now();

  const transactionA =
    prisma.$transaction(
      async (tx) => {
        const backend =
          await tx.$queryRaw<
            Array<{
              pid: number;
              txid: bigint;
            }>
          >`
            SELECT
              pg_backend_pid() AS pid,
              txid_current() AS txid
          `;

        console.log(
          "[A] BEFORE LOCK",
          {
            pid:
              backend[0]?.pid,
            txid:
              backend[0]?.txid.toString(),
            elapsed:
              Date.now() - startedAt,
          }
        );

        await tx.$executeRaw`
          SELECT pg_advisory_xact_lock(
            hashtext(${LOCK_KEY})
          )
        `;

        console.log(
          "[A] LOCK ACQUIRED",
          {
            pid:
              backend[0]?.pid,
            txid:
              backend[0]?.txid.toString(),
            elapsed:
              Date.now() - startedAt,
          }
        );

        await tx.$executeRaw`
          SELECT pg_sleep(3)
        `;

        console.log(
          "[A] FINISH",
          {
            elapsed:
              Date.now() - startedAt,
          }
        );
      }
    );

  /**
   * Beri Transaction A kesempatan memperoleh lock
   * sebelum Transaction B dimulai.
   */
  await new Promise(
    (resolve) =>
      setTimeout(resolve, 200)
  );

  const transactionB =
    prisma.$transaction(
      async (tx) => {
        const backend =
          await tx.$queryRaw<
            Array<{
              pid: number;
              txid: bigint;
            }>
          >`
            SELECT
              pg_backend_pid() AS pid,
              txid_current() AS txid
          `;

        console.log(
          "[B] BEFORE LOCK",
          {
            pid:
              backend[0]?.pid,
            txid:
              backend[0]?.txid.toString(),
            elapsed:
              Date.now() - startedAt,
          }
        );

        await tx.$executeRaw`
          SELECT pg_advisory_xact_lock(
            hashtext(${LOCK_KEY})
          )
        `;

        console.log(
          "[B] LOCK ACQUIRED",
          {
            pid:
              backend[0]?.pid,
            txid:
              backend[0]?.txid.toString(),
            waitedMs:
              Date.now() - startedAt,
          }
        );

        console.log(
          "[B] FINISH",
          {
            elapsed:
              Date.now() - startedAt,
          }
        );
      }
    );

  await Promise.all([
    transactionA,
    transactionB,
  ]);

  console.log(
    "=== ADVISORY LOCK TEST PASSED ==="
  );
}

main()
  .catch((error) => {
    console.error(
      "=== ADVISORY LOCK TEST FAILED ==="
    );
    console.error(error);
    process.exit(1);
  })
  .finally(
    async () => {
      await prisma.$disconnect();
    }
  );