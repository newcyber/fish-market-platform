"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  DragEvent,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  toast,
} from "sonner";

import {
  DEFAULT_ACCEPTED_TYPES,
  DEFAULT_MAX_FILE_SIZE,
  DEFAULT_UPLOAD_ENDPOINT,
  UPLOAD_MESSAGES,
  UPLOAD_PROGRESS,
} from "./constants";

import {
  appendPreviewFiles,
  calculateProgress,
  markUploadFailed,
  markUploadSuccess,
  removePreview as removePreviewHelper,
  revokePreviewUrls,
  updatePreviewProgress,
} from "./helpers";

import {
  validateFiles,
} from "./validators";

import type {
  PreviewImage,
  UploadResponse,
  UseImageUploadOptions,
  UseImageUploadReturn,
} from "./types";

/**
 * ============================================================================
 * Enterprise Image Upload Hook
 * ============================================================================
 *
 * Responsibilities:
 *
 * - File picker
 * - Client validation
 * - Preview management
 * - Drag & drop
 * - Batch upload
 * - XMLHttpRequest
 * - Real upload progress
 * - Error handling
 * - Sonner notifications
 * - Gallery refresh
 *
 * UI tidak dikelola di sini.
 * Hook hanya menangani state dan business flow upload.
 * ============================================================================
 */

