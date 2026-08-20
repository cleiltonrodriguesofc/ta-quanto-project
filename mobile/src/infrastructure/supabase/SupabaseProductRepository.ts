import { SupabaseClient } from '@supabase/supabase-js';
import { IProductRepository } from '@/src/domain/repositories';
import { Product } from '@/src/domain/entities';

export class SupabaseProductRepository implements IProductRepository {
  constructor(private client: SupabaseClient) {}

  async getByBarcode(barcode: string): Promise<Product | null> {
    try {
      const { data, error } = await this.client
        .from('products')
        .select('*')
        .eq('barcode', barcode)
        .maybeSingle();

      if (error || !data) return null;

      return {
        barcode: data.barcode,
        name: data.name,
        brand: data.brand,
        imageUrl: data.imageUrl,
        createdAt: data.createdAt || new Date().toISOString(),
      };
    } catch (err) {
      console.error('[SupabaseProductRepository] getByBarcode error:', err);
      return null;
    }
  }

  async save(product: Omit<Product, 'createdAt'> & { createdAt?: string }): Promise<void> {
    const upsertData = {
      barcode: product.barcode,
      name: product.name,
      brand: product.brand || null,
      imageUrl: product.imageUrl || null,
      createdAt: product.createdAt || new Date().toISOString(),
    };

    try {
      const { error } = await this.client.from('products').upsert([upsertData], { onConflict: 'barcode' });
      if (error && error.code !== '42501') {
        console.error('[SupabaseProductRepository] Failed to save product:', error);
      }
    } catch (err) {
      console.error('[SupabaseProductRepository] Save error:', err);
    }
  }
}
