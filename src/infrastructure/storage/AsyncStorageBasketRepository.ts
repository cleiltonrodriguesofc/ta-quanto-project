import AsyncStorage from '@react-native-async-storage/async-storage';
import { IBasketRepository } from '@/src/domain/repositories';
import { BasketItem } from '@/src/domain/entities';

const BASKET_KEY = 'taquanto_shopping_basket';

export class AsyncStorageBasketRepository implements IBasketRepository {
  async getItems(_userId?: string): Promise<BasketItem[]> {
    try {
      const stored = await AsyncStorage.getItem(BASKET_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('[AsyncStorageBasketRepository] getItems error:', error);
      return [];
    }
  }

  async syncItem(_userId: string, item: BasketItem): Promise<void> {
    const items = await this.getItems();
    const index = items.findIndex(i => i.id === item.id);
    let updated: BasketItem[];
    if (index >= 0) {
      updated = [...items];
      updated[index] = item;
    } else {
      updated = [...items, item];
    }
    await AsyncStorage.setItem(BASKET_KEY, JSON.stringify(updated));
  }

  async saveAll(items: BasketItem[]): Promise<void> {
    await AsyncStorage.setItem(BASKET_KEY, JSON.stringify(items));
  }

  async removeItem(_userId: string, itemId: string): Promise<void> {
    const items = await this.getItems();
    const updated = items.filter(i => i.id !== itemId);
    await AsyncStorage.setItem(BASKET_KEY, JSON.stringify(updated));
  }

  async clear(_userId?: string): Promise<void> {
    await AsyncStorage.removeItem(BASKET_KEY);
  }
}
