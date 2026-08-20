import { SupabaseClient } from '@supabase/supabase-js';
import { ISupermarketRepository } from '@/src/domain/repositories';
import { Supermarket, NewSupermarket } from '@/src/domain/entities';

// Haversine distance calculator in km
const getDistanceInKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export class SupabaseSupermarketRepository implements ISupermarketRepository {
  constructor(private client: SupabaseClient) {}

  async getAll(): Promise<Supermarket[]> {
    const { data, error } = await this.client
      .from('supermarkets')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw new Error(`Supabase error: ${error.message}`);
    return data || [];
  }

  async add(supermarket: NewSupermarket): Promise<Supermarket> {
    const { data, error } = await this.client
      .from('supermarkets')
      .insert([supermarket])
      .select()
      .single();

    if (error) throw new Error(`Supabase error: ${error.message}`);
    return data;
  }

  async getNearest(lat: number, lon: number): Promise<Supermarket | null> {
    const markets = await this.getAll();
    const marketsWithCoords = markets.filter(m => m.location?.latitude && m.location?.longitude);

    if (marketsWithCoords.length === 0) return markets[0] || null;

    let nearest = marketsWithCoords[0];
    let minDistance = getDistanceInKm(
      lat,
      lon,
      nearest.location!.latitude,
      nearest.location!.longitude,
    );

    for (let i = 1; i < marketsWithCoords.length; i++) {
      const dist = getDistanceInKm(
        lat,
        lon,
        marketsWithCoords[i].location!.latitude,
        marketsWithCoords[i].location!.longitude,
      );
      if (dist < minDistance) {
        minDistance = dist;
        nearest = marketsWithCoords[i];
      }
    }

    return nearest;
  }
}
