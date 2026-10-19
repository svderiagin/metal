export interface Subcategory {
  /** Internal type adapter for source categories whose products have no subcategory. */
  internal?: boolean;
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
  /** Show source products directly when the source has no subcategories. */
  directProducts?: boolean;
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
