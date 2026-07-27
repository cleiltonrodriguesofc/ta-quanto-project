import { ExternalProductResult } from './CosmosProductService';

export class UPCItemDBProductService {
  async fetchByBarcode(barcode: string): Promise<ExternalProductResult | null> {
    try {
      const response = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`);
      const data = await response.json();

      if (data.code === 'OK' && data.items && data.items.length > 0) {
        const item = data.items[0];
        return {
          barcode,
          name: item.title,
          brand: item.brand,
          imageUrl: item.images && item.images.length > 0 ? item.images[0] : undefined,
        };
      }
      return null;
    } catch (error) {
      console.error('[UPCItemDBProductService] Error fetching from UPCitemdb:', error);
      return null;
    }
  }
}
