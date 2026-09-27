import { NextResponse } from 'next/server';

export interface ApiErrorResponse {
  success: false;
  error: string;
  code: string;
  status: number;
  timestamp: string;
  details?: unknown;
}

export interface ApiSuccessResponse {
  success: true;
  status: number;
  timestamp: string;
  source?: string;
  count?: number;
  [key: string]: unknown;
}

export type StandardApiResponse = ApiErrorResponse | ApiSuccessResponse;

const DEFAULT_CODE_BY_STATUS: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  405: 'METHOD_NOT_ALLOWED',
  422: 'UNPROCESSABLE_ENTITY',
  500: 'INTERNAL_SERVER_ERROR',
  502: 'BAD_GATEWAY',
  503: 'SERVICE_UNAVAILABLE'
};

/**
 * Creates a structured, standardized JSON error response.
 * Sanitizes details to ensure no internal stack traces or secrets are exposed.
 */
export function errorResponse(
  message: string,
  status: number = 500,
  code?: string,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  const finalCode = code || DEFAULT_CODE_BY_STATUS[status] || 'ERROR';

  // Sanitize details: never leak raw stack traces or internal secrets
  let safeDetails: unknown = details;
  if (details instanceof Error) {
    safeDetails = { message: details.message };
  } else if (typeof details === 'string' && (details.includes('node_modules') || details.includes('at '))) {
    safeDetails = undefined;
  }

  const payload: ApiErrorResponse = {
    success: false,
    error: message,
    code: finalCode,
    status,
    timestamp: new Date().toISOString(),
    ...(safeDetails !== undefined && { details: safeDetails })
  };

  return NextResponse.json(payload, { status });
}

/**
 * Creates a structured JSON success response.
 * Preserves top-level keys for backward-compatibility with existing frontend callers.
 */
export function successResponse(
  data: Record<string, unknown>,
  status: number = 200,
  source?: string
): NextResponse<ApiSuccessResponse> {
  const payload: ApiSuccessResponse = {
    success: true,
    status,
    timestamp: new Date().toISOString(),
    ...(source && { source }),
    ...data
  };

  return NextResponse.json(payload, { status });
}
