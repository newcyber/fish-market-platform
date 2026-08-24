"use client";

import {
  useRef,
  useState,
} from "react";

import Image from "next/image";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  CreditCard,
  FileText,
  ImageIcon,
  Loader2,
  QrCode,
  Save,
  ScrollText,
  Upload,
  X,
} from "lucide-react";

import {
  createPaymentChannelAction,
} from "@/actions/payment/payment-channel.actions";

type PaymentChannelType =
  | "BANK_TRANSFER"
  | "QRIS";

/**
 * ============================================================
 * CONFIGURATION
 * ============================================================
 */

const MAX_QRIS_SIZE =
  5 * 1024 * 1024;

const ALLOWED_QRIS_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
];

/**
 * ============================================================
 * CREATE PAYMENT CHANNEL FORM
 * ============================================================
 */

export default function CreatePaymentChannelForm() {
  const router = useRouter();

  /**
   * ==========================================================
   * SUBMIT STATE
   * ==========================================================
   */

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  /**
   * ==========================================================
   * PAYMENT CHANNEL STATE
   * ==========================================================
   */

  const [name, setName] =
    useState("");

  const [type, setType] =
    useState<PaymentChannelType>(
      "BANK_TRANSFER"
    );

  /**
   * ==========================================================
   * BANK ACCOUNT STATE
   * ==========================================================
   */

  const [bankName, setBankName] =
    useState("");

  const [accountNumber, setAccountNumber] =
    useState("");

  const [accountHolder, setAccountHolder] =
    useState("");

  /**
   * ==========================================================
   * QRIS IMAGE STATE
   * ==========================================================
   */

  const [qrisImage, setQrisImage] =
    useState("");

  const [
    isUploadingQris,
    setIsUploadingQris,
  ] = useState(false);

  const qrisInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  /**
   * ==========================================================
   * QRIS PREVIEW ERROR
   * ==========================================================
   */

  const [
    qrisPreviewError,
    setQrisPreviewError,
  ] = useState(false);

  /**
   * ==========================================================
   * PAYMENT INFORMATION STATE
   * ==========================================================
   */

  const [description, setDescription] =
    useState("");

  const [instructions, setInstructions] =
    useState("");

  /**
   * ==========================================================
   * GENERAL STATE
   * ==========================================================
   */

  const [sortOrder, setSortOrder] =
    useState("0");

  const [isActive, setIsActive] =
    useState(true);

  /**
   * ==========================================================
   * ICON STATE
   * ==========================================================
   *
   * Icon adalah field terpisah dari qrisImage.
   *
   * QRIS:
   * - qrisImage = gambar QRIS
   *
   * Icon:
   * - icon = identifier icon payment channel
   *
   * ==========================================================
   */

  const [icon, setIcon] =
    useState("");

  /**
   * ==========================================================
   * HANDLE PAYMENT TYPE CHANGE
   * ==========================================================
   */

  function handleTypeChange(
    value: PaymentChannelType
  ) {
    setType(value);

    /**
     * QRIS tidak menggunakan
     * rekening bank.
     */

    if (value === "QRIS") {
      setBankName("");
      setAccountNumber("");
      setAccountHolder("");
    }

    /**
     * BANK TRANSFER tidak menggunakan
     * gambar QRIS.
     */

    if (value === "BANK_TRANSFER") {
      setQrisImage("");
      setQrisPreviewError(false);
    }
  }

  /**
   * ==========================================================
   * HANDLE QRIS FILE UPLOAD
   * ==========================================================
   */

  async function handleQrisUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    /**
     * Reset input.
     *
     * Dengan cara ini file yang sama
     * tetap bisa dipilih kembali.
     */

    event.target.value = "";

    if (!file) {
      return;
    }

    /**
     * --------------------------------------------------------
     * VALIDATE MIME TYPE
     * --------------------------------------------------------
     */

    if (
      !ALLOWED_QRIS_TYPES.includes(
        file.type
      )
    ) {
      window.alert(
        "Format gambar QRIS harus PNG, JPG, JPEG, atau WEBP."
      );

      return;
    }

    /**
     * --------------------------------------------------------
     * VALIDATE FILE SIZE
     * --------------------------------------------------------
     */

    if (
      file.size <= 0 ||
      file.size > MAX_QRIS_SIZE
    ) {
      window.alert(
        "Ukuran gambar QRIS maksimal 5 MB."
      );

      return;
    }

    /**
     * --------------------------------------------------------
     * START UPLOAD
     * --------------------------------------------------------
     */

    setIsUploadingQris(true);
    setQrisPreviewError(false);

    try {
      const formData =
        new FormData();

      formData.append(
        "file",
        file
      );

      /**
       * ------------------------------------------------------
       * SEND TO API
       * ------------------------------------------------------
       */

      const response =
        await fetch(
          "/api/settings/qris",
          {
            method: "POST",
            body: formData,
          }
        );

      /**
       * ------------------------------------------------------
       * PARSE RESPONSE
       * ------------------------------------------------------
       */

      let result: {
        success?: boolean;
        message?: string;
        url?: string;
      };

      try {
        result =
          await response.json();
      } catch {
        throw new Error(
          "Response server tidak valid."
        );
      }

      /**
       * ------------------------------------------------------
       * HANDLE ERROR
       * ------------------------------------------------------
       */

      if (
        !response.ok ||
        !result.success ||
        !result.url
      ) {
        throw new Error(
          result.message ??
            "Upload gambar QRIS gagal."
        );
      }

      /**
       * ------------------------------------------------------
       * SAVE URL TO STATE
       * ------------------------------------------------------
       */

      setQrisImage(
        result.url
      );

      setQrisPreviewError(
        false
      );

      window.alert(
        "Gambar QRIS berhasil diupload."
      );
    } catch (error) {
      console.error(
        "[QRIS_UPLOAD_CLIENT_ERROR]",
        error
      );

      window.alert(
        error instanceof Error
          ? error.message
          : "Gagal mengupload gambar QRIS."
      );
    } finally {
      setIsUploadingQris(false);
    }
  }

  /**
   * ==========================================================
   * HANDLE REMOVE QRIS IMAGE
   * ==========================================================
   */

  function handleRemoveQrisImage() {
    setQrisImage("");
    setQrisPreviewError(false);

    if (
      qrisInputRef.current
    ) {
      qrisInputRef.current.value =
        "";
    }
  }

  /**
   * ==========================================================
   * HANDLE SUBMIT
   * ==========================================================
   */

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    /**
     * ========================================================
     * VALIDATE NAME
     * ========================================================
     */

    if (!name.trim()) {
      window.alert(
        "Nama metode pembayaran wajib diisi."
      );

      return;
    }

    /**
     * ========================================================
     * VALIDATE BANK TRANSFER
     * ========================================================
     */

    if (
      type === "BANK_TRANSFER"
    ) {
      if (!bankName.trim()) {
        window.alert(
          "Nama bank wajib diisi."
        );

        return;
      }

      if (
        !accountNumber.trim()
      ) {
        window.alert(
          "Nomor rekening wajib diisi."
        );

        return;
      }

      if (
        !accountHolder.trim()
      ) {
        window.alert(
          "Nama pemilik rekening wajib diisi."
        );

        return;
      }
    }

    /**
     * ========================================================
     * VALIDATE QRIS
     * ========================================================
     */

    if (type === "QRIS") {
      if (!qrisImage.trim()) {
        window.alert(
          "Gambar QRIS wajib diupload atau URL/path gambar QRIS wajib diisi."
        );

        return;
      }

      if (!instructions.trim()) {
        window.alert(
          "Instruksi pembayaran QRIS wajib diisi."
        );

        return;
      }
    }

    /**
     * ========================================================
     * START SUBMIT
     * ========================================================
     */

    setIsSubmitting(true);

    try {
      /**
       * ======================================================
       * NORMALIZE NAME
       * ======================================================
       */

      const normalizedName =
        name.trim();

      /**
       * ======================================================
       * GENERATE SLUG
       * ======================================================
       */

      const slug =
        normalizedName
          .toLowerCase()
          .trim()
          .replace(
            /[^a-z0-9\s-]/g,
            ""
          )
          .replace(
            /\s+/g,
            "-"
          )
          .replace(
            /-+/g,
            "-"
          );

      /**
       * ======================================================
       * CREATE PAYMENT CHANNEL
       * ======================================================
       */

      const result =
        await createPaymentChannelAction(
          {
            /**
             * ------------------------------------------------
             * BASIC INFORMATION
             * ------------------------------------------------
             */

            name:
              normalizedName,

            slug,

            type,

            /**
             * ------------------------------------------------
             * BANK ACCOUNT
             * ------------------------------------------------
             */

            bankName:
              type ===
              "BANK_TRANSFER"
                ? bankName.trim() ||
                  null
                : null,

            accountNumber:
              type ===
              "BANK_TRANSFER"
                ? accountNumber.trim() ||
                  null
                : null,

            accountHolder:
              type ===
              "BANK_TRANSFER"
                ? accountHolder.trim() ||
                  null
                : null,

            /**
             * ------------------------------------------------
             * QRIS IMAGE
             * ------------------------------------------------
             *
             * PENTING:
             *
             * Gambar QRIS harus masuk
             * ke field qrisImage,
             * bukan icon.
             */

            qrisImage:
              type === "QRIS"
                ? qrisImage.trim() ||
                  null
                : null,

            /**
             * ------------------------------------------------
             * PAYMENT INFORMATION
             * ------------------------------------------------
             */

            description:
              description.trim() ||
              null,

            instructions:
              instructions.trim() ||
              null,

            /**
             * ------------------------------------------------
             * ICON
             * ------------------------------------------------
             */

            icon:
              icon.trim() ||
              null,

            /**
             * ------------------------------------------------
             * GENERAL
             * ------------------------------------------------
             */

            sortOrder:
              Number(sortOrder) ||
              0,

            isActive,
          }
        );

      /**
       * ======================================================
       * HANDLE FAILURE
       * ======================================================
       */

      if (!result.success) {
        window.alert(
          result.message ??
            "Gagal menambahkan metode pembayaran."
        );

        return;
      }

      /**
       * ======================================================
       * SUCCESS
       * ======================================================
       */

      window.alert(
        result.message ??
          "Metode pembayaran berhasil ditambahkan."
      );

      router.push(
        "/admin/payment-channels"
      );

      router.refresh();
    } catch (error) {
      console.error(
        "[CREATE_PAYMENT_CHANNEL_ERROR]",
        error
      );

      window.alert(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat menambahkan metode pembayaran."
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
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Tambah Metode Pembayaran
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Tambahkan metode pembayaran baru untuk customer.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            router.push(
              "/admin/payment-channels"
            )
          }
          disabled={
            isSubmitting ||
            isUploadingQris
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" />

          Kembali
        </button>
      </div>

      {/* =====================================================
          PAYMENT TYPE
      ====================================================== */}

      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">
            Jenis Metode Pembayaran
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Pilih jenis metode pembayaran yang ingin ditambahkan.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* BANK TRANSFER */}

          <button
            type="button"
            onClick={() =>
              handleTypeChange(
                "BANK_TRANSFER"
              )
            }
            disabled={
              isSubmitting ||
              isUploadingQris
            }
            className={[
              "rounded-2xl border p-5 text-left transition",
              type ===
              "BANK_TRANSFER"
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "hover:bg-muted/50",
            ].join(" ")}
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-muted p-3">
                <CreditCard className="h-5 w-5" />
              </div>

              <div>
                <p className="font-semibold">
                  Transfer Bank
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Pembayaran menggunakan rekening bank.
                </p>
              </div>
            </div>
          </button>

          {/* QRIS */}

          <button
            type="button"
            onClick={() =>
              handleTypeChange(
                "QRIS"
              )
            }
            disabled={
              isSubmitting ||
              isUploadingQris
            }
            className={[
              "rounded-2xl border p-5 text-left transition",
              type === "QRIS"
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "hover:bg-muted/50",
            ].join(" ")}
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-muted p-3">
                <QrCode className="h-5 w-5" />
              </div>

              <div>
                <p className="font-semibold">
                  QRIS
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Pembayaran menggunakan scan QRIS.
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* =====================================================
          BASIC INFORMATION
      ====================================================== */}

      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">
            Informasi Metode Pembayaran
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Informasi utama yang akan digunakan oleh customer.
          </p>
        </div>

        <div className="space-y-5">
          {/* NAME */}

          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium"
            >
              Nama Metode Pembayaran
            </label>

            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value
                )
              }
              placeholder={
                type === "QRIS"
                  ? "Contoh: QRIS"
                  : "Contoh: BCA Transfer"
              }
              disabled={
                isSubmitting ||
                isUploadingQris
              }
              className="w-full rounded-xl border bg-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          {/* DESCRIPTION */}

          <div>
            <label
              htmlFor="description"
              className="mb-2 block text-sm font-medium"
            >
              Deskripsi
            </label>

            <textarea
              id="description"
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value
                )
              }
              placeholder="Deskripsi singkat metode pembayaran."
              rows={3}
              disabled={
                isSubmitting ||
                isUploadingQris
              }
              className="w-full resize-none rounded-xl border bg-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>
        </div>
      </div>

      {/* =====================================================
          BANK INFORMATION
      ====================================================== */}

      {type ===
        "BANK_TRANSFER" && (
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">
              Informasi Rekening
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Informasi rekening tujuan pembayaran.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {/* BANK */}

            <div>
              <label
                htmlFor="bankName"
                className="mb-2 block text-sm font-medium"
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
                className="w-full rounded-xl border bg-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {/* ACCOUNT NUMBER */}

            <div>
              <label
                htmlFor="accountNumber"
                className="mb-2 block text-sm font-medium"
              >
                Nomor Rekening
              </label>

              <input
                id="accountNumber"
                type="text"
                value={accountNumber}
                onChange={(event) =>
                  setAccountNumber(
                    event.target.value
                  )
                }
                placeholder="Contoh: 1234567890"
                disabled={
                  isSubmitting
                }
                className="w-full rounded-xl border bg-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {/* ACCOUNT HOLDER */}

            <div className="md:col-span-2">
              <label
                htmlFor="accountHolder"
                className="mb-2 block text-sm font-medium"
              >
                Nama Pemilik Rekening
              </label>

              <input
                id="accountHolder"
                type="text"
                value={accountHolder}
                onChange={(event) =>
                  setAccountHolder(
                    event.target.value
                  )
                }
                placeholder="Contoh: Pusat Ikan Segar"
                disabled={
                  isSubmitting
                }
                className="w-full rounded-xl border bg-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>
          </div>
        </div>
      )}

            {/* =====================================================
          QRIS IMAGE
      ====================================================== */}

      {type === "QRIS" && (
        <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
          {/* ==================================================
              HEADER
          ================================================== */}

          <div className="mb-5 flex items-start gap-3 sm:mb-6">
            <div className="shrink-0 rounded-xl bg-muted p-3">
              <QrCode className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <h2 className="text-lg font-semibold">
                Gambar QRIS
              </h2>

              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Upload gambar QRIS atau masukkan URL/path
                gambar secara manual.
              </p>
            </div>
          </div>

          <div className="space-y-5">

            {/* ==================================================
                UPLOAD QRIS
            ================================================== */}

            <div>
              <input
                ref={qrisInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={
                  handleQrisUpload
                }
                disabled={
                  isUploadingQris ||
                  isSubmitting
                }
              />

              <button
                type="button"
                onClick={() =>
                  qrisInputRef.current?.click()
                }
                disabled={
                  isUploadingQris ||
                  isSubmitting
                }
                className="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/25 bg-muted/20 px-4 py-8 text-center transition hover:border-primary/50 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60 sm:px-6 sm:py-10"
              >
                {isUploadingQris ? (
                  <>
                    <Loader2 className="mb-3 h-8 w-8 animate-spin text-primary" />

                    <span className="text-sm font-semibold">
                      Mengupload QRIS...
                    </span>

                    <span className="mt-1 text-xs text-muted-foreground">
                      Mohon tunggu sampai upload selesai.
                    </span>
                  </>
                ) : (
                  <>
                    <div className="mb-3 rounded-full bg-primary/10 p-3">
                      <Upload className="h-6 w-6 text-primary" />
                    </div>

                    <span className="text-sm font-semibold">
                      Upload Gambar QRIS
                    </span>

                    <span className="mt-1 text-xs leading-5 text-muted-foreground">
                      PNG, JPG, JPEG, atau WEBP
                      <br className="sm:hidden" />
                      {" "}• Maksimal 5 MB
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* ==================================================
                OR DIVIDER
            ================================================== */}

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />

              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                atau
              </span>

              <div className="h-px flex-1 bg-border" />
            </div>

            {/* ==================================================
                MANUAL URL / PATH
            ================================================== */}

            <div>
              <label
                htmlFor="qrisImage"
                className="mb-2 flex items-center gap-2 text-sm font-medium"
              >
                <ImageIcon className="h-4 w-4 shrink-0" />

                URL / Path Gambar QRIS
              </label>

              <input
                id="qrisImage"
                type="text"
                value={qrisImage}
                onChange={(event) =>
                  setQrisImage(
                    event.target.value
                  )
                }
                placeholder="/uploads/settings/qris/qris.png"
                disabled={
                  isUploadingQris ||
                  isSubmitting
                }
                className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
              />

              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Gunakan opsi ini jika gambar QRIS sudah
                tersedia di storage atau menggunakan URL
                eksternal.
              </p>
            </div>

            {/* ==================================================
                CURRENT VALUE
            ================================================== */}

            {qrisImage.trim() && (
              <div className="rounded-2xl border bg-muted/20 p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      Preview QRIS
                    </p>

                    <p className="mt-1 break-all text-xs text-muted-foreground">
                      {qrisImage}
                    </p>
                  </div>
                </div>

                <div className="flex justify-center">
                  <div className="relative aspect-square w-full max-w-xs overflow-hidden rounded-xl border bg-white shadow-sm sm:max-w-sm">
                    <Image
                      src={qrisImage}
                      alt="Preview QRIS"
                      fill
                      unoptimized
                      sizes="(max-width: 640px) 90vw, 384px"
                      className="object-contain p-4"
                    />
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* =====================================================
          PAYMENT INSTRUCTIONS
      ====================================================== */}

      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="mb-6 flex items-start gap-3">
          <div className="rounded-xl bg-muted p-3">
            <ScrollText className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-lg font-semibold">
              Instruksi Pembayaran
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Instruksi yang akan ditampilkan kepada customer.
            </p>
          </div>
        </div>

        <textarea
          value={instructions}
          onChange={(event) =>
            setInstructions(
              event.target.value
            )
          }
          rows={5}
          placeholder={
            type === "QRIS"
              ? "Scan QRIS menggunakan aplikasi pembayaran Anda, lalu selesaikan pembayaran."
              : "Silakan transfer ke rekening yang tertera."
          }
          disabled={
            isSubmitting ||
            isUploadingQris
          }
          className="w-full resize-none rounded-xl border bg-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      {/* =====================================================
          ADDITIONAL SETTINGS
      ====================================================== */}

      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="mb-6 flex items-start gap-3">
          <div className="rounded-xl bg-muted p-3">
            <FileText className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-lg font-semibold">
              Pengaturan Tambahan
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Atur urutan, icon, dan status metode pembayaran.
            </p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {/* SORT ORDER */}

          <div>
            <label
              htmlFor="sortOrder"
              className="mb-2 block text-sm font-medium"
            >
              Urutan Tampilan
            </label>

            <input
              id="sortOrder"
              type="number"
              min="0"
              value={sortOrder}
              onChange={(event) =>
                setSortOrder(
                  event.target.value
                )
              }
              disabled={
                isSubmitting ||
                isUploadingQris
              }
              className="w-full rounded-xl border bg-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          {/* ICON */}

          <div>
            <label
              htmlFor="icon"
              className="mb-2 block text-sm font-medium"
            >
              Icon
            </label>

            <input
              id="icon"
              type="text"
              value={icon}
              onChange={(event) =>
                setIcon(
                  event.target.value
                )
              }
              placeholder="Contoh: credit-card atau qr-code"
              disabled={
                isSubmitting ||
                isUploadingQris
              }
              className="w-full rounded-xl border bg-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>
        </div>

        {/* ACTIVE */}

        <label className="mt-6 flex cursor-pointer items-center justify-between rounded-xl border p-4">
          <div>
            <p className="font-medium">
              Aktifkan metode pembayaran
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Metode aktif akan tersedia untuk customer saat checkout.
            </p>
          </div>

          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) =>
              setIsActive(
                event.target.checked
              )
            }
            disabled={
              isSubmitting ||
              isUploadingQris
            }
            className="h-5 w-5"
          />
        </label>
      </div>

      {/* =====================================================
          SUBMIT
      ====================================================== */}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {/* CANCEL */}

        <button
          type="button"
          disabled={
            isSubmitting ||
            isUploadingQris
          }
          onClick={() =>
            router.push(
              "/admin/payment-channels"
            )
          }
          className="inline-flex items-center justify-center rounded-xl border px-5 py-3 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          Batal
        </button>

        {/* SUBMIT */}

        <button
          type="submit"
          disabled={
            isSubmitting ||
            isUploadingQris
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />

              Menyimpan...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />

              Simpan Metode Pembayaran
            </>
          )}
        </button>
      </div>
    </form>
  );
}