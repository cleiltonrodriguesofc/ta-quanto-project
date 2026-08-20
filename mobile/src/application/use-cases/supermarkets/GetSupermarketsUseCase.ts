import { ISupermarketRepository } from '@/src/domain/repositories';
import { Supermarket } from '@/src/domain/entities';

export class GetSupermarketsUseCase {
  constructor(
    private remoteSupermarketRepo: ISupermarketRepository,
    private localSupermarketRepo: ISupermarketRepository,
  ) {}

  async execute(): Promise<Supermarket[]> {
    try {
      const remote = await this.remoteSupermarketRepo.getAll();
      if (remote.length > 0) return remote;
    } catch (error) {
      console.warn('[GetSupermarketsUseCase] Remote fetch error:', error);
    }
    return this.localSupermarketRepo.getAll();
  }
}
