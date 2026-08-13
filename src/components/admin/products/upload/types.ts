import type { DragEvent, RefObject } from "react";

/**
 * ============================================================================
 * Upload Response
 * ============================================================================
 */

export interface UploadResponse {
  success: boolean;

  message: string;

  images?: UploadedImage[];
}

/**
 * ============================================================================
 * Uploaded Image
 * ============================================================================
 */

export interface UploadedImage {
  id: string;

  image: string;

  sortOrder: number;

  isThumbnail: boolean;
}

/**
 * ============================================================================
 * Preview Image
 * ============================================================================
 */

export interface PreviewImage {
  id: string;

  file: File;

  url: string;

  /**
   * Progress upload (0 - 100)
   */
  progress: number;

  /**
   * Upload berhasil
   */
  uploaded: boolean;

  /**
   * Sedang upload
   */
  uploading: boolean;

  /**
   * Error upload
   */
  error?: string;
}

/**
 * ============================================================================
 * Component Props
 * ============================================================================
 */

export interface ImageUploadPanelProps {
  productId: string;
}

/**
 * ============================================================================
 * Hook Options
 * ============================================================================
 */

export interface UseImageUploadOptions {
  productId: string;

  endpoint?: string;

  maxFileSize?: number;

  acceptedTypes?: string[];
}

/**
 * ============================================================================
 * Hook Return
 * ============================================================================
 */

export interface UseImageUploadReturn {
  previews: PreviewImage[];

  dragging: boolean;

  uploading: boolean;

  uploadProgress: number;

  totalFiles: number;

  hasImages: boolean;

  openPicker(): void;

  clearPreview(): void;

  removePreview(id: string): void;

  handleFiles(
    files: FileList | null
  ): void;

  handleDragEnter(
    event: DragEvent<HTMLDivElement>
  ): void;

  handleDragLeave(
    event: DragEvent<HTMLDivElement>
  ): void;

  handleDragOver(
    event: DragEvent<HTMLDivElement>
  ): void;

  handleDrop(
    event: DragEvent<HTMLDivElement>
  ): void;

  upload(): void;

  /**
   * React 19
   */
  inputRef: RefObject<HTMLInputElement | null>;

  /**
   * React 19
   */
  dropzoneRef: RefObject<HTMLDivElement | null>;
}