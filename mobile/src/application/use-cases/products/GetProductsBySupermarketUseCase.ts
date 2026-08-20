import { IPriceRepository } from '@/src/domain/repositories';
import { ProductRef } from '@/src/domain/entities';

export class GetProductsBySupermarketUseCase {
  constructor(private priceRepo: IPriceRepository) {}

  async execute(supermarketName: string): Promise<ProductRef[]> {
    const prices = await this.priceRepo.getAll();

    // Filter by supermarket and deduplicate by barcode/name
    const supermarketPrices = prices.filter(p => p.supermarket === supermarketName);
    const productMap = new Map<string, ProductRef>();

    for (const price of supermarketPrices) {
      const key = price.barcode || price.productName;
      if (!productMap.has(key)) {
        productMap.set(key, {
          barcode: price.barcode || '',
          name: price.productName,
          brand: price.brand,
          imageUrl: price.imageUrl,
        });
      }
    }

    return Array.from(productMap.values());
  }
}
