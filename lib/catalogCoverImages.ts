import {catalogCoverGalleries} from "@/data/catalog-cover-galleries";
import {coverGalleryImages} from "./catalogCoverGallery";

export function getCatalogCoverImages(id: string, primary: string): string[] {
  const gallery = catalogCoverGalleries[id];
  return coverGalleryImages(gallery?.cover ?? primary, gallery?.additional);
}
