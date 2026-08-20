import { ISavedBasketRepository } from '@/src/domain/repositories';
import { BasketItem, SavedBasket, SavedBasketItem } from '@/src/domain/entities';

export class ManageSavedBasketUseCase {
  constructor(private savedBasketRepo: ISavedBasketRepository) {}

  async getAll(userId: string): Promise<SavedBasket[]> {
    return this.savedBasketRepo.getAll(userId);
  }

  async getItems(basketId: string): Promise<SavedBasketItem[]> {
    return this.savedBasketRepo.getItems(basketId);
  }

  async create(
    userId: string,
    name: string,
    supermarket: string,
    items: BasketItem[],
    totalAmount: number,
  ): Promise<SavedBasket> {
    return this.savedBasketRepo.create(userId, name, supermarket, items, totalAmount);
  }

  async update(
    userId: string,
    basketId: string,
    items: BasketItem[],
    totalAmount: number,
  ): Promise<void> {
    return this.savedBasketRepo.update(userId, basketId, items, totalAmount);
  }

  async rename(userId: string, basketId: string, newName: string): Promise<void> {
    return this.savedBasketRepo.rename(userId, basketId, newName);
  }

  async delete(userId: string, basketId: string): Promise<void> {
    return this.savedBasketRepo.delete(userId, basketId);
  }
}
