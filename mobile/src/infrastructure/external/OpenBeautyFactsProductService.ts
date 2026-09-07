import { ExternalProductResult } from './CosmosProductService';

/**
 * Busca produto na base colaborativa Open Beauty Facts (cosméticos e higiene).
 * Mesma estrutura do Open Food Facts — 100% gratuito, sem API key.
 * Boa cobertura para produtos de higiene pessoal, maquiagem e perfumaria.
 */
export class OpenBeautyFactsProductService {
  private readonly BASE_URL = 'https://world.openbeautyfacts.org/api/v2/product';
  private readonly USER_AGENT = 'TaQuanto/1.0 (contato@taquanto.app)';

  async fetchByBarcode(barcode: string): Promise<ExternalProductResult | null> {
    try {
      const response = await fetch(`${this.BASE_URL}/${barcode}.json`, {
        headers: { 'User-Agent': this.USER_AGENT },
      });

      if (!response.ok) return null;

      const data = await response.json();

      if (data.status !== 1 || !data.product) return null;

      const p = data.product;

      const name =
        p.product_name_pt ||
        p.product_name_en ||
        p.product_name ||
        '';

      if (!name) return null;

      const brand = p.brands?.split(',')[0]?.trim() || '';
      const imageUrl = p.image_front_url || p.image_url || '';

      return {
        barcode,
        name,
        brand: brand || undefined,
        imageUrl: imageUrl || undefined,
      };
    } catch (error) {
      console.error('[OpenBeautyFactsProductService] Erro ao buscar produto:', error);
      return null;
    }
  }
}
