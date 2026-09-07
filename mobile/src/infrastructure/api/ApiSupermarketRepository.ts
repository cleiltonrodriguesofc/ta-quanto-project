import { ISupermarketRepository } from '../../domain/repositories/ISupermarketRepository';
import { Supermarket, NewSupermarket } from '../../domain/entities/Supermarket';
import { apiClient } from './apiClient';

export class ApiSupermarketRepository implements ISupermarketRepository {
  async getAll(): Promise<Supermarket[]> {
    try {
      const response = await apiClient.get<Supermarket[]>('/api/v1/supermarkets');
      return response.data;
    } catch (error) {
      console.error('[ApiSupermarketRepository] Erro ao buscar supermercados:', error);
      return [];
    }
  }

  async add(supermarket: NewSupermarket): Promise<Supermarket> {
    try {
      const response = await apiClient.post<Supermarket>('/api/v1/supermarkets', supermarket);
      return response.data;
    } catch (error) {
      console.error('[ApiSupermarketRepository] Erro ao adicionar supermercado:', error);
      throw error;
    }
  }

  async getNearest(lat: number, lon: number): Promise<Supermarket | null> {
    try {
      const all = await this.getAll();
      if (all.length === 0) return null;

      // Calcula distância Haversine e retorna o mais próximo
      const nearest = all.reduce<{ supermarket: Supermarket; dist: number } | null>((acc, s) => {
        if (!s.location) return acc;
        const dist = haversineDistance(lat, lon, s.location.latitude, s.location.longitude);
        if (!acc || dist < acc.dist) return { supermarket: s, dist };
        return acc;
      }, null);

      return nearest?.supermarket ?? null;
    } catch (error) {
      console.error('[ApiSupermarketRepository] Erro ao buscar supermercado mais próximo:', error);
      return null;
    }
  }
}

/** Distância em km entre dois pontos GPS (fórmula Haversine) */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
