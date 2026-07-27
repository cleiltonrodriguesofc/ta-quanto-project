import { Price, NewPrice } from '../entities';

export interface IPriceRepository {
  /** Fetch all prices, optionally filtered by barcode */
  getAll(barcode?: string): Promise<Price[]>;

  /** Fetch prices registered by a specific user */
  getByUser(userId: string): Promise<Price[]>;

  /** Add a single price entry */
  add(price: NewPrice): Promise<Price>;

  /** Upload multiple prices at once (migration / sync) */
  batchUpload(prices: NewPrice[]): Promise<void>;
}
