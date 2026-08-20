import { IProductRepository } from '../../domain/repositories/IProductRepository';
import { Product } from '../../domain/entities/Product';
import { apiClient } from './apiClient';

export class ApiProductRepository implements IProductRepository {
  async lookupProduct(barcode: string): Promise<Product | null> {
    try {
      // O backend já faz a cascata (Banco -> OpenFoodFacts -> Cosmos)
      const response = await apiClient.get<Product>(`/api/v1/products/${barcode}`);
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        return null; // Produto não encontrado
      }
      console.error('Erro na chamada API de lookupProduct', error);
      return null;
    }
  }
}
