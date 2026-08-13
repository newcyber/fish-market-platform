import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

import {
    ArrowLeft,
    CheckCircle2,
    Clock3,
    XCircle,
} from "lucide-react";

import { PaymentVerificationService } from "@/services/payment/payment-verification.service";

import PaymentVerificationActions from "@/components/admin/payments/PaymentVerificationActions";

/**
 * ============================================================
 *
 * ADMIN PAYMENT DETAIL PAGE
 *
 * ============================================================
 */

function getPaymentStatusLabel(
    status: string
) {
    switch (status) {
        case "PENDING":
            return "Menunggu Verifikasi";

        case "VERIFIED":
            return "Terverifikasi";

        case "REJECTED":
            return "Ditolak";

        default:
            return status;
    }
}

function getPaymentStatusClass(
    status: string
) {
    switch (status) {
        case "PENDING":
            return "bg-yellow-100 text-yellow-700";

        case "VERIFIED":
            return "bg-green-100 text-green-700";

        case "REJECTED":
            return "bg-red-100 text-red-700";

        default:
            return "bg-slate-100 text-slate-700";
    }
}

function getPaymentStatusIcon(
    status: string
) {
    switch (status) {
        case "VERIFIED":
            return (
                <CheckCircle2 className="h-4 w-4" />
            );

        case "REJECTED":
            return (
                <XCircle className="h-4 w-4" />
            );

        default:
            return (
                <Clock3 className="h-4 w-4" />
            );
    }
}

function formatDate(
    date: Date | string | null
) {
    if (!date) {
        return "-";
    }

    return new Intl.DateTimeFormat(
        "id-ID",
        {
            dateStyle: "full",
            timeStyle: "short",
        }
    ).format(
        new Date(date)
    );
}

function formatCurrency(
    value: number
) {
    return new Intl.NumberFormat(
        "id-ID",
        {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
        }
    ).format(value);
}

interface AdminPaymentDetail {
    id: string;
    status: string;
    image?: string | null;
    bankName?: string | null;
    accountNumber?: string | null;
    accountName?: string | null;
    createdAt?: string | Date | null;
    rejectionReason?: string | null;
    order: {
    id: string;
    orderNumber: string;
    total: number | string;
    status: string;
        items: Array<{
            id: string;
            quantity: number | string;
            price: number | string;
            product: {
                name: string;
            };
        }>;
        user: {
            name?: string | null;
            email: string;
            phone?: string | null;
        };
        address?: {
            recipientName: string;
            phone: string;
            address: string;
            city: string;
        } | null;
    };
}

/**
 * ============================================================
 * PAGE
 * ============================================================
 */

