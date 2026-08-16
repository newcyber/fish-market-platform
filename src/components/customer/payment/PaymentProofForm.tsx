"use client";

import {
  ChangeEvent,
  FormEvent,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import Image from "next/image";

import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Loader2,
  Upload,
  X,
} from "lucide-react";

import {
  uploadPaymentProof,
} from "@/actions/order/upload-payment-proof";

/**
 * ============================================================
 * TYPES
 * ============================================================
 */

interface PaymentProofFormProps {
  orderId: string;

  paymentType?: string;
}

/**
 * ============================================================
 * CONSTANTS
 * ============================================================
 */

const MAX_FILE_SIZE =
  5 * 1024 * 1024;

const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

/**
 * ============================================================
 * PAYMENT PROOF FORM
 * ============================================================
 */

export default function PaymentProofForm({
  orderId,
  paymentType = "BANK_TRANSFER",
}: PaymentProofFormProps) {
  /**
   * ==========================================================
   * ROUTER
   * ==========================================================
   */

  const router =
    useRouter();

  /**
   * ==========================================================
   * PAYMENT TYPE
   * ==========================================================
   */


  const isBankTransfer =
    paymentType === "BANK_TRANSFER";

  /**
   * ==========================================================
   * STATE
   * ==========================================================
   */

  const [file, setFile] =
    useState<File | null>(
      null
    );

  const [previewUrl, setPreviewUrl] =
    useState<string | null>(
      null
    );

  const [bankName, setBankName] =
    useState("");

  const [
    accountName,
    setAccountName,
  ] = useState("");

  const [
    accountNumber,
    setAccountNumber,
  ] = useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(
      null
    );

  const [success, setSuccess] =
    useState<string | null>(
      null
    );

  /**
   * ==========================================================
   * HANDLE FILE CHANGE
   * ==========================================================
   */

  function handleFileChange(
    event: ChangeEvent<
      HTMLInputElement
    >
  ) {
    const selectedFile =
      event.target.files?.[0];

    /**
     * RESET MESSAGE
     */

    setError(null);
    setSuccess(null);

    /**
     * FILE NOT SELECTED
     */

    if (!selectedFile) {
      return;
    }

    /**
     * VALIDATE FILE TYPE
     */

    if (
      !ALLOWED_FILE_TYPES.includes(
        selectedFile.type
      )
    ) {
      setError(
        "Format file harus JPG, JPEG, PNG, atau WEBP."
      );

      event.target.value = "";

      return;
    }

    /**
     * VALIDATE FILE SIZE
     */

    if (
      selectedFile.size >
      MAX_FILE_SIZE
    ) {
      setError(
        "Ukuran file maksimal 5 MB."
      );

      event.target.value = "";

      return;
    }

    /**
     * CLEAN OLD PREVIEW
     */

    if (previewUrl) {
      URL.revokeObjectURL(
        previewUrl
      );
    }

    /**
     * CREATE PREVIEW
     */

    const newPreviewUrl =
      URL.createObjectURL(
        selectedFile
      );

    setFile(
      selectedFile
    );

    setPreviewUrl(
      newPreviewUrl
    );
  }

  /**
   * ==========================================================
   * REMOVE FILE
   * ==========================================================
   */

  function handleRemoveFile() {
    if (previewUrl) {
      URL.revokeObjectURL(
        previewUrl
      );
    }

    setFile(null);

    setPreviewUrl(null);

    setError(null);

    setSuccess(null);
  }

  /**
   * ==========================================================
   * HANDLE SUBMIT
   * ==========================================================
   */

  async function handleSubmit(
    event: FormEvent<
      HTMLFormElement
    >
  ) {
    event.preventDefault();

    /**
     * RESET MESSAGE
     */

    setError(null);

    setSuccess(null);

    /**
     * VALIDATE FILE
     */

    if (!file) {
      setError(
        "Silakan pilih bukti pembayaran terlebih dahulu."
      );

      return;
    }

    try {
      setIsSubmitting(true);

      /**
       * BUILD FORM DATA
       */

      const formData =
        new FormData();

      formData.append(
        "orderId",
        orderId
      );

      formData.append(
        "file",
        file
      );

      /**
       * BANK INFORMATION
       *
       * Hanya dikirim ketika
       * metode pembayaran adalah
       * BANK_TRANSFER.
       */

      if (isBankTransfer) {
        formData.append(
          "bankName",
          bankName.trim()
        );

        formData.append(
          "accountName",
          accountName.trim()
        );

        formData.append(
          "accountNumber",
          accountNumber.trim()
        );
      }

      /**
       * SUBMIT
       */

      const result =
        await uploadPaymentProof(
          formData
        );

      /**
       * FAILED
       */

      if (!result.success) {
        setError(
          result.message ||
            "Gagal mengirim bukti pembayaran."
        );

        return;
      }

      /**
       * SUCCESS
       */

      setSuccess(
        result.message ||
          "Bukti pembayaran berhasil dikirim."
      );

      /**
       * REDIRECT
       */

      setTimeout(
        () => {
          router.push(
            `/customer/orders/${orderId}`
          );

          router.refresh();
        },
        1000
      );
    } catch (submitError) {
      console.error(
        "[PAYMENT_PROOF_FORM_ERROR]",
        submitError
      );

      setError(
        "Terjadi kesalahan saat mengirim bukti pembayaran."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  /**
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <form
      onSubmit={
        handleSubmit
      }
      className="space-y-6"
    >
      {/* ==================================================== */}
      {/* ERROR MESSAGE */}
      {/* ==================================================== */}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <p>
            {error}
          </p>
        </div>
      )}

      {/* ==================================================== */}
      {/* SUCCESS MESSAGE */}
      {/* ==================================================== */}

      {success && (
        <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

          <p>
            {success}
          </p>
        </div>
      )}

      {/* ==================================================== */}
      {/* BANK INFORMATION */}
      {/* HANYA UNTUK BANK TRANSFER */}
      {/* ==================================================== */}

      {isBankTransfer && (
        <div className="space-y-5 rounded-2xl border bg-background p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
              <CreditCard className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold">
                Informasi Pembayaran
              </h2>

              <p className="text-sm text-muted-foreground">
                Masukkan informasi rekening yang digunakan untuk transfer.
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {/* BANK NAME */}

            <div className="space-y-2">
              <label
                htmlFor="bankName"
                className="text-sm font-medium"
              >
                Nama Bank
              </label>

              <input
                id="bankName"
                type="text"
                value={bankName}
                onChange={(event) =>
                  setBankName(
                    event.target.value
                  )
                }
                placeholder="Contoh: BCA"
                disabled={
                  isSubmitting
                }
                className="flex h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {/* ACCOUNT NAME */}

            <div className="space-y-2">
              <label
                htmlFor="accountName"
                className="text-sm font-medium"
              >
                Nama Pemilik Rekening
              </label>

              <input
                id="accountName"
                type="text"
                value={
                  accountName
                }
                onChange={(event) =>
                  setAccountName(
                    event.target.value
                  )
                }
                placeholder="Nama sesuai rekening"
                disabled={
                  isSubmitting
                }
                className="flex h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>
          </div>

          {/* ACCOUNT NUMBER */}

          <div className="space-y-2">
            <label
              htmlFor="accountNumber"
              className="text-sm font-medium"
            >
              Nomor Rekening
            </label>

            <input
              id="accountNumber"
              type="text"
              inputMode="numeric"
              value={
                accountNumber
              }
              onChange={(event) =>
                setAccountNumber(
                  event.target.value
                )
              }
              placeholder="Masukkan nomor rekening"
              disabled={
                isSubmitting
              }
              className="flex h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* PAYMENT PROOF */}
      {/* ==================================================== */}

      <div className="space-y-5 rounded-2xl border bg-background p-5 sm:p-6">
        <div className="flex items-center gap-3">
          
        </div>

        {!previewUrl && (
          <label
            htmlFor="paymentProof"
            className="flex min-h-55 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center transition hover:bg-muted/50"
          >
            <Upload className="mb-3 h-10 w-10 text-muted-foreground" />

            <p className="font-medium">
              Klik untuk memilih bukti pembayaran
            </p>

            <p className="mt-2 text-xs text-muted-foreground">
              JPG, JPEG, PNG, atau WEBP.
              Maksimal 5 MB.
            </p>

            <input
              id="paymentProof"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={
                handleFileChange
              }
              disabled={
                isSubmitting
              }
              className="hidden"
            />
          </label>
        )}

        {previewUrl && (
          <div className="relative overflow-hidden rounded-xl border">
            <div className="relative aspect-4/3 w-full bg-muted">
              <Image
                src={
                  previewUrl
                }
                alt="Preview bukti pembayaran"
                fill
                unoptimized
                className="object-contain"
              />
            </div>

            <div className="flex items-center justify-between gap-4 border-t p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {file?.name}
                </p>

                <p className="text-xs text-muted-foreground">
                  {file
                    ? (
                        file.size /
                        1024 /
                        1024
                      ).toFixed(2)
                    : "0"}{" "}
                  MB
                </p>
              </div>

              <button
                type="button"
                onClick={
                  handleRemoveFile
                }
                disabled={
                  isSubmitting
                }
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Hapus file"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* SUBMIT */}
      {/* ==================================================== */}

      <button
        type="submit"
        disabled={
          isSubmitting
        }
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />

            Mengirim Bukti Pembayaran...
          </>
        ) : (
          <>
            <Upload className="h-5 w-5" />

            Kirim Bukti Pembayaran
          </>
        )}
      </button>
    </form>
  );
}