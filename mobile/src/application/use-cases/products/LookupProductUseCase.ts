import { IProductRepository } from '@/src/domain/repositories';
import { Product } from '@/src/domain/entities';
import {
  OpenBeautyFactsProductService,
  UPCItemDBProductService,
  ExternalProductResult,
} from '@/src/infrastructure/external';

/** Checks the device/server catalog first; only then calls keyless public providers. */
export class LookupProductUseCase {
  private openBeautyFacts = new OpenBeautyFactsProductService();
  private upcItemDB = new UPCItemDBProductService();

  constructor(private productRepo: IProductRepository) {}

  async execute(barcode: string): Promise<Product | null> {
    // ApiProductRepository is the shared backend catalog, after the device cache.
    const cached = await this.productRepo.getByBarcode(barcode);
    if (cached) {
      console.log('[LookupProduct] Shared catalog hit:', barcode);
      return cached;
    }

    console.log('[LookupProduct] Backend miss; querying keyless providers...');
    const result = await this.raceValidResult([
      this.openBeautyFacts.fetchByBarcode(barcode),
      this.upcItemDB.fetchByBarcode(barcode),
    ]);

    if (!result) {
      console.log('[LookupProduct] Product not found in available sources:', barcode);
      return null;
    }

    return this.persistAndReturn(result);
  }

  private async raceValidResult(
    promises: Promise<ExternalProductResult | null>[],
  ): Promise<ExternalProductResult | null> {
    return new Promise(resolve => {
      let settled = 0;
      const total = promises.length;
      promises.forEach(p => {
        p.then(result => {
          if (result?.name) resolve(result);
        }).catch(() => {
          // An individual provider failure does not block the other provider.
        }).finally(() => {
          settled += 1;
          if (settled === total) resolve(null);
        });
      });
    });
  }

  private async persistAndReturn(result: ExternalProductResult): Promise<Product> {
    const product: Product = {
      barcode: result.barcode,
      name: result.name,
      brand: result.brand,
      imageUrl: result.imageUrl,
      avgPrice: result.price,
      createdAt: new Date().toISOString(),
    };
    this.productRepo.save(product).catch(error => {
      console.warn('[LookupProduct] Failed to save provider result:', error);
    });
    return product;
  }
}
