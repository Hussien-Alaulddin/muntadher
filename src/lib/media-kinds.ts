export type MediaKind = "image" | "video" | "both" | "file";

export function acceptAttribute(accept: MediaKind) {
  if (accept === "image") {
    return "image/jpeg,image/png,image/webp,image/gif,image/avif";
  }
  if (accept === "video") return "video/mp4,video/webm,video/quicktime";
  if (accept === "file") {
    return "application/pdf,.pdf,application/zip,.zip";
  }
  return "image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm,video/quicktime";
}

export function isVideoUrl(url: string) {
  return /\.(mp4|webm|mov)(\?|$)/i.test(url) || url.includes("/video/");
}