export function useImageUpload({
  productId,
  endpoint = DEFAULT_UPLOAD_ENDPOINT,
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  acceptedTypes = [
    ...DEFAULT_ACCEPTED_TYPES,
  ],
}: UseImageUploadOptions): UseImageUploadReturn {
  const router = useRouter();

  /**
   * --------------------------------------------------------------------------
   * Refs
   * --------------------------------------------------------------------------
   */

  const inputRef =
    useRef<HTMLInputElement>(null);

  const dropzoneRef =
    useRef<HTMLDivElement>(null);

  const xhrRef =
    useRef<XMLHttpRequest | null>(
      null
    );

  /**
   * Menyimpan versi terbaru previews.
   *
   * Ini penting untuk cleanup ketika component
   * benar-benar unmount tanpa menyebabkan
   * ObjectURL direvoke setiap kali state berubah.
   */
  const previewsRef =
    useRef<PreviewImage[]>([]);

  /**
   * --------------------------------------------------------------------------
   * State
   * --------------------------------------------------------------------------
   */

  const [
    previews,
    setPreviews,
  ] = useState<PreviewImage[]>([]);

  const [
    dragging,
    setDragging,
  ] = useState(false);

  const [
    uploading,
    setUploading,
  ] = useState(false);

  const [
  uploadProgress,
  setUploadProgress,
] = useState<number>(
  UPLOAD_PROGRESS.MIN
);

  /**
   * --------------------------------------------------------------------------
   * Derived State
   * --------------------------------------------------------------------------
   */

  const totalFiles =
    previews.length;

  const hasImages =
    totalFiles > 0;

  /**
   * --------------------------------------------------------------------------
   * Keep Preview Ref Synchronized
   * --------------------------------------------------------------------------
   */

  useEffect(() => {
    previewsRef.current =
      previews;
  }, [previews]);

  /**
   * --------------------------------------------------------------------------
   * Cleanup ketika component unmount
   * --------------------------------------------------------------------------
   */

  useEffect(() => {
    return () => {
      /**
       * Batalkan request jika user meninggalkan
       * halaman ketika upload masih berjalan.
       */
      if (
        xhrRef.current &&
        xhrRef.current.readyState !==
          XMLHttpRequest.DONE
      ) {
        xhrRef.current.abort();
      }

      /**
       * Bersihkan seluruh Blob/Object URL.
       */
      revokePreviewUrls(
        previewsRef.current
      );
    };
  }, []);

  /**
   * --------------------------------------------------------------------------
   * Open File Picker
   * --------------------------------------------------------------------------
   */

  const openPicker =
    useCallback(() => {
      if (uploading) {
        return;
      }

      inputRef.current?.click();
    }, [uploading]);

  /**
   * --------------------------------------------------------------------------
   * Clear Preview
   * --------------------------------------------------------------------------
   */

  const clearPreview =
    useCallback(() => {
      if (uploading) {
        return;
      }

      setPreviews(
        (current) => {
          revokePreviewUrls(
            current
          );

          return [];
        }
      );

      setUploadProgress(
        UPLOAD_PROGRESS.MIN
      );

      if (inputRef.current) {
        inputRef.current.value =
          "";
      }
    }, [uploading]);

  /**
   * --------------------------------------------------------------------------
   * Remove Single Preview
   * --------------------------------------------------------------------------
   */

  const removePreview =
    useCallback(
      (id: string) => {
        if (uploading) {
          return;
        }

        setPreviews(
          (current) =>
            removePreviewHelper(
              current,
              id
            )
        );

        /**
         * Reset input supaya file yang sama
         * tetap dapat dipilih kembali.
         */
        if (inputRef.current) {
          inputRef.current.value =
            "";
        }
      },
      [uploading]
    );

  /**
   * --------------------------------------------------------------------------
   * Local Validation
   * --------------------------------------------------------------------------
   *
   * validators.ts menggunakan default global.
   *
   * Di sini kita tetap mendukung override
   * maxFileSize dan acceptedTypes dari options.
   * --------------------------------------------------------------------------
   */

  const validateCustomOptions =
    useCallback(
      (
        files: File[]
      ): string | null => {
        for (const file of files) {
          if (
            !acceptedTypes.includes(
              file.type
            )
          ) {
            return `${file.name}: ${UPLOAD_MESSAGES.INVALID_TYPE}`;
          }

          if (
            file.size >
            maxFileSize
          ) {
            const maxMb =
              maxFileSize /
              1024 /
              1024;

            return `${file.name}: Ukuran gambar melebihi batas maksimum ${maxMb.toFixed(
              0
            )} MB.`;
          }
        }

        return null;
      },
      [
        acceptedTypes,
        maxFileSize,
      ]
    );

  /**
   * --------------------------------------------------------------------------
   * Handle Files
   * --------------------------------------------------------------------------
   */

  const handleFiles =
    useCallback(
      (
        fileList:
          | FileList
          | null
      ) => {
        if (
          uploading ||
          !fileList
        ) {
          return;
        }

        const files =
          Array.from(
            fileList
          );

        /**
         * Jalankan validator utama.
         */
        const validation =
          validateFiles(files);

        if (
          !validation.success
        ) {
          toast.error(
            validation.message ??
              UPLOAD_MESSAGES.UNKNOWN_ERROR
          );

          if (
            inputRef.current
          ) {
            inputRef.current.value =
              "";
          }

          return;
        }

        /**
         * Validasi override konfigurasi hook.
         */
        const customError =
          validateCustomOptions(
            validation.files
          );

        if (customError) {
          toast.error(
            customError
          );

          if (
            inputRef.current
          ) {
            inputRef.current.value =
              "";
          }

          return;
        }

        /**
         * Append, bukan replace.
         *
         * User dapat:
         *
         * pilih 3 gambar
         * +
         * pilih 2 gambar
         * =
         * total 5 gambar.
         */
        setPreviews(
          (current) =>
            appendPreviewFiles(
              current,
              validation.files
            )
        );

        /**
         * Reset native input.
         *
         * Ini memungkinkan user memilih
         * file yang sama lagi.
         */
        if (inputRef.current) {
          inputRef.current.value =
            "";
        }
      },
      [
        uploading,
        validateCustomOptions,
      ]
    );

  /**
   * --------------------------------------------------------------------------
   * Drag Enter
   * --------------------------------------------------------------------------
   */

  const handleDragEnter =
    useCallback(
      (
        event:
          DragEvent<HTMLDivElement>
      ) => {
        event.preventDefault();
        event.stopPropagation();

        if (uploading) {
          return;
        }

        setDragging(true);
      },
      [uploading]
    );

  /**
   * --------------------------------------------------------------------------
   * Drag Over
   * --------------------------------------------------------------------------
   */

  const handleDragOver =
    useCallback(
      (
        event:
          DragEvent<HTMLDivElement>
      ) => {
        event.preventDefault();
        event.stopPropagation();

        if (uploading) {
          return;
        }

        /**
         * Memberi tahu browser bahwa
         * drop diperbolehkan.
         */
        event.dataTransfer.dropEffect =
          "copy";

        setDragging(true);
      },
      [uploading]
    );

  /**
   * --------------------------------------------------------------------------
   * Drag Leave
   * --------------------------------------------------------------------------
   */

  const handleDragLeave =
    useCallback(
      (
        event:
          DragEvent<HTMLDivElement>
      ) => {
        event.preventDefault();
        event.stopPropagation();

        /**
         * Jangan langsung mematikan state
         * ketika pointer hanya berpindah ke
         * child element di dalam dropzone.
         */
        const currentTarget =
          event.currentTarget;

        const relatedTarget =
          event.relatedTarget;

        if (
          relatedTarget instanceof
            Node &&
          currentTarget.contains(
            relatedTarget
          )
        ) {
          return;
        }

        setDragging(false);
      },
      []
    );

  /**
   * --------------------------------------------------------------------------
   * Drop
   * --------------------------------------------------------------------------
   */

  const handleDrop =
    useCallback(
      (
        event:
          DragEvent<HTMLDivElement>
      ) => {
        event.preventDefault();
        event.stopPropagation();

        setDragging(false);

        if (uploading) {
          return;
        }

        handleFiles(
          event.dataTransfer.files
        );
      },
      [
        uploading,
        handleFiles,
      ]
    );

  /**
   * --------------------------------------------------------------------------
   * Upload
   * --------------------------------------------------------------------------
   *
   * Menggunakan XMLHttpRequest karena Fetch API
   * tidak menyediakan upload progress event.
   *
   * Seluruh gambar dikirim dalam SATU batch:
   *
   * productId
   * images
   * images
   * images
   *
   * Ini sesuai dengan:
   *
   * formData.getAll("images")
   *
   * pada Route Handler.
   * --------------------------------------------------------------------------
   */

  const upload =
    useCallback(() => {
      if (uploading) {
        return;
      }

      if (
        previews.length === 0
      ) {
        toast.error(
          UPLOAD_MESSAGES.EMPTY
        );

        return;
      }

      if (!productId) {
        toast.error(
          "Produk tidak valid."
        );

        return;
      }

      /**
       * Hanya kirim preview yang belum berhasil.
       *
       * Ini membuat struktur hook siap
       * untuk retry di iterasi berikutnya.
       */
      const pendingPreviews =
        previews.filter(
          (preview) =>
            !preview.uploaded
        );

      if (
        pendingPreviews.length === 0
      ) {
        toast.success(
          "Semua gambar sudah berhasil diupload."
        );

        return;
      }

      const formData =
        new FormData();

      formData.append(
        "productId",
        productId
      );

      pendingPreviews.forEach(
        (preview) => {
          formData.append(
            "images",
            preview.file
          );
        }
      );

      const xhr =
        new XMLHttpRequest();

      xhrRef.current =
        xhr;

      setUploading(true);

      setDragging(false);

      setUploadProgress(
        UPLOAD_PROGRESS.MIN
      );

      /**
       * Tandai file sebagai sedang upload.
       */
      setPreviews(
        (current) =>
          current.map(
            (preview) => {
              if (
                preview.uploaded
              ) {
                return preview;
              }

              return {
                ...preview,

                progress:
                  UPLOAD_PROGRESS.MIN,

                uploading: true,

                uploaded: false,

                error:
                  undefined,
              };
            }
          )
      );

      xhr.open(
        "POST",
        endpoint,
        true
      );

      /**
       * ----------------------------------------------------------------------
       * Real Upload Progress
       * ----------------------------------------------------------------------
       */

      xhr.upload.onprogress =
        (event) => {
          if (
            !event.lengthComputable
          ) {
            return;
          }

          const progress =
            calculateProgress(
              event.loaded,
              event.total
            );

          setUploadProgress(
            progress
          );

          /**
           * Karena backend menggunakan batch upload,
           * seluruh preview menggunakan progress
           * batch yang sama.
           */
          setPreviews(
            (current) =>
              current.map(
                (preview) => {
                  if (
                    preview.uploaded
                  ) {
                    return preview;
                  }

                  return {
                    ...preview,

                    progress,

                    uploading:
                      progress <
                      UPLOAD_PROGRESS.MAX,

                    error:
                      undefined,
                  };
                }
              )
          );
        };

      /**
       * ----------------------------------------------------------------------
       * Upload Completed
       * ----------------------------------------------------------------------
       */

      xhr.onload = () => {
        let result:
          | UploadResponse
          | null = null;

        try {
          result =
            JSON.parse(
              xhr.responseText
            ) as UploadResponse;
        } catch {
          result = null;
        }

        const requestSucceeded =
          xhr.status >= 200 &&
          xhr.status < 300 &&
          result?.success ===
            true;

        if (
          !requestSucceeded
        ) {
          const message =
            result?.message ??
            UPLOAD_MESSAGES.UNKNOWN_ERROR;

          setPreviews(
            (current) =>
              markUploadFailed(
                current,
                message
              )
          );

          setUploading(false);

          setUploadProgress(
            UPLOAD_PROGRESS.MIN
          );

          xhrRef.current =
            null;

          toast.error(
            message
          );

          return;
        }

        /**
         * Tandai seluruh batch sukses.
         */
        setPreviews(
          (current) =>
            markUploadSuccess(
              current
            )
        );

        setUploadProgress(
          UPLOAD_PROGRESS.MAX
        );

        setUploading(false);

        xhrRef.current =
          null;

        toast.success(
  result?.message ??
    UPLOAD_MESSAGES.SUCCESS
);

        /**
         * Bersihkan preview setelah UI
         * mendapat state success.
         *
         * Tidak langsung menggunakan
         * clearPreview() karena callback
         * tersebut memblokir ketika uploading.
         */
        setPreviews(
          (current) => {
            revokePreviewUrls(
              current
            );

            return [];
          }
        );

        if (
          inputRef.current
        ) {
          inputRef.current.value =
            "";
        }

        setUploadProgress(
          UPLOAD_PROGRESS.MIN
        );

        /**
         * Server route sudah revalidate,
         * router.refresh() memperbarui
         * Server Component gallery di client.
         */
        router.refresh();
      };

      /**
       * ----------------------------------------------------------------------
       * Network Error
       * ----------------------------------------------------------------------
       */

      xhr.onerror = () => {
        const message =
          UPLOAD_MESSAGES.NETWORK_ERROR;

        setPreviews(
          (current) =>
            markUploadFailed(
              current,
              message
            )
        );

        setUploading(false);

        setUploadProgress(
          UPLOAD_PROGRESS.MIN
        );

        xhrRef.current =
          null;

        toast.error(
          message
        );
      };

      /**
       * ----------------------------------------------------------------------
       * Abort
       * ----------------------------------------------------------------------
       */

      xhr.onabort = () => {
        setPreviews(
          (current) =>
            markUploadFailed(
              current,
              "Upload dibatalkan."
            )
        );

        setUploading(false);

        setUploadProgress(
          UPLOAD_PROGRESS.MIN
        );

        xhrRef.current =
          null;
      };

      /**
       * ----------------------------------------------------------------------
       * Send
       * ----------------------------------------------------------------------
       */

      xhr.send(formData);
    }, [
      endpoint,
      previews,
      productId,
      router,
      uploading,
    ]);

  /**
   * --------------------------------------------------------------------------
   * Public API
   * --------------------------------------------------------------------------
   */

  return useMemo(
    () => ({
      previews,

      dragging,

      uploading,

      uploadProgress,

      totalFiles,

      hasImages,

      openPicker,

      clearPreview,

      removePreview,

      handleFiles,

      handleDragEnter,

      handleDragLeave,

      handleDragOver,

      handleDrop,

      upload,

      inputRef,

      dropzoneRef,
    }),
    [
      previews,
      dragging,
      uploading,
      uploadProgress,
      totalFiles,
      hasImages,
      openPicker,
      clearPreview,
      removePreview,
      handleFiles,
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      upload,
    ]
  );
}

export default useImageUpload;