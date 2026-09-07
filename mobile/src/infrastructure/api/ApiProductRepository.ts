import { IProductRepository } from '../../domain/repositories/IProductRepository';
import { Product } from '../../domain/entities/Product';
import { apiClient } from './apiClient';

/**
 * ApiProductRepository — busca produto via backend FastAPI.
 * Nota: a busca principal de produto é feita diretamente no mobile
 * via LookupProductUseCase (Cosmos + OpenFoodFacts + etc).
 * Este repositório é um fallback via backend, usado pelo supabaseProductRepository.
 */
export class ApiProductRepository implements IProductRepository {
  async getByBarcode(barcode: string): Promise<Product | null> {
    try {
      const response = await apiClient.get<Product>(`/api/v1/products/${barcode}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      console.error('[ApiProductRepository] Erro ao buscar produto:', error);
      return null;
    }
  }

  async save(product: Omit<Product, 'createdAt'> & { createdAt?: string }): Promise<void> {
    try {
      await apiClient.post('/api/v1/products', {
        barcode: product.barcode,
        name: product.name,
        brand: product.brand,
        image_url: product.imageUrl,
        avg_price: product.avgPrice,
      });
    } catch (error) {
      // Falha silenciosa — cache é best-effort
      console.warn('[ApiProductRepository] Falha ao salvar produto no backend:', error);
    }
  }
}
