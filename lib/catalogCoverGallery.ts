export function coverGalleryImages(primary: string, additional: readonly string[] = []): string[] {
  return [...new Set([primary, ...additional].map(src => src.trim()).filter(Boolean))];
}

export function coverGalleryIndex(index: number, direction: number, count: number): number {
  return count > 0 ? ((index + direction) % count + count) % count : 0;
}
