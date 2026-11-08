import { IPriceRepository } from '@/src/domain/repositories';
import { Price } from '@/src/domain/entities';

export class GetPricesByBarcodeUseCase {
  constructor(
    private remotePriceRepo: IPriceRepository,
    private localPriceRepo: IPriceRepository,
  ) {}

  async refresh(barcode: string): Promise<Price[]> {
    const prices = await this.remotePriceRepo.getAll(barcode);
    if (prices.length > 0) {
      void this.localPriceRepo.batchUpload(prices).catch(error => {
        console.warn('[GetPricesByBarcodeUseCase] Cache update failed:', error);
      });
    }
    return prices;
  }

  async execute(barcode: string): Promise<Price[]> {
    const cachedPrices = await this.localPriceRepo.getAll(barcode);
    const refresh = this.refresh(barcode).catch(error => {
      console.warn('[GetPricesByBarcodeUseCase] Remote error:', error);
      return cachedPrices;
    });
    return cachedPrices.length > 0 ? cachedPrices : refresh;
  }
}
