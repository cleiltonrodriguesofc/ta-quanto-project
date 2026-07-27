import { useState, useEffect } from 'react';
import { getSupermarketsUseCase, getNearestSupermarketUseCase } from '@/src/application';
import { asyncStorageSupermarketRepository } from '@/src/infrastructure/storage';
import { Supermarket } from '@/types/supermarket';

export function useSupermarkets() {
  const [supermarkets, setSupermarkets] = useState<Supermarket[]>([]);
  const [nearestSupermarket, setNearestSupermarket] = useState<Supermarket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSupermarkets() {
      try {
        const data = await getSupermarketsUseCase.execute();
        setSupermarkets(data as unknown as Supermarket[]);
        if (data.length > 0) setNearestSupermarket(data[0] as unknown as Supermarket);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch supermarkets');
      } finally {
        setIsLoading(false);
      }
    }
    loadSupermarkets();
  }, []);

  const addSupermarket = async (name: string, type?: string, address?: string) => {
    const newMarket = await asyncStorageSupermarketRepository.add({ name, type, address });
    setSupermarkets(prev => [...prev, newMarket as unknown as Supermarket]);
    return newMarket;
  };

  return { supermarkets, nearestSupermarket, isLoading, error, addSupermarket };
}
