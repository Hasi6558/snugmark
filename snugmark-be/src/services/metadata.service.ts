// Copyright (c) 2026 Hasindu Shehan Liyanage. All Rights Reserved.
// This code may not be copied, modified, distributed, or used in production without written permission.

import dns from "node:dns/promises";
import { parse } from "node-html-parser";
import { AppError } from "../middleware/error.js";

const USER_AGENT =
  "Mozilla/5.0 (compatible; Snugmark/1.0; https://github.com/snugmark)";
const FETCH_TIMEOUT_MS = 5000;

// Regex patterns covering all private / loopback / link-local IPv4 and IPv6 ranges.
const PRIVATE_IP_PATTERNS = [
  /^127\./,                          // 127.0.0.0/8 loopback
  /^10\./,                           // 10.0.0.0/8 private
  /^172\.(1[6-9]|2\d|3[01])\./,     // 172.16.0.0/12 private
  /^192\.168\./,                     // 192.168.0.0/16 private
  /^169\.254\./,                     // 169.254.0.0/16 link-local
  /^0\./,                            // 0.0.0.0/8 "this" network
  /^::1$/,                           // IPv6 loopback
  /^[fF][cCdD]/,                     // IPv6 unique local (fc00::/7)
  /^[fF][eE][89aAbB]/,               // IPv6 link-local (fe80::/10)
];

function isPrivateIp(ip: string): boolean {
  return PRIVATE_IP_PATTERNS.some((re) => re.test(ip));
}

async function ssrfGuard(url: URL): Promise<void> {
  const { hostname } = url;

  // Block loopback / unspecified by name before DNS resolution
  if (
    hostname === "localhost" ||
    hostname === "::1" ||
    hostname === "0.0.0.0"
  ) {
    throw new AppError(400, "ssrf_blocked", "URL not allowed");
  }

  let address: string;
  try {
    ({ address } = await dns.lookup(hostname));
  } catch {
    throw new AppError(400, "invalid_url", "Could not resolve host");
  }

  if (isPrivateIp(address)) {
    throw new AppError(400, "ssrf_blocked", "URL not allowed");
  }
}

async function fetchHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT },
    });
    return response.text();
  } finally {
    clearTimeout(timer);
  }
}

function extractMetadata(
  html: string,
  url: URL
): { title: string; description: string; favicon: string } {
  const root = parse(html);
  const googleFavicon = `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=64`;

  const ogTitle = root
    .querySelector('meta[property="og:title"]')
    ?.getAttribute("content");
  const titleTag = root.querySelector("title")?.text;
  const title = (ogTitle || titleTag || "").trim();

  const ogDesc = root
    .querySelector('meta[property="og:description"]')
    ?.getAttribute("content");
  const metaDesc = root
    .querySelector('meta[name="description"]')
    ?.getAttribute("content");
  const description = (ogDesc || metaDesc || "").trim();

  const iconHref = root
    .querySelector('link[rel~="icon"]')
    ?.getAttribute("href");

  let favicon = googleFavicon;
  if (iconHref) {
    try {
      favicon = new URL(iconHref, url.origin).toString();
    } catch {
      favicon = googleFavicon;
    }
  }

  return { title, description, favicon };
}

export interface MetadataResult {
  title: string;
  description: string;
  favicon: string;
}

export async function fetchMetadata(rawUrl: string): Promise<MetadataResult> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    throw new AppError(400, "invalid_url", "Invalid URL");
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new AppError(400, "invalid_url", "URL must use http or https");
  }

  // SSRF check throws AppError — must not be swallowed by the fallback below
  await ssrfGuard(parsedUrl);

  const googleFavicon = `https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=64`;

  // Network / parse failures degrade gracefully rather than erroring the user
  try {
    const html = await fetchHtml(rawUrl);
    return extractMetadata(html, parsedUrl);
  } catch {
    return { title: "", description: "", favicon: googleFavicon };
  }
}
