export interface ProductImage {
  id: string;

  image: string;

  sortOrder: number;

  isThumbnail: boolean;
}

export interface ProductCategory {
  id: string;

  name: string;
}

export interface Product {
  id: string;

  categoryId: string;

  category: ProductCategory;

  name: string;

  slug: string;

  description: string | null;

  sku: string | null;

  unit: string;

  price: number;

  stock: number;

  weight: number;

  featured: boolean;

  isPublished: boolean;

  createdAt: Date;

  updatedAt: Date;

  images: ProductImage[];
}