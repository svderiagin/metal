import {catalogCoverGalleries} from "@/data/catalog-cover-galleries";
import {coverGalleryImages} from "./catalogCoverGallery";

export function getCatalogCoverImages(id: string, primary: string): string[] {
  return coverGalleryImages(primary, catalogCoverGalleries[id]);
}
