import { IPriceRepository } from '@/src/domain/repositories';
import { NewPrice, Price } from '@/src/domain/entities';

export class RegisterPriceUseCase {
  constructor(
    private localPriceRepo: IPriceRepository,
    private remotePriceRepo: IPriceRepository,
  ) {}

  async execute(price: NewPrice): Promise<Price> {
    // 1. Save locally for instant UI update / offline support
    const savedLocal = await this.localPriceRepo.add(price);

    // 2. Sync with remote
    try {
      await this.remotePriceRepo.add(price);
    } catch (error) {
      console.warn('[RegisterPriceUseCase] Saved locally only. Remote sync failed:', error);
    }

    return savedLocal;
  }
}
