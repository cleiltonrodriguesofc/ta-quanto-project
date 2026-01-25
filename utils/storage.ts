import AsyncStorage from '@react-native-async-storage/async-storage';
import { PriceEntry } from '@/types/price';
import { UserProfile } from '@/types/user';
import { api, checkApiConnection } from './api';
import { supabase } from './supabase';

const STORAGE_KEY = 'taquanto_prices';
const USER_KEY = 'taquanto_user';
const SYNC_KEY = 'taquanto_synced';

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

    await AsyncStorage.setItem(SYNC_KEY, 'true');
    return { success: true, message: `Synced ${localPrices.length} prices successfully.` };
  } catch (error: any) {
    console.error('Sync error:', error);
    return { success: false, message: error.message || 'Sync failed' };
  }
};

// --- Main Storage API (Switched to Backend) ---

export const getStoredPrices = async (): Promise<PriceEntry[]> => {
  try {
    // Try API first
    const isConnected = await checkApiConnection();
    if (isConnected) {
      return await api.getPrices();
    }
    // Fallback to local if offline (optional, but good for UX)
    console.warn('Offline: Fetching from local storage');
    return await getLocalPrices();
  } catch (error) {
    console.error('Error getting prices:', error);
    return [];
  }
};

export const savePriceEntry = async (priceEntry: Omit<PriceEntry, 'id'>): Promise<void> => {
  try {
    const newPrice: PriceEntry = {
      ...priceEntry,
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
    await AsyncStorage.multiRemove([STORAGE_KEY, USER_KEY, SYNC_KEY]);
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