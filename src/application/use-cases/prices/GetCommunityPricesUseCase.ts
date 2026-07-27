import { IPriceRepository } from '@/src/domain/repositories';
import { Price } from '@/src/domain/entities';

export class GetCommunityPricesUseCase {
  constructor(
    private remotePriceRepo: IPriceRepository,
    private localPriceRepo: IPriceRepository,
  ) {}

  async execute(barcode?: string): Promise<Price[]> {
    // Return cache first for speed, then try remote
    try {
      const remotePrices = await this.remotePriceRepo.getAll(barcode);
      if (remotePrices.length > 0) {
        // Background cache update
        this.localPriceRepo.batchUpload(remotePrices).catch(err => {
          console.warn('[GetCommunityPricesUseCase] Failed to update local cache:', err);
        });
        return remotePrices;
      }
    } catch (error) {
      console.warn('[GetCommunityPricesUseCase] Remote fetch failed, falling back to local:', error);
    }

    return this.localPriceRepo.getAll(barcode);
  }
}
