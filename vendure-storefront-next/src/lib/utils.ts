import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getVendureImageUrl(url: string | undefined): string {
  if (!url) return '';

  // Helper to ensure we use IPv4 for local development to avoid Node.js IPv6 issues
  const normalizeUrl = (u: string) => u.replace('localhost', '127.0.0.1');

  if (url.startsWith('http')) return normalizeUrl(url);

  // In development, images are served from the backend (localhost:3000)
  // but the storefront runs on a different port (3001+)
  // We need to construct the absolute URL
  // We try to get the backend URL from env vars, falling back to 127.0.0.1:3000
  const backendUrl = process.env.NEXT_PUBLIC_VENDURE_SHOP_API_URL ||
    process.env.VENDURE_SHOP_API_URL ||
    'http://127.0.0.1:3000';

  try {
    const urlObj = new URL(backendUrl);
    const origin = normalizeUrl(urlObj.origin);
    const cleanPath = url.startsWith('/') ? url.slice(1) : url;
    return `${origin}/${cleanPath}`;
  } catch {
    return url;
  }
}
