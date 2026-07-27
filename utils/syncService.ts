import { api } from './api';
import { getStoredPrices, clearStoredPrices, saveLocalProducts, saveLocalSupermarkets } from './storage';

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
