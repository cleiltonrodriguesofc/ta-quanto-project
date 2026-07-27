import { SupabaseClient } from '@supabase/supabase-js';
import { IBasketRepository } from '@/src/domain/repositories';
import { BasketItem } from '@/src/domain/entities';

export class SupabaseBasketRepository implements IBasketRepository {
  constructor(private client: SupabaseClient) {}

  async getItems(userId: string): Promise<BasketItem[]> {
    const { data, error } = await this.client
      .from('basket_items')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return (data || []).map(this.mapToDomain);
  }

  async syncItem(userId: string, item: BasketItem): Promise<void> {
    const { error } = await this.client.from('basket_items').upsert({
      id: item.id,
      user_id: userId,
      barcode: item.barcode,
      productName: item.productName,
      price: item.price,
      quantity: item.quantity,
      supermarket: item.supermarket,
      imageUrl: item.imageUrl,
      timestamp: item.timestamp,
    });

    if (error) throw error;
  }

  async removeItem(userId: string, itemId: string): Promise<void> {
    const { error } = await this.client
      .from('basket_items')
      .delete()
      .eq('id', itemId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  async clear(userId: string): Promise<void> {
    const { error } = await this.client
      .from('basket_items')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
  }

  private mapToDomain(row: any): BasketItem {
    return {
      id: row.id,
      barcode: row.barcode,
      productName: row.productName,
      price: row.price,
      quantity: row.quantity,
      supermarket: row.supermarket,
      imageUrl: row.imageUrl,
      timestamp: row.timestamp,
    };
  }
}
