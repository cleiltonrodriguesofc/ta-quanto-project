import { IPriceRepository } from '@/src/domain/repositories';
import { Price } from '@/src/domain/entities';

export class GetPricesByBarcodeUseCase {
  constructor(
    private remotePriceRepo: IPriceRepository,
    private localPriceRepo: IPriceRepository,
  ) {}

  async execute(barcode: string): Promise<Price[]> {
    try {
      const remotePrices = await this.remotePriceRepo.getAll(barcode);
      if (remotePrices.length > 0) return remotePrices;
    } catch (error) {
      console.warn('[GetPricesByBarcodeUseCase] Remote error:', error);
    }

    return this.localPriceRepo.getAll(barcode);
  }
}
