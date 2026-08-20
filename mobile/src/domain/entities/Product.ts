export interface Product {
  barcode: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  /** Average market price from external APIs, if available */
  avgPrice?: number;
  /** ISO date string of when this was first cached */
  createdAt: string;
}

/** Lightweight product reference used inside PriceEntry */
export type ProductRef = Pick<Product, 'barcode' | 'name' | 'brand' | 'imageUrl'>;
