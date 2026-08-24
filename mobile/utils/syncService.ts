import { api } from './api';
import { getStoredPrices, clearStoredPrices, saveLocalProducts, saveLocalSupermarkets } from './storage';
import { getSupermarketsUseCase } from '@/src/application';

export const syncOfflineData = async (): Promise<{ syncedCount: number; errors: string[] }> => {
  const errors: string[] = [];
  let syncedCount = 0;

  try {
    const offlinePrices = await getStoredPrices();
    if (offlinePrices.length > 0) {
      await api.uploadPricesBatch(offlinePrices);
      syncedCount = offlinePrices.length;
      await clearStoredPrices();
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
