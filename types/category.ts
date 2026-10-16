export interface Subcategory {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  /** Category guidance, independent of the specifications of supplied batches. */
  materialDescription?: string;
  referenceStandard?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  descriptionSections?: {
    intro: string;
    title: string;
    details: string;
  };
  imageUrl: string;
}
