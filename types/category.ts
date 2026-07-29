export interface Subcategory {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  imageUrl: string;
}
