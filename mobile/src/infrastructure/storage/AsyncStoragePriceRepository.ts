import AsyncStorage from '@react-native-async-storage/async-storage';
import { IPriceRepository } from '@/src/domain/repositories';
import { Price, NewPrice } from '@/src/domain/entities';

const STORAGE_KEY = 'taquanto_prices';
const PENDING_KEY = 'taquanto_pending_prices';

export class AsyncStoragePriceRepository implements IPriceRepository {
  async getAll(barcode?: string): Promise<Price[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const prices: Price[] = stored ? JSON.parse(stored) : [];
      if (barcode) {
        return prices.filter(p => p.barcode === barcode);
      }
      return prices;
    } catch (error) {
      console.error('[AsyncStoragePriceRepository] getAll error:', error);
      return [];
    }
  }

  async getByUser(userId: string): Promise<Price[]> {
    const prices = await this.getAll();
    return prices.filter(p => p.userId === userId);
  }

  add(price: NewPrice): Promise<Price> {
    return this.write(async () => {
      const prices = await this.getAll();
      const id = this.getId(price);
      const fullPrice: Price = { ...price, id };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([fullPrice, ...prices]));
      const pendingIds = await this.getPendingIds();
      await AsyncStorage.setItem(PENDING_KEY, JSON.stringify([...new Set([...pendingIds, id])]));
      return fullPrice;
    });
  }

  async getPending(): Promise<Price[]> {
    const [prices, pendingIds] = await Promise.all([this.getAll(), this.getPendingIds()]);
    const pending = new Set(pendingIds);
    return prices.filter(price => pending.has(price.id));
  }

  markSynced(ids: string[]): Promise<void> {
    return this.write(async () => {
      const synced = new Set(ids);
      const pendingIds = await this.getPendingIds();
      await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(pendingIds.filter(id => !synced.has(id))));
    });
  }

  batchUpload(prices: NewPrice[]): Promise<void> {
    return this.write(async () => {
      const existing = await this.getAll();
      const byId = new Map(existing.map(price => [price.id, price]));
      for (const price of prices) {
        const id = this.getId(price);
        byId.set(id, { ...price, id });
      }
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...byId.values()]));
    });
  }

  clear(): Promise<void> {
    return this.write(async () => {
      await AsyncStorage.removeItem(STORAGE_KEY);
      await AsyncStorage.removeItem(PENDING_KEY);
    });
  }

  private pendingWrite: Promise<unknown> = Promise.resolve();

  private write<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.pendingWrite.then(operation);
    this.pendingWrite = result.catch(() => undefined);
    return result;
  }

  private getId(price: NewPrice): string {
    return ('id' in price && typeof price.id === 'string' && price.id)
      || `price_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private async getPendingIds(): Promise<string[]> {
    try {
      const stored = await AsyncStorage.getItem(PENDING_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
}
