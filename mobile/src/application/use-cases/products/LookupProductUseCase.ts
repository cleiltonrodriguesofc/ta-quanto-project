import { IProductRepository } from '@/src/domain/repositories';
import { Product } from '@/src/domain/entities';
import {
  CosmosProductService,
  OpenFoodFactsProductService,
  UPCItemDBProductService,
} from '@/src/infrastructure/external';

export class LookupProductUseCase {
  private openFoodFacts = new OpenFoodFactsProductService();
  private upcItemDB = new UPCItemDBProductService();
  private cosmos = new CosmosProductService();

  constructor(private productRepo: IProductRepository) {}

  async execute(barcode: string): Promise<Product | null> {
    // 1. Check DB/Cache repository
    const cached = await this.productRepo.getByBarcode(barcode);
    if (cached) {
      console.log('[LookupProductUseCase] Product found in repository cache:', barcode);
      return cached;
    }

    // 2. Fallback: OpenFoodFacts (Public)
    console.log('[LookupProductUseCase] Querying OpenFoodFacts:', barcode);
    const offResult = await this.openFoodFacts.fetchByBarcode(barcode);
    if (offResult && offResult.name) {
      return this.persistAndReturn(offResult);
    }

    // 3. Fallback: UPCitemdb (Public)
    console.log('[LookupProductUseCase] Querying UPCitemdb:', barcode);
    const upcResult = await this.upcItemDB.fetchByBarcode(barcode);
    if (upcResult && upcResult.name) {
      return this.persistAndReturn(upcResult);
    }

    // 4. Fallback: Cosmos API (Private/Paid token)
    console.log('[LookupProductUseCase] Querying Cosmos API:', barcode);
    const cosmosResult = await this.cosmos.fetchByBarcode(barcode);
    if (cosmosResult && cosmosResult.name) {
      return this.persistAndReturn(cosmosResult);
    }

    return null;
  }

  private async persistAndReturn(result: {
    barcode: string;
    name: string;
    brand?: string;
    imageUrl?: string;
    price?: number;
  }): Promise<Product> {
    const product: Product = {
      barcode: result.barcode,
      name: result.name,
      brand: result.brand,
      imageUrl: result.imageUrl,
      avgPrice: result.price,
      createdAt: new Date().toISOString(),
    };

    // Fire and forget cache save
    this.productRepo.save(product).catch(err => {
      console.warn('[LookupProductUseCase] Failed to cache product:', err);
    });

    return product;
  }
}
