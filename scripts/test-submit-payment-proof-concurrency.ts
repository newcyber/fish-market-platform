import { existsSync } from "node:fs";
import path from "node:path";

import { prisma } from "@/lib/prisma";
import OrderService from "@/services/order/order.service";

const TEST_USER_ID =
  "436d434a-64d9-4abf-80ed-33179ef3e4ab";

const TEST_ADDRESS_ID =
  "43a5944e-8210-4836-9ce2-b8a96d46a497";

const TEST_ORDER_NOTE =
  "TEST 23 PAYMENT PROOF CONCURRENCY";

function assert(
  condition: unknown,
  message: string
): asserts condition {
  if (!condition) {
    throw new Error(
      `ASSERTION FAILED: ${message}`
    );
  }
}

function createTestFile(
  name: string,
  content: string
): File {
  return new File(
    [content],
    name,
    {
      type: "image/jpeg",
    }
  );
}

function publicPathToFilesystemPath(
  publicPath: string
): string {
  const normalized =
    publicPath.replace(/^\/+/, "");

  return path.join(
    process.cwd(),
    "public",
    normalized
  );
}

async function main() {
  let createdOrderId: string | null = null;

  const uploadedPaths = new Set<string>();

  try {
    console.log("");
    console.log(
      "============================================================"
    );
    console.log(
      "TEST 23 - PAYMENT PROOF CONCURRENCY"
    );
    console.log(
      "============================================================"
    );

    // ----------------------------------------------------------
    // 1. VALIDATE USER
    // ----------------------------------------------------------

    const user =
      await prisma.user.findFirst({
        where: {
          id: TEST_USER_ID,
          deletedAt: null,
          isActive: true,
        },
        select: {
          id: true,
          email: true,
        },
      });

    assert(
      user,
      `TEST_USER_ID tidak valid: ${TEST_USER_ID}`
    );

    console.log(
      "PASS: Test user valid."
    );

    console.log({
      userId: user.id,
      email: user.email,
    });

    // ----------------------------------------------------------
    // 2. VALIDATE ADDRESS
    // ----------------------------------------------------------

    const address =
      await prisma.address.findFirst({
        where: {
          id: TEST_ADDRESS_ID,
          userId: TEST_USER_ID,
          deletedAt: null,
        },
        select: {
          id: true,
        },
      });

    assert(
      address,
      `TEST_ADDRESS_ID tidak valid: ${TEST_ADDRESS_ID}`
    );

    console.log(
      "PASS: Address test valid."
    );

    // ----------------------------------------------------------
    // 3. CLEAN POSSIBLE PREVIOUS TEST ORDERS
    // ----------------------------------------------------------

    const previousOrders =
      await prisma.order.findMany({
        where: {
          userId: TEST_USER_ID,
          notes: TEST_ORDER_NOTE,
        },
        select: {
          id: true,
        },
      });

    if (previousOrders.length > 0) {
      const previousOrderIds =
        previousOrders.map(
          (order) => order.id
        );

      await prisma.paymentProof.deleteMany({
        where: {
          orderId: {
            in: previousOrderIds,
          },
        },
      });

      await prisma.notification.deleteMany({
        where: {
          orderId: {
            in: previousOrderIds,
          },
        },
      });

      await prisma.stockLedger.deleteMany({
        where: {
          orderId: {
            in: previousOrderIds,
          },
        },
      });

      await prisma.orderItem.deleteMany({
        where: {
          orderId: {
            in: previousOrderIds,
          },
        },
      });

      await prisma.order.deleteMany({
        where: {
          id: {
            in: previousOrderIds,
          },
        },
      });

      console.log(
        `PASS: ${previousOrderIds.length} fixture Order lama dibersihkan.`
      );
    }

    // ----------------------------------------------------------
    // 4. VALIDATE PAYMENT CHANNEL
    // ----------------------------------------------------------

    const paymentChannel =
      await prisma.paymentChannel.findFirst({
        where: {
          isActive: true,
        },
        orderBy: {
          sortOrder: "asc",
        },
        select: {
          id: true,
          type: true,
          name: true,
        },
      });

    assert(
      paymentChannel,
      "Tidak ada PaymentChannel aktif."
    );

    const paymentMethod =
      paymentChannel.type === "QRIS"
        ? "QRIS"
        : "BANK_TRANSFER";

    console.log({
      paymentChannel:
        paymentChannel.name,
      paymentChannelType:
        paymentChannel.type,
      paymentMethod,
    });

    console.log(
      "PASS: PaymentChannel aktif tersedia."
    );

    // ----------------------------------------------------------
    // 5. CREATE TEST ORDER
    // ----------------------------------------------------------

    const orderNumber =
      `TEST23-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)
        .toUpperCase()}`;

    const order =
      await prisma.order.create({
        data: {
          orderNumber,
          userId: TEST_USER_ID,
          addressId: TEST_ADDRESS_ID,

          status:
            "WAITING_PAYMENT",

          paymentStatus:
            "PENDING",

          paymentMethod,

          paymentChannelId:
            paymentChannel.id,

          subtotal: 10000,
          shippingCost: 0,
          total: 10000,

          notes:
            TEST_ORDER_NOTE,
        },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentStatus: true,
        },
      });

    createdOrderId = order.id;

    console.log({
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus:
        order.paymentStatus,
    });

    console.log(
      "PASS: Test Order berhasil dibuat."
    );

    // ----------------------------------------------------------
    // 6. CREATE TWO DIFFERENT FILES
    // ----------------------------------------------------------

    const fileA =
      createTestFile(
        "test23-payment-proof-A.jpg",
        "TEST23_PAYMENT_PROOF_A"
      );

    const fileB =
      createTestFile(
        "test23-payment-proof-B.jpg",
        "TEST23_PAYMENT_PROOF_B"
      );

    console.log(
      "PASS: Dua File test dibuat."
    );

    // ----------------------------------------------------------
    // 7. START TWO SUBMISSIONS CONCURRENTLY
    // ----------------------------------------------------------

    console.log("");
    console.log(
      "Menjalankan 2 submitPaymentProof secara bersamaan..."
    );

    const submitA =
      OrderService.submitPaymentProof(
        TEST_USER_ID,
        {
          orderId: order.id,
          file: fileA,
          bankName: "TEST BANK A",
          accountName: "TEST ACCOUNT A",
          accountNumber: "TEST123A",
        }
      );

    const submitB =
      OrderService.submitPaymentProof(
        TEST_USER_ID,
        {
          orderId: order.id,
          file: fileB,
          bankName: "TEST BANK B",
          accountName: "TEST ACCOUNT B",
          accountNumber: "TEST123B",
        }
      );

    const [resultA, resultB] =
      await Promise.all([
        submitA,
        submitB,
      ]);

    console.log("");
    console.log(
      "============================================================"
    );
    console.log(
      "SUBMIT RESULT"
    );
    console.log(
      "============================================================"
    );

    console.log("Submit A:");
    console.dir(resultA, {
      depth: 4,
    });

    console.log("");
    console.log("Submit B:");
    console.dir(resultB, {
      depth: 4,
    });

    // ----------------------------------------------------------
    // 8. COLLECT UPLOADED PATHS
    // ----------------------------------------------------------

    if (
      resultA.success &&
      resultA.data?.image
    ) {
      uploadedPaths.add(
        resultA.data.image
      );
    }

    if (
      resultB.success &&
      resultB.data?.image
    ) {
      uploadedPaths.add(
        resultB.data.image
      );
    }

    // ----------------------------------------------------------
    // 9. VERIFY RESULTS
    // ----------------------------------------------------------

    assert(
      resultA.success,
      "Submit A harus berhasil."
    );

    assert(
      resultB.success,
      "Submit B harus berhasil."
    );

    console.log(
      "PASS: Kedua submitPaymentProof berhasil."
    );

    // ----------------------------------------------------------
    // 10. READ FINAL PAYMENT PROOF
    // ----------------------------------------------------------

    const paymentProofs =
      await prisma.paymentProof.findMany({
        where: {
          orderId: order.id,
        },
      });

    assert(
      paymentProofs.length === 1,
      `Harus ada tepat 1 PaymentProof. Aktual=${paymentProofs.length}`
    );

    const finalProof =
      paymentProofs[0];

    assert(
      finalProof.image,
      "PaymentProof final harus memiliki image."
    );

    console.log({
      paymentProofId:
        finalProof.id,
      image:
        finalProof.image,
      status:
        finalProof.status,
      bankName:
        finalProof.bankName,
      accountName:
        finalProof.accountName,
      accountNumber:
        finalProof.accountNumber,
    });

    console.log(
      "PASS: Tepat 1 PaymentProof tersimpan."
    );

    // ----------------------------------------------------------
    // 11. VERIFY FINAL ORDER STATE
    // ----------------------------------------------------------

    const finalOrder =
      await prisma.order.findUnique({
        where: {
          id: order.id,
        },
        select: {
          status: true,
          paymentStatus: true,
        },
      });

    assert(
      finalOrder,
      "Test Order tidak ditemukan."
    );

    assert(
      finalOrder.status ===
        "WAITING_VERIFICATION",
      `Order status harus WAITING_VERIFICATION. Aktual=${finalOrder.status}`
    );

    assert(
      finalOrder.paymentStatus ===
        "PENDING",
      `PaymentStatus harus PENDING. Aktual=${finalOrder.paymentStatus}`
    );

    console.log(
      "PASS: Order menjadi WAITING_VERIFICATION."
    );

    console.log(
      "PASS: PaymentStatus tetap PENDING."
    );

    // ----------------------------------------------------------
    // 12. VERIFY FILE REFERENCED BY DB
    // ----------------------------------------------------------

    const finalFilePath =
      publicPathToFilesystemPath(
        finalProof.image
      );

    assert(
      existsSync(finalFilePath),
      `File yang direferensikan DB tidak ditemukan: ${finalFilePath}`
    );

    console.log(
      `PASS: File final DB masih ada: ${finalProof.image}`
    );

    // ----------------------------------------------------------
    // 13. VERIFY FILE LIFECYCLE
    // ----------------------------------------------------------

    console.log("");
    console.log(
      "============================================================"
    );
    console.log(
      "FILE LIFECYCLE"
    );
    console.log(
      "============================================================"
    );

    console.log(
      "Final DB image:",
      finalProof.image
    );

    const existingUploadedPaths =
      Array.from(uploadedPaths).filter(
        (uploadedPath) =>
          existsSync(
            publicPathToFilesystemPath(
              uploadedPath
            )
          )
      );

    for (const uploadedPath of uploadedPaths) {
      console.log(
        uploadedPath,
        existsSync(
          publicPathToFilesystemPath(
            uploadedPath
          )
        )
          ? "EXISTS"
          : "MISSING"
      );
    }

    assert(
      existingUploadedPaths.length === 1,
      `Concurrent upload tidak boleh meninggalkan orphan file. Expected exactly 1 existing file, actual=${existingUploadedPaths.length}`
    );

    assert(
      existingUploadedPaths[0] ===
        finalProof.image,
      `File yang tersisa harus sama dengan image PaymentProof final. DB=${finalProof.image}, existing=${existingUploadedPaths[0]}`
    );

    console.log(
      "PASS: Tepat 1 file upload yang tersisa."
    );

    console.log(
      "PASS: File yang tersisa sama dengan image PaymentProof final."
    );

    // ----------------------------------------------------------
    // SUCCESS
    // ----------------------------------------------------------

    console.log("");
    console.log(
      "============================================================"
    );
    console.log(
      "TEST 23 PASSED"
    );
    console.log(
      "============================================================"
    );

    console.log(
      "PASS: Concurrent payment proof menghasilkan 1 PaymentProof."
    );

    console.log(
      "PASS: Final PaymentProof image masih tersedia."
    );

    console.log(
      "PASS: Order berada pada WAITING_VERIFICATION."
    );
  } catch (error) {
    console.log("");
    console.log(
      "============================================================"
    );
    console.log(
      "TEST 23 FAILED"
    );
    console.log(
      "============================================================"
    );

    console.error(error);

    process.exitCode = 1;
  } finally {
    console.log("");
    console.log(
      "============================================================"
    );
    console.log(
      "TEST 23 CLEANUP"
    );
    console.log(
      "============================================================"
    );

    try {
      if (createdOrderId) {
        const paymentProof =
          await prisma.paymentProof.findUnique({
            where: {
              orderId:
                createdOrderId,
            },
            select: {
              image: true,
            },
          });

        if (paymentProof?.image) {
          uploadedPaths.add(
            paymentProof.image
          );
        }

        await prisma.paymentProof.deleteMany({
          where: {
            orderId:
              createdOrderId,
          },
        });

        await prisma.notification.deleteMany({
          where: {
            orderId:
              createdOrderId,
          },
        });

        await prisma.stockLedger.deleteMany({
          where: {
            orderId:
              createdOrderId,
          },
        });

        await prisma.orderItem.deleteMany({
          where: {
            orderId:
              createdOrderId,
          },
        });

        await prisma.order.deleteMany({
          where: {
            id:
              createdOrderId,
          },
        });

        console.log(
          "PASS: Test Order dihapus."
        );
      }

      for (const uploadedPath of uploadedPaths) {
        const filesystemPath =
          publicPathToFilesystemPath(
            uploadedPath
          );

        try {
          const storageDelete =
            (
              await import(
                "@/services/storage/storage.service"
              )
            ).default;

          await storageDelete.delete(
            uploadedPath
          );

          console.log(
            `PASS: File cleanup: ${uploadedPath}`
          );
        } catch (fileError) {
          console.error(
            `CLEANUP FILE ERROR: ${uploadedPath}`,
            fileError
          );

          process.exitCode = 1;
        }

        if (existsSync(filesystemPath)) {
          console.error(
            `WARNING: File masih ada setelah cleanup: ${filesystemPath}`
          );

          process.exitCode = 1;
        }
      }

      console.log(
        "PASS: Cleanup TEST 23 selesai."
      );
    } catch (cleanupError) {
      console.error(
        "CLEANUP ERROR:",
        cleanupError
      );

      process.exitCode = 1;
    }
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
