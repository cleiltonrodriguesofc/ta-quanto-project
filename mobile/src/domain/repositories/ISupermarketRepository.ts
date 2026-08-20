import { Supermarket, NewSupermarket } from '../entities';

export interface ISupermarketRepository {
  /** Get all supermarkets */
  getAll(): Promise<Supermarket[]>;

  /** Add a new supermarket */
  add(supermarket: NewSupermarket): Promise<Supermarket>;

  /**
   * Find the nearest supermarket to a GPS coordinate.
   * Returns null if the list is empty or none can be determined.
   */
  getNearest(lat: number, lon: number): Promise<Supermarket | null>;
}
