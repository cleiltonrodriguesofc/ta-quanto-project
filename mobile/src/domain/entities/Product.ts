export interface Product {
  barcode: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  /** Average market price from external APIs, if available */
  avgPrice?: number;
  /** ISO date string of when this record was last updated */
  createdAt: string;
  /** Original data provider, kept for attribution and provenance */
  source?: string;
  sourceLicense?: string;
}

export type ProductRef = Pick<Product, 'barcode' | 'name' | 'brand' | 'imageUrl'>;
