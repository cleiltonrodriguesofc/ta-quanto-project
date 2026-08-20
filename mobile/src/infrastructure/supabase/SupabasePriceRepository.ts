import { SupabaseClient } from '@supabase/supabase-js';
import { IPriceRepository } from '@/src/domain/repositories';
import { Price, NewPrice } from '@/src/domain/entities';

// Deterministic UUID generator for legacy non-UUID IDs
const stringToUuid = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  const fullHex = (hex + hex + hex + hex).substring(0, 32);
  return `${fullHex.substring(0, 8)}-${fullHex.substring(8, 12)}-4${fullHex.substring(13, 16)}-8${fullHex.substring(17, 20)}-${fullHex.substring(20, 32)}`;
};

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class SupabasePriceRepository implements IPriceRepository {
  constructor(private client: SupabaseClient) {}

  async getAll(barcode?: string): Promise<Price[]> {
    let query = this.client
      .from('prices')
      .select('*')
      .order('timestamp', { ascending: false });

    if (barcode) {
      query = query.eq('barcode', barcode);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Supabase error: ${error.message}`);
    return (data || []).map(this.mapToDomain);
  }

  async getByUser(userId: string): Promise<Price[]> {
    const { data, error } = await this.client
      .from('prices')
      .select('*')
      .eq('userId', userId)
      .order('timestamp', { ascending: false })
      .limit(10);

    if (error) {
      console.warn('[SupabasePriceRepository] getByUser error:', error.message);
      return [];
    }
    return (data || []).map(this.mapToDomain);
  }

  async add(price: NewPrice): Promise<Price> {
    const id = (price as any).id || stringToUuid(`${price.barcode}-${price.timestamp}-${Math.random()}`);
    const fullPrice: Price = { ...price, id };

    // Duplicate check (< 1h)
    if (price.barcode) {
      const { data: latest } = await this.client
        .from('prices')
        .select('price, timestamp')
        .eq('barcode', price.barcode)
        .eq('supermarket', price.supermarket)
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latest && latest.price === price.price) {
        const lastTimestamp = latest.timestamp ? new Date(latest.timestamp).getTime() : 0;
        const now = Date.now();
        if (now - lastTimestamp < 60 * 60 * 1000) {
          console.log('[SupabasePriceRepository] Skipping duplicate submission (< 1h ago)');
          return fullPrice;
        }
      }
    }

    const formatted = this.formatForSupabase(fullPrice);
    const { error } = await this.client.from('prices').upsert([formatted]);
    if (error) throw new Error(`Supabase error: ${error.message}`);

    return fullPrice;
  }

  async batchUpload(prices: NewPrice[]): Promise<void> {
    const formattedPrices = prices.map(p => {
      const id = (p as any).id || stringToUuid(`${p.barcode}-${p.timestamp}`);
      return this.formatForSupabase({ ...p, id });
    });
    const { error } = await this.client.from('prices').upsert(formattedPrices);
    if (error) throw new Error(`Supabase error: ${error.message}`);
  }

  private formatForSupabase(price: Price) {
    let finalId = price.id;
    if (!uuidRegex.test(price.id)) {
      finalId = stringToUuid(price.id);
    }

    return {
      id: finalId,
      barcode: price.barcode || null,
      price: price.price,
      supermarket: price.supermarket,
      timestamp: price.timestamp,
      productName: price.productName,
      brand: price.brand || null,
      imageUrl: price.imageUrl || null,
      userId: price.userId || null,
    };
  }

  private mapToDomain(row: any): Price {
    return {
      id: row.id,
      barcode: row.barcode,
      price: row.price,
      supermarket: row.supermarket,
      timestamp: row.timestamp,
      productName: row.productName,
      brand: row.brand,
      imageUrl: row.imageUrl,
      userId: row.userId,
    };
  }
}
