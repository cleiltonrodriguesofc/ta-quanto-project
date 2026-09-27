import { IPriceRepository } from '../../domain/repositories/IPriceRepository';
import { Price, NewPrice } from '../../domain/entities/Price';
import { apiClient } from './apiClient';

export class ApiPriceRepository implements IPriceRepository {
  private mapToPrice(data: any): Price {
    return {
      id: data.id,
      productName: data.product_name,
      barcode: data.barcode,
      price: data.price,
      supermarket: data.supermarket,
      brand: data.brand,
      imageUrl: data.image_url,
      timestamp: data.created_at,
      userId: data.user_id,
      location: (data.latitude && data.longitude) ? {
        latitude: data.latitude,
        longitude: data.longitude
      } : undefined
    };
  }

  async getAll(barcode?: string): Promise<Price[]> {
    try {
      if (barcode) {
        const response = await apiClient.get<any[]>(`/api/v1/prices/barcode/${barcode}`);
        return response.data.map(p => this.mapToPrice(p));
      }
      const response = await apiClient.get<any[]>('/api/v1/prices', {
        params: { limit: 100 }
      });
      return response.data.map(p => this.mapToPrice(p));
    } catch (error) {
      console.error('Erro ao buscar preços na API', error);
      return [];
    }
  }

  async getByUser(userId: string): Promise<Price[]> {
    try {
      const response = await apiClient.get<any[]>(`/api/v1/prices/user/${userId}`);
      return response.data.map(p => this.mapToPrice(p));
    } catch (error) {
      console.error(`Erro ao buscar preços para o usuário ${userId}`, error);
      return [];
    }
  }

  async add(price: NewPrice): Promise<Price> {
    try {
      const response = await apiClient.post<any>('/api/v1/prices', {
        product_name: price.productName,
        barcode: price.barcode,
        price: price.price,
        supermarket: price.supermarket,
        brand: price.brand,
        image_url: price.imageUrl,
        latitude: price.location?.latitude,
        longitude: price.location?.longitude,
      });
      return this.mapToPrice(response.data);
    } catch (error) {
      console.error('Erro ao registrar preço na API', error);
      throw error;
    }
  }

  async batchUpload(prices: NewPrice[]): Promise<void> {
    const failed: NewPrice[] = [];
    for (const p of prices) {
      try {
        await this.add(p);
      } catch (e) {
        failed.push(p);
      }
    }
    
    if (failed.length === prices.length && prices.length > 0) {
      throw new Error('Todas as tentativas de upload falharam. Possivelmente offline.');
    }
    
    // Ideally we should only clear the successful ones from local storage, 
    // but for now, we just throw if EVERYTHING fails so we don't wipe the queue.
  }
}
