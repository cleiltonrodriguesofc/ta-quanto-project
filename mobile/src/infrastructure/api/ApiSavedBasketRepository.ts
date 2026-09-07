import { BasketItem, SavedBasket, SavedBasketItem } from '../../domain/entities';

export class ApiSavedBasketRepository implements ISavedBasketRepository {
  async getAll(userId: string): Promise<SavedBasket[]> {
    try {
      const response = await apiClient.get('/api/v1/saved-baskets/');
      return response.data.map((b: any) => ({
        id: b.id,
        userId: userId,
        name: b.name,
        supermarket: b.supermarket,
        totalAmount: b.total_amount,
        createdAt: b.created_at,
        updatedAt: b.updated_at,
        itemCount: b.items_count,
      }));
    } catch (error) {
      console.error('Erro ao buscar cestas salvas na API', error);
      return [];
    }
  }

  async getItems(basketId: string): Promise<SavedBasketItem[]> {
    try {
      const response = await apiClient.get(`/api/v1/saved-baskets/${basketId}/items`);
      return response.data.map((i: any) => ({
        id: i.id,
        basketId: basketId,
        barcode: i.barcode,
        productName: i.product_name || i.productName,
        price: i.price,
        quantity: i.quantity,
        imageUrl: i.image_url || i.imageUrl,
        brand: i.brand
      }));
    } catch (error) {
      console.error('Erro ao buscar itens da cesta na API', error);
      return [];
    }
  }

  async create(
    userId: string,
    name: string,
    supermarket: string,
    items: BasketItem[],
    totalAmount: number,
  ): Promise<SavedBasket> {
    try {
      const response = await apiClient.post('/api/v1/saved-baskets/', {
        name: name,
        supermarket: supermarket,
        total_amount: totalAmount,
        items: items.map(item => ({
          barcode: item.barcode,
          product_name: item.productName,
          price: item.price,
          quantity: item.quantity,
          image_url: item.imageUrl,
          brand: item.brand,
        }))
      });
      const b = response.data;
      return {
        id: b.id,
        userId: userId,
        name: b.name,
        supermarket: b.supermarket,
        totalAmount: b.total_amount,
        createdAt: b.created_at,
        updatedAt: b.updated_at,
        itemCount: b.items_count,
      };
    } catch (error) {
      console.error('Erro ao criar cesta na API', error);
      throw error;
    }
  }

  async update(
    userId: string,
    basketId: string,
    items: BasketItem[],
    totalAmount: number,
  ): Promise<void> {
    try {
      await apiClient.put(`/api/v1/saved-baskets/${basketId}`, {
        total_amount: totalAmount,
        items: items.map(item => ({
          barcode: item.barcode,
          product_name: item.productName,
          price: item.price,
          quantity: item.quantity,
          image_url: item.imageUrl,
          brand: item.brand,
        }))
      });
    } catch (error) {
      console.error('Erro ao atualizar cesta na API', error);
      throw error;
    }
  }

  async rename(userId: string, basketId: string, newName: string): Promise<void> {
    try {
      await apiClient.patch(`/api/v1/saved-baskets/${basketId}`, {
        name: newName
      });
    } catch (error) {
      console.error('Erro ao renomear cesta na API', error);
      throw error;
    }
  }

  async delete(userId: string, basketId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/v1/saved-baskets/${basketId}`);
    } catch (error) {
      console.error('Erro ao deletar cesta salva na API', error);
      throw error;
    }
  }
}
