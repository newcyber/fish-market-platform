import {
  DEFAULT_ACCEPTED_TYPES,
  DEFAULT_MAX_FILE_SIZE,
  DEFAULT_MAX_FILES,
  UPLOAD_MESSAGES,
} from "./constants";

export interface ValidationResult {
  success: boolean;

  files: File[];

  message?: string;
}

/**
 * Validasi seluruh file upload.
 */
export function validateFiles(
  files: File[]
): ValidationResult {
  if (files.length === 0) {
    return {
      success: false,

      files: [],

      message:
        UPLOAD_MESSAGES.EMPTY,
    };
  }

  if (
    files.length >
    DEFAULT_MAX_FILES
  ) {
    return {
      success: false,

      files: [],

      message:
        `${UPLOAD_MESSAGES.TOO_MANY_FILES} Maksimal ${DEFAULT_MAX_FILES} gambar.`,
    };
  }

  const validFiles: File[] = [];

  for (const file of files) {
    if (
      !DEFAULT_ACCEPTED_TYPES.includes(
        file.type as (typeof DEFAULT_ACCEPTED_TYPES)[number]
      )
    ) {
      return {
        success: false,

        files: [],

        message:
          `${file.name}: ${UPLOAD_MESSAGES.INVALID_TYPE}`,
      };
    }

    if (
      file.size >
      DEFAULT_MAX_FILE_SIZE
    ) {
      return {
        success: false,

        files: [],

        message:
          `${file.name}: ${UPLOAD_MESSAGES.FILE_TOO_LARGE}`,
      };
    }

    validFiles.push(file);
  }

  return {
    success: true,

    files: validFiles,
  };
}

/**
 * Validasi satu file.
 */
export function validateFile(
  file: File
): ValidationResult {
  return validateFiles([file]);
}