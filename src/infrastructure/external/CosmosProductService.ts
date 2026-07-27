export interface ExternalProductResult {
  name: string;
  brand?: string;
  imageUrl?: string;
  barcode: string;
  price?: number;
}

export class CosmosProductService {
  async fetchByBarcode(barcode: string): Promise<ExternalProductResult | null> {
    const token = process.env.EXPO_PUBLIC_COSMOS_API_TOKEN;
    if (!token) {
      console.error('[CosmosProductService] Token not found in environment');
      return null;
    }

    try {
      const response = await fetch(`https://api.cosmos.bluesoft.com.br/gtins/${barcode}.json`, {
        headers: {
          'X-Cosmos-Token': token,
          'User-Agent': 'Cosmos-API-Request',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();

        let finalImageUrl = data.thumbnail || '';
        if (!finalImageUrl && data.brand?.picture) {
          finalImageUrl = data.brand.picture;
        } else if (!finalImageUrl) {
          finalImageUrl = `https://cdn-cosmos.bluesoft.com.br/products/${barcode}`;
        }

        return {
          name: data.description,
          brand: data.brand ? data.brand.name : '',
          imageUrl: finalImageUrl,
          barcode,
          price: data.avg_price || 0,
        };
      }
      return null;
    } catch (error) {
      console.error('[CosmosProductService] Error calling Cosmos API:', error);
      return null;
    }
  }
}
