import {
  SEO_DEFAULT_DESCRIPTION,
  SEO_DEFAULT_TITLE,
} from "./seo.constants";

export function normalizeSeoText(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

export function resolveSeoTitle(
  value: string | null | undefined,
  fallback = SEO_DEFAULT_TITLE
): string {
  return normalizeSeoText(value) || fallback;
}

export function resolveSeoDescription(
  value: string | null | undefined,
  fallback = SEO_DEFAULT_DESCRIPTION
): string {
  return normalizeSeoText(value) || fallback;
}

export function resolveSeoBaseUrl(
  value: string | null | undefined,
  fallback = process.env.APP_URL?.trim() ||
    "http://localhost:3000"
): string {
  const normalized = normalizeSeoText(value);

  return (normalized || fallback).replace(/\/+$/, "");
}

export function resolveCanonicalUrl(
  baseUrl: string,
  pathname = "/"
): string {
  const normalizedPath = pathname.startsWith("/")
    ? pathname
    : `/${pathname}`;

  if (normalizedPath === "/") {
    return `${baseUrl}/`;
  }

  return `${baseUrl}${normalizedPath}`;
}

export function resolveSeoImageUrl(
  value: string | null | undefined,
  baseUrl: string
): string | undefined {
  const normalized = normalizeSeoText(value);

  if (!normalized) {
    return undefined;
  }

  if (/^https?:\/\//i.test(normalized)) {
    return normalized;
  }

  return `${baseUrl}/${normalized.replace(/^\/+/, "")}`;
}
