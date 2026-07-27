import { IBasketRepository } from '@/src/domain/repositories';
import { BasketItem, NewBasketItem } from '@/src/domain/entities';

export class ManageBasketUseCase {
  constructor(
    private localBasketRepo: IBasketRepository,
    private remoteBasketRepo: IBasketRepository,
  ) {}

  async getItems(userId?: string): Promise<BasketItem[]> {
    if (userId) {
      try {
        const remoteItems = await this.remoteBasketRepo.getItems(userId);
        if (remoteItems.length > 0) {
          return remoteItems;
        }
      } catch (error) {
        console.warn('[ManageBasketUseCase] Remote getItems error:', error);
      }
    }
    return this.localBasketRepo.getItems(userId || '');
  }

  async addItem(userId: string | undefined, item: NewBasketItem): Promise<BasketItem> {
    const fullItem: BasketItem = {
      ...item,
      id: Math.random().toString(36).substring(7),
    };

    await this.localBasketRepo.syncItem(userId || '', fullItem);

    if (userId) {
      this.remoteBasketRepo.syncItem(userId, fullItem).catch(err => {
        console.warn('[ManageBasketUseCase] Remote sync item failed:', err);
      });
    }

    return fullItem;
  }

  async removeItem(userId: string | undefined, itemId: string): Promise<void> {
    await this.localBasketRepo.removeItem(userId || '', itemId);

    if (userId) {
      this.remoteBasketRepo.removeItem(userId, itemId).catch(err => {
        console.warn('[ManageBasketUseCase] Remote remove item failed:', err);
      });
    }
  }

  async updateQuantity(userId: string | undefined, item: BasketItem, newQuantity: number): Promise<BasketItem> {
    const updated: BasketItem = {
      ...item,
      quantity: Math.max(1, newQuantity),
    };

    await this.localBasketRepo.syncItem(userId || '', updated);

    if (userId) {
      this.remoteBasketRepo.syncItem(userId, updated).catch(err => {
        console.warn('[ManageBasketUseCase] Remote update quantity failed:', err);
      });
    }

    return updated;
  }

  async clear(userId?: string): Promise<void> {
    await this.localBasketRepo.clear(userId || '');

    if (userId) {
      this.remoteBasketRepo.clear(userId).catch(err => {
        console.warn('[ManageBasketUseCase] Remote clear failed:', err);
      });
    }
  }
}
