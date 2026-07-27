import { ISupermarketRepository } from '@/src/domain/repositories';
import { Supermarket } from '@/src/domain/entities';

export class GetNearestSupermarketUseCase {
  constructor(private supermarketRepo: ISupermarketRepository) {}

  async execute(lat: number, lon: number): Promise<Supermarket | null> {
    return this.supermarketRepo.getNearest(lat, lon);
  }
}
