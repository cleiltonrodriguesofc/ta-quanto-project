import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveLocalSupermarkets } from './storage';
import { getSupermarketsUseCase } from '@/src/application';
import { asyncStoragePriceRepository } from '@/src/infrastructure/storage';
import { apiPriceRepository } from '@/src/infrastructure/api';

let activePriceSync: Promise<{ syncedCount: number; errors: string[] }> | null = null;

export const syncOfflineData = async (): Promise<{ syncedCount: number; errors: string[] }> => {
  if (activePriceSync) return activePriceSync;
  activePriceSync = runPriceSync();
  try {
    return await activePriceSync;
  } finally {
    activePriceSync = null;
  }
};

const runPriceSync = async (): Promise<{ syncedCount: number; errors: string[] }> => {
  const errors: string[] = [];
  let syncedCount = 0;

  // Só sincroniza se o usuário estiver autenticado
  const token = await AsyncStorage.getItem('@auth_access_token');
  if (!token) {
    return { syncedCount: 0, errors: [] };
  }

  try {
    const offlinePrices = await asyncStoragePriceRepository.getPending();
    if (offlinePrices.length > 0) {
      for (const price of offlinePrices) {
        try {
          await apiPriceRepository.add(price);
          await asyncStoragePriceRepository.markSynced([price.id]);
          syncedCount += 1;
        } catch (error: any) {
          errors.push(error?.message || 'Price sync failed');
        }
      }
    }
  } catch (error: any) {
    console.error('[syncService] Error syncing offline data:', error);
    errors.push(error.message || 'Unknown sync error');
  }

  return { syncedCount, errors };
};

/**
 * Baixa dados do servidor (supermercados) e salva localmente
 * para uso offline. Chamado após o login bem-sucedido.
 */
export const hydrateLocalCache = async (): Promise<void> => {
  try {
    const supermarkets = await getSupermarketsUseCase.execute().catch(() => []);
    if (supermarkets.length > 0) {
      // Converte para o formato esperado pelo storage
      const raw = supermarkets.map((s: any) => ({ id: s.id, name: s.name, address: s.address }));
      await saveLocalSupermarkets(raw as any);
    }
    console.log('[syncService] Cache local hidratado com sucesso');
  } catch (error: any) {
    console.warn('[syncService] Falha ao hidratar cache:', error.message);
  }
};
