import AsyncStorage from '@react-native-async-storage/async-storage';
import { PriceEntry } from '@/types/price';

const STORAGE_KEY = 'taquanto_prices';

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

const generateId = (): string => {
  return `price_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};