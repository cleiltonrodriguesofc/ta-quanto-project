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

  async add(price: NewPrice): Promise<Price> {
    const prices = await this.getAll();
    const id = (price as any).id || `price_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const fullPrice: Price = { ...price, id };
    const updated = [fullPrice, ...prices];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    const pendingIds = await this.getPendingIds();
    await AsyncStorage.setItem(PENDING_KEY, JSON.stringify([...new Set([...pendingIds, id])]));
    return fullPrice;
  }

  async getPending(): Promise<Price[]> {
    const [prices, pendingIds] = await Promise.all([this.getAll(), this.getPendingIds()]);
    const pending = new Set(pendingIds);
    return prices.filter(price => pending.has(price.id));
  }

  async markSynced(ids: string[]): Promise<void> {
    if (!ids.length) return;
    const synced = new Set(ids);
    const pendingIds = await this.getPendingIds();
    await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(pendingIds.filter(id => !synced.has(id))));
  }

  async batchUpload(prices: NewPrice[]): Promise<void> {
    const existing = await this.getAll();
    const formatted = prices.map(p => ({
      ...p,
      id: (p as any).id || `price_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    }));
    const updated = [...formatted, ...existing];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEY);
    await AsyncStorage.removeItem(PENDING_KEY);
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
