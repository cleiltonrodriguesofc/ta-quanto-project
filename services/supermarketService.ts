import { getSupermarketsUseCase, getNearestSupermarketUseCase } from '@/src/application';
import { Supermarket } from '@/types/supermarket';

export async function fetchSupermarkets(): Promise<Supermarket[]> {
  const markets = await getSupermarketsUseCase.execute();
  return markets as unknown as Supermarket[];
}

export async function findNearestSupermarket(lat: number, lon: number): Promise<Supermarket | null> {
  const market = await getNearestSupermarketUseCase.execute(lat, lon);
  return market as unknown as Supermarket | null;
}
