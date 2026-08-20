import { prisma } from "@/lib/prisma";

/**
 * ============================================================
 * VOUCHER CONCURRENCY TEST
 * ============================================================
 *
 * Menguji race condition pada mekanisme claim voucher.
 *
 * Voucher:
 * CONCURRENCY1
 *
 * Expected:
 *
 * usageLimit = 1
 *
 * 2 request berjalan bersamaan.
 *
 * Hanya SATU request yang boleh berhasil melakukan:
 *
 * usageCount += 1
 *
 * ============================================================
 */

const VOUCHER_CODE =
    "CONCURRENCY1";

interface ClaimResult {
    request: string;

    success: boolean;

    message: string;
}

async function claimVoucher(
    requestName: string
): Promise<ClaimResult> {
    try {
        const result =
            await prisma.voucher.updateMany({
                where: {
                    code:
                        VOUCHER_CODE,

                    deletedAt:
                        null,

                    usageCount: {
                        lt: 1,
                    },
                },

                data: {
                    usageCount: {
                        increment:
                            1,
                    },
                },
            });

        if (
            result.count !== 1
        ) {
            return {
                request:
                    requestName,

                success:
                    false,

                message:
                    "Voucher sudah mencapai batas penggunaan.",
            };
        }

        return {
            request:
                requestName,

            success:
                true,

            message:
                "Voucher berhasil diklaim.",
        };
    } catch (error) {
        return {
            request:
                requestName,

            success:
                false,

            message:
                error instanceof Error
                    ? error.message
                    : "Terjadi kesalahan.",
        };
    }
}

async function main() {
    console.log("");

    console.log(
        "========================================"
    );

    console.log(
        "      VOUCHER CONCURRENCY TEST"
    );

    console.log(
        "========================================"
    );

    console.log("");

    /**
     * ==========================================================
     * CHECK VOUCHER
     * ==========================================================
     */

    const voucher =
        await prisma.voucher.findUnique({
            where: {
                code:
                    VOUCHER_CODE,
            },

            select: {
                id: true,

                code: true,

                usageLimit: true,

                usageCount: true,
            },
        });

    if (!voucher) {
        throw new Error(
            `Voucher ${VOUCHER_CODE} tidak ditemukan.`
        );
    }

    console.log(
        "VOUCHER"
    );

    console.log(
        "----------------------------------------"
    );

    console.log(
        "Code:",
        voucher.code
    );

    console.log(
        "Usage Limit:",
        voucher.usageLimit
    );

    console.log(
        "Usage Count Before:",
        voucher.usageCount
    );

    /**
     * ==========================================================
     * VALIDATE INITIAL STATE
     * ==========================================================
     */

    if (
        voucher.usageLimit !== 1
    ) {
        throw new Error(
            "Voucher concurrency harus memiliki usageLimit = 1."
        );
    }

    if (
        voucher.usageCount !== 0
    ) {
        throw new Error(
            `Voucher ${VOUCHER_CODE} harus memiliki usageCount = 0 sebelum test. Current: ${voucher.usageCount}`
        );
    }

    console.log("");

    console.log(
        "========================================"
    );

    console.log(
        "   STARTING 2 CONCURRENT REQUESTS"
    );

    console.log(
        "========================================"
    );

    console.log("");

    /**
     * ==========================================================
     * CONCURRENT CLAIM
     * ==========================================================
     *
     * Promise.all memastikan kedua operasi
     * dimulai tanpa menunggu satu sama lain.
     */

    const results =
        await Promise.all([
            claimVoucher(
                "REQUEST A"
            ),

            claimVoucher(
                "REQUEST B"
            ),
        ]);

    /**
     * ==========================================================
     * RESULTS
     * ==========================================================
     */

    console.log(
        "RESULTS"
    );

    console.log(
        "----------------------------------------"
    );

    for (
        const result of results
    ) {
        console.log(
            `${result.request}:`,
            result.success
                ? "✅ SUCCESS"
                : "❌ FAILED"
        );

        console.log(
            "Message:",
            result.message
        );

        console.log("");
    }

    /**
     * ==========================================================
     * FINAL VOUCHER STATE
     * ==========================================================
     */

    const finalVoucher =
        await prisma.voucher.findUnique({
            where: {
                code:
                    VOUCHER_CODE,
            },

            select: {
                usageLimit: true,

                usageCount: true,
            },
        });

    if (!finalVoucher) {
        throw new Error(
            "Voucher hilang setelah test."
        );
    }

    const successCount =
        results.filter(
            (result) =>
                result.success
        ).length;

    const failedCount =
        results.filter(
            (result) =>
                !result.success
        ).length;

    console.log(
        "========================================"
    );

    console.log(
        "       FINAL VOUCHER STATE"
    );

    console.log(
        "========================================"
    );

    console.log("");

    console.log(
        "Usage Limit:",
        finalVoucher.usageLimit
    );

    console.log(
        "Usage Count After:",
        finalVoucher.usageCount
    );

    console.log(
        "Successful Requests:",
        successCount
    );

    console.log(
        "Failed Requests:",
        failedCount
    );

    /**
     * ==========================================================
     * VALIDATION
     * ==========================================================
     */

    const successValid =
        successCount === 1;

    const failedValid =
        failedCount === 1;

    const usageCountValid =
        finalVoucher.usageCount ===
        1;

    console.log("");

    console.log(
        "VALIDATION"
    );

    console.log(
        "----------------------------------------"
    );

    console.log(
        "Exactly 1 Success:",
        successValid
            ? "✅ VALID"
            : "❌ INVALID"
    );

    console.log(
        "Exactly 1 Failed:",
        failedValid
            ? "✅ VALID"
            : "❌ INVALID"
    );

    console.log(
        "Usage Count = 1:",
        usageCountValid
            ? "✅ VALID"
            : "❌ INVALID"
    );

    /**
     * ==========================================================
     * FINAL RESULT
     * ==========================================================
     */

    const isSuccess =
        successValid &&
        failedValid &&
        usageCountValid;

    console.log("");

    console.log(
        "========================================"
    );

    console.log(
        isSuccess
            ? "🎉 CONCURRENCY TEST BERHASIL"
            : "❌ CONCURRENCY TEST GAGAL"
    );

    console.log(
        "========================================"
    );

    if (!isSuccess) {
        process.exitCode =
            1;
    }
}

main()
    .catch(
        (error) => {
            console.error(
                "[VOUCHER_CONCURRENCY_TEST_ERROR]",
                error
            );

            process.exitCode =
                1;
        }
    )
    .finally(
        async () => {
            await prisma.$disconnect();
        }
    );