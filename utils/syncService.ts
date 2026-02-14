import { api } from './api';
import { getProducts } from './productService';
import { getSupermarkets } from './supermarketService';
import { saveLocalProducts, saveLocalSupermarkets } from './storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'taquanto_prices';
const SYNC_KEY = 'taquanto_synced_at';

export const hydrateLocalCache = async (): Promise<void> => {
    try {
        console.log('[Sync] Starting full hydration...');

        // 1. Fetch all data in parallel
        const [prices, products, supermarkets] = await Promise.all([
            api.getPrices(),
            getProducts(),
            getSupermarkets()
        ]);

        // 2. Persist to AsyncStorage
        await Promise.all([
            AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prices)),
            saveLocalProducts(products),
            saveLocalSupermarkets(supermarkets),
            AsyncStorage.setItem(SYNC_KEY, new Date().toISOString())
        ]);

        console.log(`[Sync] Hydration complete: ${prices.length} prices, ${products.length} products, ${supermarkets.length} supermarkets.`);
    } catch (error) {
        console.error('[Sync] Hydration failed:', error);
        throw error;
    }
};

export const isCacheStale = async (maxAgeHours: number = 24): Promise<boolean> => {
    try {
        const lastSync = await AsyncStorage.getItem(SYNC_KEY);
        if (!lastSync) return true;

        const lastSyncDate = new Date(lastSync);
        const now = new Date();
        const diffMs = now.getTime() - lastSyncDate.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        return diffHours > maxAgeHours;
    } catch {
        return true;
    }
};
