import { NextResponse } from "next/server";

export type MobileErrorDetails =
  | Record<string, string[]>
  | Record<string, unknown>;

export type MobileSuccessResponse<T> = {
  success: true;
  data: T;
};

export type MobileErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: MobileErrorDetails;
  };
};

export function mobileSuccess<T>(
  data: T,
  status = 200
): NextResponse<MobileSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

export function mobileError(
  code: string,
  message: string,
  status = 400,
  details?: MobileErrorDetails
): NextResponse<MobileErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(details !== undefined ? { details } : {}),
      },
    },
    { status }
  );
}

export function mobileValidationError(
  message: string,
  details?: MobileErrorDetails
): NextResponse<MobileErrorResponse> {
  return mobileError(
    "VALIDATION_ERROR",
    message,
    400,
    details
  );
}
