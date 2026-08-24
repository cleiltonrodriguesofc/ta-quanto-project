import { IPriceRepository } from '@/src/domain/repositories';
import { Price } from '@/src/domain/entities';

export class GetProductsBySupermarketUseCase {
  constructor(private priceRepo: IPriceRepository) {}

  async execute(supermarketName: string): Promise<Price[]> {
    const prices = await this.priceRepo.getAll();

    // Filter by supermarket and deduplicate by barcode/name, keeping the latest price
    const supermarketPrices = prices.filter(p => p.supermarket === supermarketName);
    const productMap = new Map<string, Price>();

    for (const price of supermarketPrices) {
      const key = price.barcode || price.productName;
      if (!productMap.has(key)) {
        productMap.set(key, price);
      } else {
        const existing = productMap.get(key)!;
        if (new Date(price.timestamp).getTime() > new Date(existing.timestamp).getTime()) {
           productMap.set(key, price);
        }
      }
    }

    return Array.from(productMap.values());
  }
}
