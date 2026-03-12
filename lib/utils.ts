import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  if (process.env.NEXT_PUBLIC_VERCEL_URL)
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  if (typeof window !== "undefined") return window.location.origin;
  return "http://localhost:3000";
}

export function getBlobUrl(privateUrl: string): string {
  return `/api/blob?url=${encodeURIComponent(privateUrl)}`;
}

export function formatBytes(bytes: number, decimals = 2) {
  if (bytes < 0 || !+bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(k)),
    sizes.length - 1,
  );
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatDocumentName(name: string): string {
  return name.replace(/\.pdf$/i, "").replace(/_/g, " ");
}
