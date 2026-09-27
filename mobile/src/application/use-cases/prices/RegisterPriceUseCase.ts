import { IPriceRepository } from '@/src/domain/repositories';
import { NewPrice, Price } from '@/src/domain/entities';

export class RegisterPriceUseCase {
  constructor(
    private localPriceRepo: IPriceRepository,
    private remotePriceRepo: IPriceRepository,
  ) {}

  async execute(price: NewPrice): Promise<Price> {
    try {
      // 1. Try to save remotely first
      const savedRemote = await this.remotePriceRepo.add(price);
      return savedRemote;
    } catch (error) {
      console.warn('[RegisterPriceUseCase] Remote sync failed, saving locally for offline sync:', error);
      // 2. Fallback to local storage if remote fails
      const savedLocal = await this.localPriceRepo.add(price);
      return savedLocal;
    }
  }
}
