import { SupabaseClient } from '@supabase/supabase-js';
import { ISavedBasketRepository } from '@/src/domain/repositories';
import { BasketItem, SavedBasket, SavedBasketItem } from '@/src/domain/entities';

export class SupabaseSavedBasketRepository implements ISavedBasketRepository {
  constructor(private client: SupabaseClient) {}

  async getAll(userId: string): Promise<SavedBasket[]> {
    const { data, error } = await this.client
      .from('saved_baskets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(this.mapSavedBasketToDomain);
  }

  async getItems(basketId: string): Promise<SavedBasketItem[]> {
    const { data, error } = await this.client
      .from('saved_basket_items')
      .select('*')
      .eq('basket_id', basketId);

    if (error) throw error;
    return (data || []).map(this.mapSavedBasketItemToDomain);
  }

  async create(
    userId: string,
    name: string,
    supermarket: string,
    items: BasketItem[],
    totalAmount: number,
  ): Promise<SavedBasket> {
    const rpcItems = items.map(item => ({
      barcode: item.barcode,
      productName: item.productName,
      price: item.price,
      quantity: item.quantity,
      imageUrl: item.imageUrl,
    }));

    const { data, error } = await this.client.rpc('create_basket', {
      p_name: name,
      p_supermarket: supermarket,
      p_total_amount: totalAmount,
      p_item_count: items.length,
      p_items: rpcItems,
    });

    if (error) throw error;
    if (data && !data.success) {
      throw new Error(data.error || 'Failed to create saved basket via RPC');
    }

    return {
      id: data.id,
      userId,
      name,
      supermarket,
      totalAmount,
      itemCount: items.length,
      createdAt: new Date().toISOString(),
    };
  }

  async update(
    userId: string,
    basketId: string,
    items: BasketItem[],
    totalAmount: number,
  ): Promise<void> {
    const rpcItems = items.map(item => ({
      barcode: item.barcode,
      productName: item.productName,
      price: item.price,
      quantity: item.quantity,
      imageUrl: item.imageUrl,
    }));

    const { data, error } = await this.client.rpc('update_basket_details', {
      p_basket_id: basketId,
      p_total_amount: totalAmount,
      p_item_count: items.length,
      p_items: rpcItems,
    });

    if (error) throw error;
    if (data && !data.success) {
      throw new Error(data.error || 'Failed to update basket via RPC');
    }
  }

  async rename(userId: string, basketId: string, newName: string): Promise<void> {
    const { data, error } = await this.client.rpc('rename_basket', {
      p_basket_id: basketId,
      p_new_name: newName,
    });

    if (error) throw error;
    if (data && !data.success) {
      throw new Error(data.error || 'Failed to rename basket via RPC');
    }
  }

  async delete(userId: string, basketId: string): Promise<void> {
    const { data, error } = await this.client.rpc('delete_basket', {
      basket_id: basketId,
    });

    if (error) throw error;
    if (data && !data.success) {
      throw new Error(data.error || 'Failed to delete basket via RPC');
    }
  }

  private mapSavedBasketToDomain(row: any): SavedBasket {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      supermarket: row.supermarket,
      totalAmount: row.total_amount,
      itemCount: row.item_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapSavedBasketItemToDomain(row: any): SavedBasketItem {
    return {
      id: row.id,
      basketId: row.basket_id,
      barcode: row.barcode,
      productName: row.product_name || row.productName,
      price: row.price,
      quantity: row.quantity,
      imageUrl: row.image_url || row.imageUrl,
    };
  }
}
