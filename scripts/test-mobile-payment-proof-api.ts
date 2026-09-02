import { existsSync } from "node:fs";
import path from "node:path";

import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  MobileAuthService,
} from "@/services/auth/mobile-auth.service";

const TEST_PASSWORD =
  "MobilePaymentProofTest123!";

const TEST_ORDER_PREFIX =
  "TEST27-MOBILE-PAYMENT-PROOF";

const BASE_URL =
  process.env.TEST_BASE_URL ??
  "http://localhost:3000";

let testUserId: string | null = null;
let otherUserId: string | null = null;

let testAddressId: string | null = null;
let otherAddressId: string | null = null;

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

/**
 * ============================================================
 * TEST FIXTURE USER
 * ============================================================
 */

async function createTestUser(
  suffix: string
) {
  const password =
    await bcrypt.hash(
      TEST_PASSWORD,
      10
    );

  return prisma.user.create({
    data: {
      name:
        `Mobile Payment Proof Test ${suffix}`,

      email:
        `mobile-payment-proof-${suffix.toLowerCase()}-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}@fishmarket.test`,

      password,

      role:
        Role.CUSTOMER,

      isActive:
        true,

      emailVerified:
        new Date(),
    },
  });
}

/**
 * ============================================================
 * TEST FIXTURE ADDRESS
 * ============================================================
 */

async function createTestAddress(
  userId: string,
  suffix: string
) {
  return prisma.address.create({
    data: {
      userId,

      receiverName:
        `Payment Proof Test ${suffix}`,

      receiverPhone:
        "081234567890",

      province:
        "Jawa Timur",

      city:
        "Surabaya",

      district:
        "Tegalsari",

      village:
        "Kedungdoro",

      postalCode:
        "60251",

      fullAddress:
        `Jl. Test Mobile Payment Proof ${suffix}`,

      latitude:
        -7.257472,

      longitude:
        112.752090,

      label:
        "Rumah",

      isDefault:
        true,
    },
  });
}

/**
 * ============================================================
 * FILE HELPERS
 * ============================================================
 */

function createTestFile(
  name: string,
  content: string,
  type = "image/jpeg"
): File {
  return new File(
    [content],
    name,
    {
      type,
    }
  );
}

function publicPathToFilesystemPath(
  publicPath: string
): string {
  return path.join(
    process.cwd(),
    "public",
    publicPath.replace(/^\/+/, "")
  );
}

/**
 * ============================================================
 * ORDER FIXTURE
 * ============================================================
 */

