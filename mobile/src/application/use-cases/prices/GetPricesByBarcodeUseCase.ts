import { IPriceRepository } from '@/src/domain/repositories';
import { Price } from '@/src/domain/entities';

export class GetPricesByBarcodeUseCase {
  constructor(
    private remotePriceRepo: IPriceRepository,
    private localPriceRepo: IPriceRepository,
  ) {}

  async execute(barcode: string): Promise<Price[]> {
    const cachedPrices = await this.localPriceRepo.getAll(barcode);
    if (cachedPrices.length > 0) {
      // Use device data immediately; refresh shared cache without holding up UI.
      void this.remotePriceRepo.getAll(barcode).then(remotePrices => {
        if (remotePrices.length) {
          return this.localPriceRepo.batchUpload(remotePrices);
        }
      }).catch(error => console.warn('[GetPricesByBarcodeUseCase] Background refresh failed:', error));
      return cachedPrices;
    }

    try {
      const remotePrices = await this.remotePriceRepo.getAll(barcode);
      if (remotePrices.length > 0) return remotePrices;
    } catch (error) {
      console.warn('[GetPricesByBarcodeUseCase] Remote error:', error);
    }

    return cachedPrices;
  }
}
