import { ExternalProductResult } from './CosmosProductService';

/**
 * Busca produto via Go-UPC — catálogo global de EAN/UPC.
 * Free tier: 100 req/mês. Requer EXPO_PUBLIC_GO_UPC_API_KEY.
 * Se a chave não estiver configurada, retorna null silenciosamente.
 * Cadastro gratuito em: https://go-upc.com/api
 */
export class GoUPCProductService {
  private readonly BASE_URL = 'https://go-upc.com/api/v1/code';

  async fetchByBarcode(barcode: string): Promise<ExternalProductResult | null> {
    const apiKey = process.env.EXPO_PUBLIC_GO_UPC_API_KEY;

    // Desabilitado se não houver chave configurada
    if (!apiKey) return null;

    try {
      const response = await fetch(`${this.BASE_URL}/${barcode}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) return null;

      const data = await response.json();

      const name = data.product?.name || '';
      if (!name) return null;

      const brand = data.product?.brand || '';
      const imageUrl = data.product?.imageUrl || '';

      return {
        barcode,
        name,
        brand: brand || undefined,
        imageUrl: imageUrl || undefined,
      };
    } catch (error) {
      console.error('[GoUPCProductService] Erro ao buscar produto:', error);
      return null;
    }
  }
}
