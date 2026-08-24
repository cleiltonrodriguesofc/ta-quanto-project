import {
  getSupermarketsUseCase,
  getNearestSupermarketUseCase,
  getProductsBySupermarketUseCase,
} from '@/src/application';
import { Supermarket } from '@/types/supermarket';
import { getLocalSupermarkets } from './storage';

export async function fetchSupermarkets(): Promise<Supermarket[]> {
  try {
    const markets = await getSupermarketsUseCase.execute();
    return markets as unknown as Supermarket[];
  } catch (error) {
    console.warn('[supermarketService] Fallback to local storage:', error);
    return getLocalSupermarkets();
  }
}

export async function findNearestSupermarket(
  lat: number,
  lon: number,
): Promise<Supermarket | null> {
  const market = await getNearestSupermarketUseCase.execute(lat, lon);
  return market as unknown as Supermarket | null;
}

export async function getProductsBySupermarketName(supermarketName: string) {
  return getProductsBySupermarketUseCase.execute(supermarketName);
}

export async function getSupermarketById(id: string | number): Promise<Supermarket | null> {
  const markets = await fetchSupermarkets();
  return markets.find(m => String(m.id) === String(id)) || null;
}

/** Alias utilizado pelas telas — equivale a fetchSupermarkets */
export const getSupermarkets = fetchSupermarkets;
