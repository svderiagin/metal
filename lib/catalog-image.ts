import versions from "@/data/catalog-image-versions.json";

export function catalogImageUrl(src: string): string {
  const version = (versions as Record<string, string>)[src];
  return version ? `${src}?v=${version}` : src;
}
