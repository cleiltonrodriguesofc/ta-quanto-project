import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStoredPrices, savePriceEntry, clearAllPrices } from '../storage';
import { PriceEntry } from '@/types/price';
import { checkApiConnection } from '../api';

// Mock API
jest.mock('../api', () => ({
  checkApiConnection: jest.fn(),
  api: {
    batchUploadPrices: jest.fn(),
    addPrice: jest.fn(),
  },
}));

// Mock Supabase
jest.mock('../supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: { user: { id: 'test-user-id' } } } }),
    },
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage');
const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('Storage Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (checkApiConnection as jest.Mock).mockResolvedValue(false); // Default to offline for storage tests
  });

  describe('getStoredPrices', () => {
    it('should return empty array when no data exists', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const result = await getStoredPrices();

      expect(result).toEqual([]);
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('taquanto_prices');
    });

    it('should return parsed prices when data exists', async () => {
      const mockPrices: PriceEntry[] = [
        {
          id: 'test-1',
          productName: 'Milk 1L',
          price: 4.99,
          supermarket: 'LocalMart',
          timestamp: '2024-01-01T10:00:00.000Z',
        },
      ];
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockPrices));

      const result = await getStoredPrices();

      expect(result).toEqual(mockPrices);
    });

    it('should return empty array on error', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      const result = await getStoredPrices();

      expect(result).toEqual([]);
    });
  });

  describe('savePriceEntry', () => {
    it('should save new price entry', async () => {
      const existingPrices: PriceEntry[] = [];
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(existingPrices));
      mockAsyncStorage.setItem.mockResolvedValue();

      const newPrice = {
        productName: 'Bread',
        price: 2.50,
        supermarket: 'SuperSave',
        timestamp: '2024-01-01T10:00:00.000Z',
      };

      await savePriceEntry(newPrice);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'taquanto_prices',
        expect.stringContaining('"productName":"Bread"')
      );
    });

    it('should add new price to existing prices', async () => {
      const existingPrices: PriceEntry[] = [
        {
          id: 'existing-1',
          productName: 'Milk',
          price: 4.99,
          supermarket: 'LocalMart',
          timestamp: '2024-01-01T09:00:00.000Z',
        },
      ];
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(existingPrices));
      mockAsyncStorage.setItem.mockResolvedValue();

      const newPrice = {
        productName: 'Bread',
        price: 2.50,
        supermarket: 'SuperSave',
        timestamp: '2024-01-01T10:00:00.000Z',
      };

      await savePriceEntry(newPrice);

      const savedData = mockAsyncStorage.setItem.mock.calls[0][1];
      const parsedData = JSON.parse(savedData);

      expect(parsedData).toHaveLength(2);
      expect(parsedData[0].productName).toBe('Bread'); // New price should be first
      expect(parsedData[1].productName).toBe('Milk');
    });

    it('should throw error on save failure', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('[]');
      mockAsyncStorage.setItem.mockRejectedValue(new Error('Save failed'));

      const newPrice = {
        productName: 'Bread',
        price: 2.50,
        supermarket: 'SuperSave',
        timestamp: '2024-01-01T10:00:00.000Z',
      };

      await expect(savePriceEntry(newPrice)).rejects.toThrow('Save failed');
    });
  });

  describe('clearAllPrices', () => {
    it('should clear all stored prices', async () => {
      mockAsyncStorage.removeItem.mockResolvedValue();

      await clearAllPrices();

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('taquanto_prices');
    });

    it('should throw error on clear failure', async () => {
      mockAsyncStorage.removeItem.mockRejectedValue(new Error('Clear failed'));

      await expect(clearAllPrices()).rejects.toThrow('Clear failed');
    });
  });
});