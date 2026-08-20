import { ExternalProductResult } from './CosmosProductService';

export class OpenFoodFactsProductService {
  async fetchByBarcode(barcode: string): Promise<ExternalProductResult | null> {
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await response.json();

      if (data.status === 1 && data.product) {
        return {
          barcode,
          name: data.product.product_name || '',
          brand: data.product.brands || '',
          imageUrl: data.product.image_url || '',
        };
      }
      return null;
    } catch (error) {
      console.error('[OpenFoodFactsProductService] Error fetching from OpenFoodFacts:', error);
      return null;
    }
  }
}
