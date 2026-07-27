import { Product } from '../entities';

export interface IProductRepository {
  /** Get a product from the local/remote cache by barcode */
  getByBarcode(barcode: string): Promise<Product | null>;

  /** Persist product metadata to cache */
  save(product: Omit<Product, 'createdAt'> & { createdAt?: string }): Promise<void>;
}
