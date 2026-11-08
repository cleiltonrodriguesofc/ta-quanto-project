import { IBasketRepository } from '@/src/domain/repositories';
import { BasketItem, NewBasketItem } from '@/src/domain/entities';

/**
 * The active shopping basket is local-first and device-scoped.
 * Saved baskets are handled by ManageSavedBasketUseCase and its separate API.
 */
export class ManageBasketUseCase {
  constructor(private localBasketRepo: IBasketRepository) {}

  async getItems(userId?: string): Promise<BasketItem[]> {
    return this.localBasketRepo.getItems(userId || '');
  }

  async addItem(userId: string | undefined, item: NewBasketItem): Promise<BasketItem> {
    const fullItem: BasketItem = { ...item, id: Math.random().toString(36).substring(7) };
    await this.localBasketRepo.syncItem(userId || '', fullItem);
    return fullItem;
  }

  async removeItem(userId: string | undefined, itemId: string): Promise<void> {
    await this.localBasketRepo.removeItem(userId || '', itemId);
  }

  async updateQuantity(userId: string | undefined, item: BasketItem, newQuantity: number): Promise<BasketItem> {
    const updated: BasketItem = { ...item, quantity: Math.max(1, newQuantity) };
    await this.localBasketRepo.syncItem(userId || '', updated);
    return updated;
  }

  async clear(userId?: string): Promise<void> {
    await this.localBasketRepo.clear(userId || '');
  }
}
