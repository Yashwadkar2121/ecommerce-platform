// frontend/src/utils/image.js
//
// Small helpers that keep product images fast:
//  - optimizedImage() asks the image host for a resized, modern-format copy
//    (Cloudinary: f_auto,q_auto,w_N - Unsplash: w=N&q=70) instead of the
//    multi-megabyte original
//  - handleImageError() swaps a broken image for a neutral placeholder

const PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="#f3f4f6"/><g fill="none" stroke="#9ca3af" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"><rect x="120" y="140" width="160" height="120" rx="14"/><circle cx="165" cy="185" r="14"/><path d="M130 250l45-45 35 35 25-25 40 40"/></g></svg>`;

export const PLACEHOLDER_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(PLACEHOLDER_SVG)}`;

export function optimizedImage(url, width = 600) {
  if (!url || typeof url !== "string") return PLACEHOLDER_IMAGE;

  try {
    const parsed = new URL(url);

    if (parsed.hostname === "res.cloudinary.com" && url.includes("/upload/")) {
      if (/\/upload\/(?:[a-z]_|f_|q_|w_|c_)/.test(url)) return url; // already transformed
      return url.replace("/upload/", `/upload/f_auto,q_auto,c_limit,w_${width}/`);
    }

    if (parsed.hostname === "images.unsplash.com") {
      parsed.searchParams.set("auto", "format");
      parsed.searchParams.set("fit", "crop");
      parsed.searchParams.set("w", String(width));
      parsed.searchParams.set("q", "70");
      return parsed.toString();
    }
  } catch {
    // not a valid URL - use it as it is
  }
  return url;
}

// <img onError={handleImageError} /> - replaces a broken image once
export function handleImageError(event) {
  const img = event.currentTarget;
  img.onerror = null; // avoid an endless loop if the placeholder fails
  img.src = PLACEHOLDER_IMAGE;
}
