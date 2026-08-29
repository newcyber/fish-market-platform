import { prisma } from "@/lib/prisma";

import notificationRepository from "@/repositories/notification/notification.repository";

async function main() {
  console.log("==============================================");
  console.log(" RECIPIENT / CREATE MANY AUDIT");
  console.log("==============================================");

  const recipients =
    await prisma.user.findMany({
      where: {
        role: {
          in: [
            "ADMIN",
            "SUPER_ADMIN",
          ],
        },

        isActive: true,

        deletedAt: null,
      },

      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },

      orderBy: {
        email: "asc",
      },
    });

  console.log("");
  console.log(
    "RECIPIENTS:",
    recipients.length
  );

  console.dir(
    recipients,
    {
      depth: null,
    }
  );

  const testData =
    recipients.map(
      (user) => ({
        userId:
          user.id,

        title:
          "TEST RECIPIENT AUDIT",

        message:
          "Test recipient resolution - jangan dianggap notifikasi order nyata.",

        type:
          "SYSTEM" as const,

        href:
          null,
      })
    );

  const created =
    await notificationRepository.createManyAndReturn(
      testData
    );

  console.log("");
  console.log(
    "CREATED:",
    created.length
  );

  console.dir(
    created.map(
      (item) => ({
        id:
          item.id,

        userId:
          item.userId,

        title:
          item.title,

        type:
          item.type,
      })
    ),
    {
      depth: null,
    }
  );

  console.log("");
  console.log("==============================================");

  if (
    recipients.length ===
    created.length
  ) {
    console.log(
      "SUCCESS: Semua recipient berhasil dibuatkan notification."
    );
  } else {
    console.log(
      "ERROR: Jumlah notification tidak sama dengan recipient."
    );
  }

  console.log("==============================================");
}

main()
  .catch(
    (error: unknown) => {
      console.error(
        "[RECIPIENT_AUDIT_ERROR]",
        error
      );

      process.exitCode = 1;
    }
  )
  .finally(
    async () => {
      await prisma.$disconnect();
    }
  );
