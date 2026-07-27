import AsyncStorage from '@react-native-async-storage/async-storage';
import { ISupermarketRepository } from '@/src/domain/repositories';
import { Supermarket, NewSupermarket } from '@/src/domain/entities';

const SUPERMARKETS_KEY = 'taquanto_supermarkets';

export class AsyncStorageSupermarketRepository implements ISupermarketRepository {
  async getAll(): Promise<Supermarket[]> {
    try {
      const stored = await AsyncStorage.getItem(SUPERMARKETS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('[AsyncStorageSupermarketRepository] getAll error:', error);
      return [];
    }
  }

  async add(supermarket: NewSupermarket): Promise<Supermarket> {
    const markets = await this.getAll();
    const newMarket: Supermarket = {
      ...supermarket,
      id: Date.now(),
    };
    const updated = [...markets, newMarket];
    await AsyncStorage.setItem(SUPERMARKETS_KEY, JSON.stringify(updated));
    return newMarket;
  }

  async saveAll(supermarkets: Supermarket[]): Promise<void> {
    await AsyncStorage.setItem(SUPERMARKETS_KEY, JSON.stringify(supermarkets));
  }

  async getNearest(_lat: number, _lon: number): Promise<Supermarket | null> {
    const markets = await this.getAll();
    return markets.length > 0 ? markets[0] : null;
  }
}
