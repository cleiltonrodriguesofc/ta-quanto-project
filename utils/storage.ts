import AsyncStorage from '@react-native-async-storage/async-storage';
import { PriceEntry } from '@/types/price';
import { UserProfile } from '@/types/user';

const STORAGE_KEY = 'taquanto_prices';
const USER_KEY = 'taquanto_user';

export const getStoredPrices = async (): Promise<PriceEntry[]> => {
  try {
    const storedData = await AsyncStorage.getItem(STORAGE_KEY);
    return storedData ? JSON.parse(storedData) : [];
  } catch (error) {
    console.error('Error getting stored prices:', error);
    return [];
  }
};

export const savePriceEntry = async (priceEntry: Omit<PriceEntry, 'id'>): Promise<void> => {
  try {
    const existingPrices = await getStoredPrices();
    const newPrice: PriceEntry = {
      ...priceEntry,
      id: generateId(),
    };

    const updatedPrices = [newPrice, ...existingPrices];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPrices));
  } catch (error) {
    console.error('Error saving price entry:', error);
    throw error;
  }
};

export const clearAllPrices = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing prices:', error);
    throw error;
  }
};

export const getUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const storedData = await AsyncStorage.getItem(USER_KEY);
    return storedData ? JSON.parse(storedData) : null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

export const saveUserProfile = async (profile: UserProfile): Promise<void> => {
  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(profile));
  } catch (error) {
    console.error('Error saving user profile:', error);
    throw error;
  }
};

export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([STORAGE_KEY, USER_KEY]);
  } catch (error) {
    console.error('Error clearing all data:', error);
    throw error;
  }
};

export const getProductByBarcode = async (barcode: string): Promise<PriceEntry | null> => {
  try {
    const prices = await getStoredPrices();
    // Find the most recent entry with this barcode
    const match = prices
      .filter(p => p.barcode === barcode)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

    return match || null;
  } catch (error) {
    console.error('Error searching product by barcode:', error);
    return null;
  }
};

export const getPricesByBarcode = async (barcode: string): Promise<PriceEntry[]> => {
  try {
    const prices = await getStoredPrices();
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