async function createOrder(
  userId: string,
  addressId: string,
  suffix: string,
  status:
    | "WAITING_PAYMENT"
    | "COMPLETED"
    | "CANCELLED",
  paymentStatus:
    | "PENDING"
    | "VERIFIED"
) {
  const paymentChannel =
    await prisma.paymentChannel.findFirst({
      where: {
        isActive:
          true,
      },

      orderBy: {
        sortOrder:
          "asc",
      },

      select: {
        id: true,
        type: true,
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

  return prisma.order.create({
    data: {
      orderNumber:
        `${TEST_ORDER_PREFIX}-${suffix}-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)
          .toUpperCase()}`,

      userId,

      addressId,

      status,

      paymentStatus,

      paymentMethod,

      paymentChannelId:
        paymentChannel.id,

      subtotal:
        10000,

      shippingCost:
        0,

      total:
        10000,

      notes:
        `${TEST_ORDER_PREFIX}-${suffix}`,
    },

    select: {
      id: true,
      orderNumber: true,
      status: true,
      paymentStatus: true,
    },
  });
}

/**
 * ============================================================
 * ORDER CLEANUP
 * ============================================================
 */

async function cleanupOrder(
  orderId: string,
  uploadedPaths: Set<string>
) {
  const paymentProof =
    await prisma.paymentProof.findUnique({
      where: {
        orderId,
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
      orderId,
    },
  });

  await prisma.notification.deleteMany({
    where: {
      orderId,
    },
  });

  await prisma.stockLedger.deleteMany({
    where: {
      orderId,
    },
  });

  await prisma.orderItem.deleteMany({
    where: {
      orderId,
    },
  });

  await prisma.order.deleteMany({
    where: {
      id: orderId,
    },
  });
}

/**
 * ============================================================
 * PAYMENT PROOF REQUEST
 * ============================================================
 */

async function requestPaymentProof(
  accessToken: string,
  orderId: string,
  file?: File,
  fields?: {
    bankName?: string;
    accountName?: string;
    accountNumber?: string;
  }
) {
  const formData =
    new FormData();

  if (file) {
    formData.append(
      "file",
      file
    );
  }

  if (
    fields?.bankName !==
    undefined
  ) {
    formData.append(
      "bankName",
      fields.bankName
    );
  }

  if (
    fields?.accountName !==
    undefined
  ) {
    formData.append(
      "accountName",
      fields.accountName
    );
  }

  if (
    fields?.accountNumber !==
    undefined
  ) {
    formData.append(
      "accountNumber",
      fields.accountNumber
    );
  }

  const response =
    await fetch(
      `${BASE_URL}/api/mobile/orders/${encodeURIComponent(
        orderId
      )}/payment-proof`,
      {
        method:
          "POST",

        headers: {
          Authorization:
            `Bearer ${accessToken}`,
        },

        body:
          formData,
      }
    );

  const json =
    await response.json();

  return {
    response,
    json,
  };
}

/**
 * ============================================================
 * MAIN TEST
 * ============================================================
 */

async function main() {
  const uploadedPaths =
    new Set<string>();

  const createdOrderIds =
    new Set<string>();

  try {
    console.log("");
    console.log(
      "============================================================"
    );

    console.log(
      "TEST 27 - MOBILE PAYMENT PROOF API"
    );

    console.log(
      "============================================================"
    );

    /**
     * ========================================================
     * FIXTURE
     * ========================================================
     */

    console.log("");
    console.log(
      "FIXTURE - Creating test users and addresses"
    );

    const user =
      await createTestUser(
        "A"
      );

    testUserId =
      user.id;

    const address =
      await createTestAddress(
        user.id,
        "A"
      );

    testAddressId =
      address.id;

    const otherUser =
      await createTestUser(
        "B"
      );

    otherUserId =
      otherUser.id;

    const otherAddress =
      await createTestAddress(
        otherUser.id,
        "B"
      );

    otherAddressId =
      otherAddress.id;

    console.log(
      `PASS: Test user A = ${user.id}`
    );

    console.log(
      `PASS: Test address A = ${address.id}`
    );

    console.log(
      `PASS: Test user B = ${otherUser.id}`
    );

    console.log(
      `PASS: Test address B = ${otherAddress.id}`
    );

    /**
     * ========================================================
     * AUTH
     * ========================================================
     */

    console.log("");
    console.log(
      "AUTH - MobileAuthService.login()"
    );

    const auth =
      await MobileAuthService.login({
        email:
          user.email,

        password:
          TEST_PASSWORD,
      });

    assert(
      auth.user.id ===
        user.id,
      "Authenticated user ID tidak sesuai."
    );

    assert(
      auth.user.role ===
        Role.CUSTOMER,
      "Authenticated role bukan CUSTOMER."
    );

    assert(
      auth.accessToken.length >
        0,
      "Access token tidak dibuat."
    );

    const accessToken =
      auth.accessToken;

    console.log(
      "PASS: Mobile access token berhasil dibuat."
    );

    /**
     * ========================================================
     * 27A - NO AUTHORIZATION
     * ========================================================
     */

    console.log("");
    console.log(
      "TEST 27A - Missing Authorization"
    );

    const orderA =
      await createOrder(
        user.id,
        address.id,
        "A",
        "WAITING_PAYMENT",
        "PENDING"
      );

    createdOrderIds.add(
      orderA.id
    );

    const noAuthForm =
      new FormData();

    noAuthForm.append(
      "file",
      createTestFile(
        "test27-no-auth.jpg",
        "TEST27_NO_AUTH"
      )
    );

    const noAuthResponse =
      await fetch(
        `${BASE_URL}/api/mobile/orders/${orderA.id}/payment-proof`,
        {
          method:
            "POST",

          body:
            noAuthForm,
        }
      );

    const noAuthJson =
      await noAuthResponse.json();

    assert(
      noAuthResponse.status ===
        401,
      `27A expected 401, actual=${noAuthResponse.status}`
    );

    assert(
      noAuthJson.code ===
        "MISSING_AUTHORIZATION",
      `27A unexpected code=${noAuthJson.code}`
    );

    console.log(
      "PASS 27A - Missing Authorization."
    );

    /**
     * ========================================================
     * 27B - INVALID TOKEN
     * ========================================================
     */

    console.log("");
    console.log(
      "TEST 27B - Invalid Access Token"
    );

    const invalidToken =
      await requestPaymentProof(
        "invalid-access-token",
        orderA.id,
        createTestFile(
          "test27-invalid-token.jpg",
          "TEST27_INVALID_TOKEN"
        )
      );

    assert(
      invalidToken.response.status ===
        401,
      `27B expected 401, actual=${invalidToken.response.status}`
    );

    assert(
      invalidToken.json.code ===
        "INVALID_ACCESS_TOKEN",
      `27B unexpected code=${invalidToken.json.code}`
    );

    console.log(
      "PASS 27B - Invalid access token."
    );

    /**
     * ========================================================
     * 27C - NONEXISTENT ORDER
     * ========================================================
     */

    console.log("");
    console.log(
      "TEST 27C - Nonexistent Order"
    );

    const invalidOrderId =
      "00000000-0000-0000-0000-000000000000";

    const invalidOrder =
      await requestPaymentProof(
        accessToken,
        invalidOrderId,
        createTestFile(
          "test27-invalid-order.jpg",
          "TEST27_INVALID_ORDER"
        )
      );

    assert(
      invalidOrder.response.status ===
        404,
      `27C expected 404, actual=${invalidOrder.response.status}`
    );

    assert(
      invalidOrder.json.code ===
        "ORDER_NOT_FOUND",
      `27C unexpected code=${invalidOrder.json.code}`
    );

    console.log(
      "PASS 27C - Nonexistent order rejected."
    );

    /**
     * ========================================================
     * 27D - MISSING FILE
     * ========================================================
     */

    console.log("");
    console.log(
      "TEST 27D - Missing File"
    );

    const missingFile =
      await requestPaymentProof(
        accessToken,
        orderA.id
      );

    assert(
      missingFile.response.status ===
        400,
      `27D expected 400, actual=${missingFile.response.status}`
    );

    assert(
      missingFile.json.code ===
        "PAYMENT_PROOF_REQUIRED",
      `27D unexpected code=${missingFile.json.code}`
    );

    console.log(
      "PASS 27D - Missing payment proof file."
    );

    /**
     * ========================================================
     * 27E - INVALID MIME
     * ========================================================
     */

    console.log("");
    console.log(
      "TEST 27E - Invalid MIME"
    );

    const invalidMime =
      await requestPaymentProof(
        accessToken,
        orderA.id,
        createTestFile(
          "test27-invalid.txt",
          "TEST27_INVALID_MIME",
          "text/plain"
        )
      );

    assert(
      invalidMime.response.status ===
        400,
      `27E expected 400, actual=${invalidMime.response.status}`
    );

    assert(
      invalidMime.json.code ===
        "PAYMENT_PROOF_INVALID_FILE",
      `27E unexpected code=${invalidMime.json.code}`
    );

    console.log(
      "PASS 27E - Invalid MIME type."
    );

    /**
     * ========================================================
     * 27F - ZERO BYTE
     * ========================================================
     */

    console.log("");
    console.log(
      "TEST 27F - Zero Byte File"
    );

    const emptyFile =
      createTestFile(
        "test27-empty.jpg",
        ""
      );

    const emptyResponse =
      await requestPaymentProof(
        accessToken,
        orderA.id,
        emptyFile
      );

    assert(
      emptyResponse.response.status ===
        400,
      `27F expected 400, actual=${emptyResponse.response.status}`
    );

    assert(
      emptyResponse.json.code ===
        "PAYMENT_PROOF_INVALID_FILE",
      `27F unexpected code=${emptyResponse.json.code}`
    );

    console.log(
      "PASS 27F - Zero-byte file."
    );

    /**
     * ========================================================
     * 27G - FILE TOO LARGE
     * ========================================================
     */

    console.log("");
    console.log(
      "TEST 27G - File > 5 MB"
    );

    const oversizedContent =
      new Uint8Array(
        5 * 1024 * 1024 + 1
      );

    const oversizedFile =
      new File(
        [oversizedContent],
        "test27-large.jpg",
        {
          type:
            "image/jpeg",
        }
      );

    const oversizedResponse =
      await requestPaymentProof(
        accessToken,
        orderA.id,
        oversizedFile
      );

    assert(
      oversizedResponse.response.status ===
        400,
      `27G expected 400, actual=${oversizedResponse.response.status}`
    );

    assert(
      oversizedResponse.json.code ===
        "PAYMENT_PROOF_FILE_TOO_LARGE",
      `27G unexpected code=${oversizedResponse.json.code}`
    );

    console.log(
      "PASS 27G - File > 5 MB."
    );

    /**
     * ========================================================
     * 27H - OTHER USER OWNERSHIP
     * ========================================================
     */

    console.log("");
    console.log(
      "TEST 27H - Foreign Order Ownership"
    );

    const foreignOrder =
      await createOrder(
        otherUser.id,
        otherAddress.id,
        "FOREIGN",
        "WAITING_PAYMENT",
        "PENDING"
      );

    createdOrderIds.add(
      foreignOrder.id
    );

    const foreignResponse =
      await requestPaymentProof(
        accessToken,
        foreignOrder.id,
        createTestFile(
          "test27-foreign.jpg",
          "TEST27_FOREIGN"
        )
      );

    assert(
      foreignResponse.response.status ===
        404,
      `27H expected 404, actual=${foreignResponse.response.status}`
    );

    assert(
      foreignResponse.json.code ===
        "ORDER_NOT_FOUND",
      `27H unexpected code=${foreignResponse.json.code}`
    );

    console.log(
      "PASS 27H - Foreign order rejected."
    );

    /**
     * ========================================================
     * 27I - COMPLETED ORDER
     * ========================================================
     */

    console.log("");
    console.log(
      "TEST 27I - Completed Order"
    );

    const completedOrder =
      await createOrder(
        user.id,
        address.id,
        "COMPLETED",
        "COMPLETED",
        "VERIFIED"
      );

    createdOrderIds.add(
      completedOrder.id
    );

    const completedResponse =
      await requestPaymentProof(
        accessToken,
        completedOrder.id,
        createTestFile(
          "test27-completed.jpg",
          "TEST27_COMPLETED"
        )
      );

    assert(
      completedResponse.response.status ===
        400,
      `27I expected 400, actual=${completedResponse.response.status}`
    );

    assert(
      completedResponse.json.code ===
        "PAYMENT_PROOF_NOT_ALLOWED",
      `27I unexpected code=${completedResponse.json.code}`
    );

    console.log(
      "PASS 27I - COMPLETED rejected."
    );

    /**
     * ========================================================
     * 27J - CANCELLED ORDER
     * ========================================================
     */

    console.log("");
    console.log(
      "TEST 27J - Cancelled Order"
    );

    const cancelledOrder =
      await createOrder(
        user.id,
        address.id,
        "CANCELLED",
        "CANCELLED",
        "PENDING"
      );

    createdOrderIds.add(
      cancelledOrder.id
    );

    const cancelledResponse =
      await requestPaymentProof(
        accessToken,
        cancelledOrder.id,
        createTestFile(
          "test27-cancelled.jpg",
          "TEST27_CANCELLED"
        )
      );

    assert(
      cancelledResponse.response.status ===
        400,
      `27J expected 400, actual=${cancelledResponse.response.status}`
    );

    assert(
      cancelledResponse.json.code ===
        "PAYMENT_PROOF_NOT_ALLOWED",
      `27J unexpected code=${cancelledResponse.json.code}`
    );

    console.log(
      "PASS 27J - CANCELLED rejected."
    );

    /**
     * ========================================================
     * 27K - PAYMENT ALREADY VERIFIED
     * ========================================================
     */

    console.log("");
    console.log(
      "TEST 27K - Already Verified Payment"
    );

    const verifiedOrder =
      await createOrder(
        user.id,
        address.id,
        "VERIFIED",
        "WAITING_PAYMENT",
        "VERIFIED"
      );

    createdOrderIds.add(
      verifiedOrder.id
    );

    const verifiedResponse =
      await requestPaymentProof(
        accessToken,
        verifiedOrder.id,
        createTestFile(
          "test27-verified.jpg",
          "TEST27_VERIFIED"
        )
      );

    assert(
      verifiedResponse.response.status ===
        400,
      `27K expected 400, actual=${verifiedResponse.response.status}`
    );

    assert(
      verifiedResponse.json.code ===
        "PAYMENT_ALREADY_VERIFIED",
      `27K unexpected code=${verifiedResponse.json.code}`
    );

    console.log(
      "PASS 27K - VERIFIED payment rejected."
    );

    /**
     * ========================================================
     * 27L - FIRST SUCCESSFUL UPLOAD
     * ========================================================
     */

    console.log("");
    console.log(
      "TEST 27L - Successful First Upload"
    );

    const successFile =
      createTestFile(
        "test27-success.jpg",
        "TEST27_SUCCESS"
      );

    const successResponse =
      await requestPaymentProof(
        accessToken,
        orderA.id,
        successFile,
        {
          bankName:
            "TEST BANK 27",

          accountName:
            "TEST ACCOUNT 27",

          accountNumber:
            "TEST12327",
        }
      );

    assert(
      successResponse.response.status ===
        200,
      `27L expected 200, actual=${successResponse.response.status}`
    );

    assert(
      successResponse.json.success ===
        true,
      "27L response success harus true."
    );

    const returnedOrder =
      successResponse.json
        .data
        ?.order;

    assert(
      returnedOrder,
      "27L response order tidak tersedia."
    );

    assert(
      returnedOrder.status ===
        "WAITING_VERIFICATION",
      `27L order status unexpected=${returnedOrder.status}`
    );

    assert(
      returnedOrder.paymentStatus ===
        "PENDING",
      `27L payment status unexpected=${returnedOrder.paymentStatus}`
    );

    const dbProof =
      await prisma.paymentProof.findUnique({
        where: {
          orderId:
            orderA.id,
        },
      });

    assert(
      dbProof,
      "27L PaymentProof tidak tersimpan."
    );

    assert(
      dbProof.image,
      "27L PaymentProof image kosong."
    );

    uploadedPaths.add(
      dbProof.image
    );

    assert(
      dbProof.status ===
        "PENDING",
      `27L proof status unexpected=${dbProof.status}`
    );

    assert(
      dbProof.bankName ===
        "TEST BANK 27",
      "27L bankName tidak tersimpan."
    );

    assert(
      dbProof.accountName ===
        "TEST ACCOUNT 27",
      "27L accountName tidak tersimpan."
    );

    assert(
      dbProof.accountNumber ===
        "TEST12327",
      "27L accountNumber tidak tersimpan."
    );

    assert(
      existsSync(
        publicPathToFilesystemPath(
          dbProof.image
        )
      ),
      "27L file DB tidak ditemukan."
    );

    console.log(
      "PASS 27L - First upload berhasil."
    );

    /**
     * ========================================================
     * 27M - METADATA
     * ========================================================
     */

    assert(
      returnedOrder.paymentProof,
      "27M response paymentProof tidak tersedia."
    );

    assert(
      returnedOrder.paymentProof.bankName ===
        "TEST BANK 27",
      "27M response bankName tidak sesuai."
    );

    assert(
      returnedOrder.paymentProof.accountName ===
        "TEST ACCOUNT 27",
      "27M response accountName tidak sesuai."
    );

    assert(
      returnedOrder.paymentProof.accountNumber ===
        "TEST12327",
      "27M response accountNumber tidak sesuai."
    );

    assert(
      returnedOrder.paymentProof.status ===
        "PENDING",
      "27M response proof status tidak sesuai."
    );

    console.log(
      "PASS 27M - Metadata payment proof tersimpan."
    );

    /**
     * ========================================================
     * 27N - REPLACEMENT
     * ========================================================
     */

    console.log("");
    console.log(
      "TEST 27N - Replacement Upload"
    );

    const firstImage =
      dbProof.image;

    const replacementResponse =
      await requestPaymentProof(
        accessToken,
        orderA.id,
        createTestFile(
          "test27-replacement.jpg",
          "TEST27_REPLACEMENT"
        ),
        {
          bankName:
            "TEST BANK REPLACED",

          accountName:
            "TEST ACCOUNT REPLACED",

          accountNumber:
            "TEST999",
        }
      );

    assert(
      replacementResponse.response.status ===
        200,
      `27N expected 200, actual=${replacementResponse.response.status}`
    );

    const replacementProof =
      await prisma.paymentProof.findUnique({
        where: {
          orderId:
            orderA.id,
        },
      });

    assert(
      replacementProof,
      "27N PaymentProof tidak ditemukan."
    );

    assert(
      replacementProof.image,
      "27N replacement image kosong."
    );

    assert(
      replacementProof.image !==
        firstImage,
      "27N image harus berubah."
    );

    uploadedPaths.add(
      replacementProof.image
    );

    assert(
      replacementProof.status ===
        "PENDING",
      "27N status proof harus kembali PENDING."
    );

    assert(
      replacementProof.bankName ===
        "TEST BANK REPLACED",
      "27N bankName tidak berubah."
    );

    assert(
      replacementProof.accountName ===
        "TEST ACCOUNT REPLACED",
      "27N accountName tidak berubah."
    );

    assert(
      replacementProof.accountNumber ===
        "TEST999",
      "27N accountNumber tidak berubah."
    );

    assert(
      !existsSync(
        publicPathToFilesystemPath(
          firstImage
        )
      ),
      "27N old image masih ada."
    );

    assert(
      existsSync(
        publicPathToFilesystemPath(
          replacementProof.image
        )
      ),
      "27N replacement image tidak ada."
    );

    console.log(
      "PASS 27N - Replacement upload berhasil."
    );

    /**
     * ========================================================
     * 27P - RESPONSE SERIALIZATION
     * ========================================================
     */

    console.log("");
    console.log(
      "TEST 27P - Response Serialization"
    );

    assert(
      typeof returnedOrder.subtotal ===
        "number",
      "27P subtotal harus number."
    );

    assert(
      typeof returnedOrder.total ===
        "number",
      "27P total harus number."
    );

    assert(
      typeof returnedOrder.createdAt ===
        "string" &&
        !Number.isNaN(
          Date.parse(
            returnedOrder.createdAt
          )
        ),
      "27P createdAt harus ISO date string."
    );

    assert(
      typeof returnedOrder.updatedAt ===
        "string" &&
        !Number.isNaN(
          Date.parse(
            returnedOrder.updatedAt
          )
        ),
      "27P updatedAt harus ISO date string."
    );

    assert(
      Array.isArray(
        returnedOrder.items
      ),
      "27P items harus array."
    );

    assert(
      returnedOrder.user ===
        undefined,
      "27P response tidak boleh expose user."
    );

    assert(
      returnedOrder.stockLedgers ===
        undefined,
      "27P response tidak boleh expose stockLedgers."
    );

    assert(
      returnedOrder.rewardPointTransactions ===
        undefined,
      "27P response tidak boleh expose rewardPointTransactions."
    );

    assert(
      returnedOrder.voucherUsage ===
        undefined,
      "27P response tidak boleh expose voucherUsage."
    );

    assert(
      returnedOrder.deletedAt ===
        undefined,
      "27P response tidak boleh expose deletedAt."
    );

    console.log(
      "PASS 27P - Response serializer aman."
    );

    /**
     * ========================================================
     * 27Q - CONCURRENT UPLOAD
     * ========================================================
     */

    console.log("");
    console.log(
      "TEST 27Q - Concurrent Upload"
    );

    const concurrentA =
      requestPaymentProof(
        accessToken,
        orderA.id,
        createTestFile(
          "test27-concurrent-A.jpg",
          "TEST27_CONCURRENT_A"
        ),
        {
          bankName:
            "BANK A",

          accountName:
            "ACCOUNT A",

          accountNumber:
            "A123",
        }
      );

    const concurrentB =
      requestPaymentProof(
        accessToken,
        orderA.id,
        createTestFile(
          "test27-concurrent-B.jpg",
          "TEST27_CONCURRENT_B"
        ),
        {
          bankName:
            "BANK B",

          accountName:
            "ACCOUNT B",

          accountNumber:
            "B123",
        }
      );

    const [
      concurrentResultA,
      concurrentResultB,
    ] = await Promise.all([
      concurrentA,
      concurrentB,
    ]);

    assert(
      concurrentResultA.response.status ===
        200,
      `27Q A expected 200, actual=${concurrentResultA.response.status}`
    );

    assert(
      concurrentResultB.response.status ===
        200,
      `27Q B expected 200, actual=${concurrentResultB.response.status}`
    );

    assert(
      concurrentResultA.json.success ===
        true,
      "27Q A success harus true."
    );

    assert(
      concurrentResultB.json.success ===
        true,
      "27Q B success harus true."
    );

    const concurrentProof =
      await prisma.paymentProof.findUnique({
        where: {
          orderId:
            orderA.id,
        },
      });

    assert(
      concurrentProof,
      "27Q final PaymentProof tidak ditemukan."
    );

    assert(
      concurrentProof.image,
      "27Q final PaymentProof image kosong."
    );

    uploadedPaths.add(
      concurrentProof.image
    );

    assert(
      concurrentProof.status ===
        "PENDING",
      "27Q final PaymentProof harus PENDING."
    );

    const concurrentCandidatePaths =
      [
        concurrentResultA
          .json
          .data
          ?.order
          ?.paymentProof
          ?.image,

        concurrentResultB
          .json
          .data
          ?.order
          ?.paymentProof
          ?.image,

        concurrentProof.image,
      ].filter(
        (
          value
        ): value is string =>
          typeof value ===
            "string"
      );

    for (
      const candidate
      of concurrentCandidatePaths
    ) {
      uploadedPaths.add(
        candidate
      );
    }

    const existingConcurrentFiles =
      Array.from(
        uploadedPaths
      ).filter(
        (
          uploadedPath
        ) =>
          existsSync(
            publicPathToFilesystemPath(
              uploadedPath
            )
          )
      );

    assert(
      existingConcurrentFiles.length ===
        1,
      `27Q expected exactly 1 existing payment proof file, actual=${existingConcurrentFiles.length}`
    );

    assert(
      existingConcurrentFiles[0] ===
        concurrentProof.image,
      `27Q remaining file harus final DB image. DB=${concurrentProof.image}, existing=${existingConcurrentFiles[0]}`
    );

    console.log(
      "PASS 27Q - Concurrent upload lifecycle aman."
    );

    /**
     * ========================================================
     * FINAL
     * ========================================================
     */

    console.log("");
    console.log(
      "============================================================"
    );

    console.log(
      "ALL MOBILE PAYMENT PROOF API TESTS PASSED"
    );

    console.log(
      "============================================================"
    );
  } catch (error) {
    console.log("");
    console.log(
      "============================================================"
    );

    console.log(
      "TEST 27 FAILED"
    );

    console.log(
      "============================================================"
    );

    console.error(
      error
    );

    process.exitCode =
      1;
  } finally {
    /**
     * ========================================================
     * CLEANUP
     * ========================================================
     */

    console.log("");
    console.log(
      "============================================================"
    );

    console.log(
      "TEST 27 CLEANUP"
    );

    console.log(
      "============================================================"
    );

    try {
      /**
       * ------------------------------------------------------
       * CLEAN ORDERS
       * ------------------------------------------------------
       */

      for (
        const orderId
        of createdOrderIds
      ) {
        await cleanupOrder(
          orderId,
          uploadedPaths
        );
      }

      /**
       * ------------------------------------------------------
       * CLEAN FILES
       * ------------------------------------------------------
       */

      const storage =
        (
          await import(
            "@/services/storage/storage.service"
          )
        ).default;

      for (
        const uploadedPath
        of uploadedPaths
      ) {
        try {
          await storage.delete(
            uploadedPath
          );

          const filesystemPath =
            publicPathToFilesystemPath(
              uploadedPath
            );

          if (
            existsSync(
              filesystemPath
            )
          ) {
            console.error(
              `CLEANUP WARNING: File masih ada: ${uploadedPath}`
            );

            process.exitCode =
              1;
          } else {
            console.log(
              `PASS: File cleanup: ${uploadedPath}`
            );
          }
        } catch (
          fileError
        ) {
          console.error(
            `CLEANUP FILE ERROR: ${uploadedPath}`,
            fileError
          );

          process.exitCode =
            1;
        }
      }

      /**
       * ------------------------------------------------------
       * CLEAN ADDRESSES
       * ------------------------------------------------------
       */

      if (
        testAddressId
      ) {
        await prisma.address.deleteMany({
          where: {
            id:
              testAddressId,
          },
        });

        console.log(
          `PASS: Test address A deleted: ${testAddressId}`
        );
      }

      if (
        otherAddressId
      ) {
        await prisma.address.deleteMany({
          where: {
            id:
              otherAddressId,
          },
        });

        console.log(
          `PASS: Test address B deleted: ${otherAddressId}`
        );
      }

      /**
       * ------------------------------------------------------
       * CLEAN USERS
       * ------------------------------------------------------
       */

      if (
        testUserId
      ) {
        await prisma.user.deleteMany({
          where: {
            id:
              testUserId,
          },
        });

        console.log(
          `PASS: Test user A deleted: ${testUserId}`
        );
      }

      if (
        otherUserId
      ) {
        await prisma.user.deleteMany({
          where: {
            id:
              otherUserId,
          },
        });

        console.log(
          `PASS: Test user B deleted: ${otherUserId}`
        );
      }

      console.log(
        "PASS: Cleanup TEST 27 selesai."
      );
    } catch (
      cleanupError
    ) {
      console.error(
        "CLEANUP ERROR:",
        cleanupError
      );

      process.exitCode =
        1;
    }

    await prisma.$disconnect();
  }
}

main().catch(
  (error) => {
    console.error(
      error
    );

    process.exitCode =
      1;
  }
);
