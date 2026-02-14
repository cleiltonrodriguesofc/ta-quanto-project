import AsyncStorage from '@react-native-async-storage/async-storage';
import { PriceEntry } from '@/types/price';
import { UserProfile } from '@/types/user';
import { api, checkApiConnection } from './api';
import { supabase } from './supabase';

const STORAGE_KEY = 'taquanto_prices';
const USER_KEY = 'taquanto_user';
const SYNC_KEY = 'taquanto_synced_at';
const PRODUCTS_KEY = 'taquanto_products';
const SUPERMARKETS_KEY = 'taquanto_supermarkets';

// --- Local Storage Helpers (Legacy/Backup) ---

const getLocalPrices = async (): Promise<PriceEntry[]> => {
  try {
    const storedData = await AsyncStorage.getItem(STORAGE_KEY);
    return storedData ? JSON.parse(storedData) : [];
  } catch (error) {
    console.error('Error getting local prices:', error);
    return [];
  }
};

export const getLocalProducts = async (): Promise<any[]> => {
  try {
    const storedData = await AsyncStorage.getItem(PRODUCTS_KEY);
    return storedData ? JSON.parse(storedData) : [];
  } catch (error) {
    console.error('Error getting local products:', error);
    return [];
  }
};

export const getLocalSupermarkets = async (): Promise<any[]> => {
  try {
    const storedData = await AsyncStorage.getItem(SUPERMARKETS_KEY);
    return storedData ? JSON.parse(storedData) : [];
  } catch (error) {
    console.error('Error getting local supermarkets:', error);
    return [];
  }
};

export const saveLocalProducts = async (products: any[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  } catch (error) {
    console.error('Error saving local products:', error);
  }
};

export const saveLocalSupermarkets = async (supermarkets: any[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(SUPERMARKETS_KEY, JSON.stringify(supermarkets));
  } catch (error) {
    console.error('Error saving local supermarkets:', error);
  }
};

// --- Sync Functionality ---

export const syncLocalData = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const isConnected = await checkApiConnection();
    if (!isConnected) {
      return { success: false, message: 'Cannot connect to server. Check API_URL and network.' };
    }

    // 1. Sync Prices
    const localPrices = await getLocalPrices();
    if (localPrices.length > 0) {
      await api.batchUploadPrices(localPrices);
    }

    // 2. Sync User Profile
    const localUser = await AsyncStorage.getItem(USER_KEY);
    if (localUser) {
      const userProfile = JSON.parse(localUser);
      await api.saveUser(userProfile);
    }

    await AsyncStorage.setItem(SYNC_KEY, new Date().toISOString());
    return { success: true, message: `Synced ${localPrices.length} prices successfully.` };
  } catch (error: any) {
    console.error('Sync error:', error);
    return { success: false, message: error.message || 'Sync failed' };
  }
};

// --- Main Storage API (Switched to Backend) ---

export const getStoredPrices = async (): Promise<PriceEntry[]> => {
  try {
    // 0. Always load local first for speed (Instant)
    const localPrices = await getLocalPrices();

    // 1. Refresh from API in background (Non-blocking)
    const refresh = async () => {
      const isConnected = await checkApiConnection();
      if (isConnected) {
        try {
          const remotePrices = await api.getPrices();
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(remotePrices));
        } catch { }
      }
    };
    refresh();

    // 2. Return cache immediately if available
    if (localPrices.length > 0) {
      return localPrices;
    }

    // 3. Only await if cache is empty
    const isConnected = await checkApiConnection();
    if (isConnected) {
      return await api.getPrices();
    }

    return [];
  } catch (error) {
    console.error('Error getting prices:', error);
    return [];
  }
};

export const savePriceEntry = async (priceEntry: Omit<PriceEntry, 'id'>): Promise<void> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    const newPrice: PriceEntry = {
      ...priceEntry,
      userId: priceEntry.userId || userId,
      id: generateId(),
    };

    // 1. Save locally first (optimistic / backup)
    const existingPrices = await getLocalPrices();
    const updatedPrices = [newPrice, ...existingPrices];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPrices));

    // 2. Send to API
    const isConnected = await checkApiConnection();
    if (isConnected) {
      await api.addPrice(newPrice);
    } else {
      console.warn('Offline: Price saved locally only');
      // TODO: Queue for later sync
    }
  } catch (error) {
    console.error('Error saving price entry:', error);
    throw error;
  }
};

export const clearAllPrices = async (): Promise<void> => {
  // Only clears local for now, maybe shouldn't clear server data easily
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing prices:', error);
    throw error;
  }
};

export const getUserProfile = async (userId?: string): Promise<UserProfile | null> => {
  try {
    let finalId = userId;

    // 1. If no ID provided, try to get from local storage
    if (!finalId) {
      const localData = await AsyncStorage.getItem(USER_KEY);
      if (localData) {
        try {
          const localProfile = JSON.parse(localData);
          finalId = localProfile.id;
        } catch (e) {
          console.error('[Storage] Failed to parse local user data', e);
        }
      }
    }

    // 2. If we still have no ID, try to get from active Supabase session
    if (!finalId) {
      const { data: { session } } = await supabase.auth.getSession();
      finalId = session?.user?.id;
    }

    // 3. If we have an ID and connection, try to fetch from API
    if (finalId) {
      const isConnected = await checkApiConnection();
      if (isConnected) {
        const remoteProfile = await api.getUser(finalId);
        if (remoteProfile) {
          // Update local with remote latest
          await AsyncStorage.setItem(USER_KEY, JSON.stringify(remoteProfile));
          return remoteProfile;
        }
      }
    }

    // 4. Fallback to local storage if API failed or no ID found
    const storedData = await AsyncStorage.getItem(USER_KEY);
    return storedData ? JSON.parse(storedData) : null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

export const saveUserProfile = async (profile: UserProfile): Promise<void> => {
  try {
    // Save local
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(profile));

    // Save remote
    const isConnected = await checkApiConnection();
    if (isConnected) {
      await api.saveUser(profile);
    }
  } catch (error) {
    console.error('Error saving user profile:', error);
    throw error;
  }
};

export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([STORAGE_KEY, USER_KEY, SYNC_KEY, PRODUCTS_KEY, SUPERMARKETS_KEY]);
  } catch (error) {
    console.error('Error clearing all data:', error);
    throw error;
  }
};

export const getProductByBarcode = async (barcode: string): Promise<PriceEntry | null> => {
  try {
    const prices = await getPricesByBarcode(barcode);
    return prices.length > 0 ? prices[0] : null;
  } catch (error) {
    console.error('Error searching product by barcode:', error);
    return null;
  }
};

export const getPricesByBarcode = async (barcode: string): Promise<PriceEntry[]> => {
  try {
    const isConnected = await checkApiConnection();
    if (isConnected) {
      return await api.getPrices(barcode);
    }

    // Fallback local
    const prices = await getLocalPrices();
    return prices
      .filter(p => p.barcode === barcode)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (error) {
    console.error('Error getting prices by barcode:', error);
    return [];
  }
};

const generateId = (): string => {
  return `price_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};