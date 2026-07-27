import { BasketItem, SavedBasket, SavedBasketItem } from '../entities';

/**
 * Manages named, persisted shopping lists (saved_baskets / saved_basket_items tables).
 */
export interface ISavedBasketRepository {
  /** Get all saved lists for a user, ordered by most recent */
  getAll(userId: string): Promise<SavedBasket[]>;

  /** Get the items of a specific saved basket */
  getItems(basketId: string): Promise<SavedBasketItem[]>;

  /**
   * Create a new named basket with its items.
   * Returns the newly created SavedBasket with its ID.
   */
  create(
    userId: string,
    name: string,
    supermarket: string,
    items: BasketItem[],
    totalAmount: number,
  ): Promise<SavedBasket>;

  /**
   * Replace the items and total amount of an existing basket.
   */
  update(
    userId: string,
    basketId: string,
    items: BasketItem[],
    totalAmount: number,
  ): Promise<void>;

  /** Rename a basket */
  rename(userId: string, basketId: string, newName: string): Promise<void>;

  /** Delete a basket and all its items */
  delete(userId: string, basketId: string): Promise<void>;
}
