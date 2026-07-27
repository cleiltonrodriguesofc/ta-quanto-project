import { BasketItem, NewBasketItem } from '../entities';

/**
 * Manages the ephemeral shopping session basket (basket_items table).
 * This is the in-progress basket a user builds while shopping.
 */
export interface IBasketRepository {
  /** Load all basket items for a user */
  getItems(userId: string): Promise<BasketItem[]>;

  /** Add or update a basket item (upsert by id) */
  syncItem(userId: string, item: BasketItem): Promise<void>;

  /** Remove a specific item */
  removeItem(userId: string, itemId: string): Promise<void>;

  /** Clear all items in the basket */
  clear(userId: string): Promise<void>;
}
