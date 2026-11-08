import { IProductRepository } from '../../domain/repositories/IProductRepository';
import { Product } from '../../domain/entities/Product';
import { apiClient } from './apiClient';

function fromApi(data: any): Product {
  return {
    barcode: String(data.barcode),
    name: data.name,
    brand: data.brand || undefined,
    imageUrl: data.image_url || data.imageUrl || undefined,
    avgPrice: data.avg_price ?? data.avgPrice ?? undefined,
    createdAt: data.updated_at || data.created_at || new Date().toISOString(),
    source: data.source || undefined,
    sourceLicense: data.source_license || undefined,
  };
}

export class ApiProductRepository implements IProductRepository {
  async getByBarcode(barcode: string): Promise<Product | null> {
    try {
      const response = await apiClient.get<any>(`/api/v1/products/${encodeURIComponent(barcode)}`);
      return fromApi(response.data);
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      console.error('[ApiProductRepository] Erro ao buscar produto:', error);
      return null;
    }
  }

  async save(product: Omit<Product, 'createdAt'> & { createdAt?: string }): Promise<void> {
    try {
      await apiClient.post('/api/v1/products/', {
        barcode: product.barcode,
        name: product.name,
        brand: product.brand,
        image_url: product.imageUrl,
        categories: [],
      });
    } catch (error) {
      console.warn('[ApiProductRepository] Falha ao salvar produto no backend:', error);
    }
  }
}
