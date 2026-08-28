import { NotificationType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import notificationRepository from "@/repositories/notification/notification.repository";

async function main() {
  console.log("");
  console.log("============================================================");
  console.log("NOTIFICATION USER ISOLATION TEST");
  console.log("============================================================");

  const users = await prisma.user.findMany({
    where: {
      role: {
        in: ["ADMIN", "SUPER_ADMIN"],
      },
      isActive: true,
      deletedAt: null,
    },
    select: {
      id: true,
      email: true,
      role: true,
    },
    orderBy: {
      role: "asc",
    },
    take: 2,
  });

  if (users.length < 2) {
    throw new Error(
      "TEST GAGAL: Minimal 2 user ADMIN/SUPER_ADMIN aktif diperlukan."
    );
  }

  const userA = users[0];
  const userB = users[1];

  console.log("");
  console.log("User A:", userA.email);
  console.log("User B:", userB.email);

  const notification = await notificationRepository.create({
    userId: userA.id,
    title: "TEST Notification Isolation",
    message: "Notification khusus User A.",
    type: NotificationType.SYSTEM,
    href: null,
  });

  console.log("");
  console.log("PASS: Notification test dibuat untuk User A.");

  try {
    // ========================================================
    // USER B CANNOT READ USER A NOTIFICATION
    // ========================================================

    const visibleToB =
      await notificationRepository.findById(
        userB.id,
        notification.id
      );

    if (visibleToB !== null) {
      throw new Error(
        "FAIL: User B dapat membaca notification milik User A."
      );
    }

    console.log(
      "PASS: User B tidak dapat membaca notification User A."
    );

    // ========================================================
    // USER A CAN READ OWN NOTIFICATION
    // ========================================================

    const visibleToA =
      await notificationRepository.findById(
        userA.id,
        notification.id
      );

    if (!visibleToA) {
      throw new Error(
        "FAIL: User A tidak dapat membaca notification miliknya sendiri."
      );
    }

    console.log(
      "PASS: User A dapat membaca notification miliknya."
    );

    // ========================================================
    // USER B CANNOT MARK USER A NOTIFICATION
    // ========================================================

    const markByB =
      await notificationRepository.markAsRead(
        userB.id,
        notification.id
      );

    if (markByB.count !== 0) {
      throw new Error(
        "FAIL: User B berhasil menandai notification User A."
      );
    }

    console.log(
      "PASS: User B tidak dapat mark-as-read notification User A."
    );

    // Pastikan masih unread.
    const afterRejectedMark =
      await notificationRepository.findById(
        userA.id,
        notification.id
      );

    if (!afterRejectedMark) {
      throw new Error(
        "FAIL: Notification test hilang setelah rejected mark."
      );
    }

    if (afterRejectedMark.isRead) {
      throw new Error(
        "FAIL: Notification User A berubah menjadi read oleh User B."
      );
    }

    console.log(
      "PASS: Notification tetap unread setelah percobaan User B."
    );

    // ========================================================
    // USER A CAN MARK OWN NOTIFICATION
    // ========================================================

    const markByA =
      await notificationRepository.markAsRead(
        userA.id,
        notification.id
      );

    if (markByA.count !== 1) {
      throw new Error(
        "FAIL: User A tidak dapat mark-as-read notification miliknya."
      );
    }

    console.log(
      "PASS: User A dapat mark-as-read notification miliknya."
    );

    // ========================================================
    // USER B CANNOT DELETE USER A NOTIFICATION
    // ========================================================

    const deleteByB =
      await notificationRepository.delete(
        userB.id,
        notification.id
      );

    if (deleteByB.count !== 0) {
      throw new Error(
        "FAIL: User B berhasil menghapus notification User A."
      );
    }

    console.log(
      "PASS: User B tidak dapat menghapus notification User A."
    );

    // ========================================================
    // USER A CAN DELETE OWN NOTIFICATION
    // ========================================================

    const deleteByA =
      await notificationRepository.delete(
        userA.id,
        notification.id
      );

    if (deleteByA.count !== 1) {
      throw new Error(
        "FAIL: User A tidak dapat menghapus notification miliknya."
      );
    }

    console.log(
      "PASS: User A dapat menghapus notification miliknya."
    );

    console.log("");
    console.log("============================================================");
    console.log("NOTIFICATION USER ISOLATION TEST PASSED");
    console.log("============================================================");
  } finally {
    // Safety cleanup jika test berhenti di tengah.
    await prisma.notification.deleteMany({
      where: {
        id: notification.id,
      },
    });
  }
}

main()
  .catch((error) => {
    console.error("");
    console.error("============================================================");
    console.error("NOTIFICATION USER ISOLATION TEST FAILED");
    console.error("============================================================");
    console.error(error);

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
