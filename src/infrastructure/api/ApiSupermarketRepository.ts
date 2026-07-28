import { ISupermarketRepository } from '../../domain/repositories/ISupermarketRepository';
import { Supermarket } from '../../domain/entities/Supermarket';
import { apiClient } from './apiClient';

export class ApiSupermarketRepository implements ISupermarketRepository {
  async fetchSupermarkets(): Promise<Supermarket[]> {
    try {
      const response = await apiClient.get<Supermarket[]>('/api/v1/supermarkets');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar supermercados na API', error);
      return [];
    }
  }

  async getSupermarketById(id: string): Promise<Supermarket | null> {
    // A rota por ID não foi implementada ainda no backend, mas podemos usar o estado global ou adicionar depois.
    // Como workaround temporário, buscamos todos e filtramos.
    const all = await this.fetchSupermarkets();
    return all.find(s => s.id === id) || null;
  }
}
