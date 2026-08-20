import { IPriceRepository } from '../../domain/repositories/IPriceRepository';
import { Price, NewPrice } from '../../domain/entities/Price';
import { apiClient } from './apiClient';

export class ApiPriceRepository implements IPriceRepository {
  async getCommunityPrices(limit: number = 50): Promise<Price[]> {
    try {
      const response = await apiClient.get<Price[]>('/api/v1/prices', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar preços da comunidade na API', error);
      return [];
    }
  }

  async getPricesByBarcode(barcode: string): Promise<Price[]> {
    try {
      const response = await apiClient.get<Price[]>(`/api/v1/prices/barcode/${barcode}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar preços para barcode ${barcode}`, error);
      return [];
    }
  }

  async registerPrice(price: NewPrice): Promise<Price> {
    try {
      const response = await apiClient.post<Price>('/api/v1/prices', price);
      return response.data;
    } catch (error) {
      console.error('Erro ao registrar preço na API', error);
      throw error;
    }
  }

  async batchUploadPrices(prices: NewPrice[]): Promise<number> {
    // Para simplificar, enviaremos um a um, ou poderíamos criar um endpoint em lote no backend futuramente.
    let count = 0;
    for (const p of prices) {
      try {
        await this.registerPrice(p);
        count++;
      } catch (e) {
        // Ignora erros individuais em lote
      }
    }
    return count;
  }
}
