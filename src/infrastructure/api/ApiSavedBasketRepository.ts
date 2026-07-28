import { ISavedBasketRepository, SavedBasketData, SavedBasketItemData } from '../../domain/repositories/ISavedBasketRepository';
import { apiClient } from './apiClient';

export class ApiSavedBasketRepository implements ISavedBasketRepository {
  async saveBasket(userId: string, data: SavedBasketData): Promise<string> {
    try {
      const response = await apiClient.post('/api/v1/saved-baskets', {
        name: data.name,
        supermarket: data.supermarket,
        total_amount: data.totalAmount,
        items: data.items.map(item => ({
          barcode: item.barcode,
          product_name: item.productName,
          price: item.price,
          quantity: item.quantity,
          image_url: item.imageUrl,
          brand: item.brand,
        }))
      });
      return response.data.id;
    } catch (error) {
      console.error('Erro ao salvar cesta na API', error);
      throw error;
    }
  }

  async getSavedBaskets(userId: string): Promise<any[]> {
    try {
      const response = await apiClient.get('/api/v1/saved-baskets');
      return response.data.map((b: any) => ({
        id: b.id,
        user_id: userId,
        name: b.name,
        supermarket: b.supermarket,
        total_amount: b.total_amount,
        created_at: b.created_at,
        updated_at: b.updated_at,
        items_count: b.items_count,
        items: []
      }));
    } catch (error) {
      console.error('Erro ao buscar cestas salvas na API', error);
      return [];
    }
  }

  async getBasketItems(basketId: string): Promise<SavedBasketItemData[]> {
    try {
      const response = await apiClient.get(`/api/v1/saved-baskets/${basketId}/items`);
      return response.data.map((i: any) => ({
        id: i.id,
        basket_id: basketId,
        barcode: i.barcode,
        productName: i.product_name,
        price: i.price,
        quantity: i.quantity,
        imageUrl: i.image_url,
        brand: i.brand
      }));
    } catch (error) {
      console.error('Erro ao buscar itens da cesta na API', error);
      return [];
    }
  }

  async deleteSavedBasket(basketId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/v1/saved-baskets/${basketId}`);
    } catch (error) {
      console.error('Erro ao deletar cesta salva na API', error);
      throw error;
    }
  }

  async getBasketById(basketId: string): Promise<any> {
    // This is optional if needed by the frontend specifically.
    return null;
  }
}