interface AdminPaymentDetailPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function AdminPaymentDetailPage({
    params,
}: AdminPaymentDetailPageProps) {
    const { id } = await params;

    const result =
        await PaymentVerificationService.getById(
            id
        );

    if (
        !result.success ||
        !result.data
    ) {
        notFound();
    }

    const payment = result.data as AdminPaymentDetail;

    return (
        <div className="space-y-6">
            {/* ======================================================
          HEADER
      ====================================================== */}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <Link
                        href="/admin/payments"
                        className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />

                        Kembali ke Pembayaran
                    </Link>

                    <h1 className="text-2xl font-bold tracking-tight">
                        Detail Verifikasi Pembayaran
                    </h1>

                    <p className="mt-1 text-sm text-muted-foreground">
                        Periksa bukti pembayaran sebelum
                        menyetujui atau menolak pembayaran.
                    </p>
                </div>

                <div>
                    <span
                        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${getPaymentStatusClass(
                            payment.status
                        )}`}
                    >
                        {getPaymentStatusIcon(
                            payment.status
                        )}

                        {getPaymentStatusLabel(
                            payment.status
                        )}
                    </span>
                </div>
            </div>

            {/* ======================================================
          MAIN GRID
      ====================================================== */}

            <div className="grid gap-6 lg:grid-cols-3">
                {/* ====================================================
            LEFT CONTENT
        ==================================================== */}

                <div className="space-y-6 lg:col-span-2">
                    {/* ==================================================
              PAYMENT PROOF
          ================================================== */}

                    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
                        <div className="border-b p-5">
                            <h2 className="font-semibold">
                                Bukti Pembayaran
                            </h2>

                            <p className="mt-1 text-sm text-muted-foreground">
                                Bukti transfer yang diupload oleh customer.
                            </p>
                        </div>

                        <div className="p-5">
                            {payment.image ? (
                                <div className="overflow-hidden rounded-xl border bg-muted">
                                    <div className="relative h-80 w-full">
                                        <Image
                                            src={payment.image}
                                            alt="Bukti pembayaran"
                                            fill
                                            className="object-contain"
                                            sizes="100vw"
                                            priority
                                            unoptimized
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-xl border border-dashed p-10 text-center">
                                    <p className="text-sm text-muted-foreground">
                                        Bukti pembayaran tidak tersedia.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ==================================================
              PAYMENT INFORMATION
          ================================================== */}

                    <div className="rounded-xl border bg-card shadow-sm">
                        <div className="border-b p-5">
                            <h2 className="font-semibold">
                                Informasi Pembayaran
                            </h2>
                        </div>

                        <div className="grid gap-5 p-5 sm:grid-cols-2">
                            <div>
                                <p className="text-xs text-muted-foreground">
                                    Bank
                                </p>

                                <p className="mt-1 font-medium">
                                    {payment.bankName ?? "-"}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-muted-foreground">
                                    Nomor Rekening
                                </p>

                                <p className="mt-1 font-mono font-medium">
                                    {payment.accountNumber ?? "-"}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-muted-foreground">
                                    Nama Pengirim
                                </p>

                                <p className="mt-1 font-medium">
                                    {payment.accountName ?? "-"}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-muted-foreground">
                                    Waktu Upload
                                </p>

                                <p className="mt-1 text-sm font-medium">
                                    {formatDate(
                                        payment.createdAt ?? null
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ==================================================
              REJECTION REASON
          ================================================== */}

                    {payment.status === "REJECTED" &&
                        payment.rejectionReason && (
                            <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                                <h2 className="font-semibold text-red-800">
                                    Alasan Penolakan
                                </h2>

                                <p className="mt-2 text-sm leading-6 text-red-700">
                                    {payment.rejectionReason}
                                </p>
                            </div>
                        )}

                    {/* ==================================================
              ORDER ITEMS
          ================================================== */}

                    <div className="rounded-xl border bg-card shadow-sm">
                        <div className="border-b p-5">
                            <h2 className="font-semibold">
                                Item Pesanan
                            </h2>
                        </div>

                        <div className="divide-y">
                            {payment.order.items.map(
                                (item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between gap-4 p-5"
                                    >
                                        <div>
                                            <p className="font-medium">
                                                {item.product.name}
                                            </p>

                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {item.quantity} ×{" "}
                                                {formatCurrency(
                                                    Number(
                                                        item.price
                                                    )
                                                )}
                                            </p>
                                        </div>

                                        <p className="font-semibold">
                                            {formatCurrency(
                                                Number(
                                                    item.quantity
                                                ) *
                                                Number(
                                                    item.price
                                                )
                                            )}
                                        </p>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>

                {/* ====================================================
            RIGHT SIDEBAR
        ==================================================== */}

                <div className="space-y-6">
                    {/* ==================================================
              ORDER SUMMARY
          ================================================== */}
                    {payment.status === "PENDING" && (
                        <PaymentVerificationActions
                            paymentProofId={payment.id}
                        />
                    )}

                    <div className="rounded-xl border bg-card shadow-sm">
                        <div className="border-b p-5">
                            <h2 className="font-semibold">
                                Informasi Pesanan
                            </h2>
                        </div>

                        <div className="space-y-5 p-5">
                            <div>
                                <p className="text-xs text-muted-foreground">
                                    Nomor Pesanan
                                </p>

                                <p className="mt-1 font-semibold">
                                    {payment.order.orderNumber}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-muted-foreground">
                                    Total Pesanan
                                </p>

                                <p className="mt-1 text-lg font-bold">
                                    {formatCurrency(
                                        Number(
                                        payment.order.total
                                        )
                                    )}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-muted-foreground">
                                    Status Order
                                </p>

                                <p className="mt-1 font-medium">
                                    {payment.order.status}
                                </p>
                            </div>

                            <Link
                                href={`/admin/orders/${payment.order.id}`}
                                className="inline-flex w-full items-center justify-center rounded-lg border px-4 py-2.5 text-sm font-medium transition hover:bg-muted"
                            >
                                Lihat Detail Pesanan
                            </Link>
                        </div>
                    </div>

                    {/* ==================================================
              CUSTOMER
          ================================================== */}

                    <div className="rounded-xl border bg-card shadow-sm">
                        <div className="border-b p-5">
                            <h2 className="font-semibold">
                                Customer
                            </h2>
                        </div>

                        <div className="space-y-4 p-5">
                            <div>
                                <p className="text-xs text-muted-foreground">
                                    Nama
                                </p>

                                <p className="mt-1 font-medium">
                                    {payment.order.user.name ??
                                        "Customer"}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-muted-foreground">
                                    Email
                                </p>

                                <p className="mt-1 text-sm">
                                    {payment.order.user.email}
                                </p>
                            </div>

                            {payment.order.user.phone && (
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        Nomor Telepon
                                    </p>

                                    <p className="mt-1 text-sm">
                                        {payment.order.user.phone}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ==================================================
              SHIPPING ADDRESS
          ================================================== */}

                    {payment.order.address && (
                        <div className="rounded-xl border bg-card shadow-sm">
                            <div className="border-b p-5">
                                <h2 className="font-semibold">
                                    Alamat Pengiriman
                                </h2>
                            </div>

                            <div className="space-y-2 p-5 text-sm">
                                <p className="font-medium">
                                    {payment.order.address.recipientName}
                                </p>

                                <p className="text-muted-foreground">
                                    {payment.order.address.phone}
                                </p>

                                <p className="leading-6 text-muted-foreground">
                                    {payment.order.address.address}
                                </p>

                                <p className="text-muted-foreground">
                                    {payment.order.address.city}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}