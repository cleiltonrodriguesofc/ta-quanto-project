import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import HomeScreen from '../index';
import * as storage from '@/utils/storage';
import { PriceEntry } from '@/types/price';
import { SupermarketProvider } from '@/context/SupermarketContext';

// Mock dependencies
jest.mock('@/utils/storage');
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Alert: {
    alert: jest.fn(),
  },
}));

const mockStorage = storage as jest.Mocked<typeof storage>;
// We need to access the router mock to check calls
const mockRouter = { push: jest.fn() };
(jest.requireMock('expo-router') as any).useRouter = () => mockRouter;

const mockPrices: PriceEntry[] = [
  {
    id: '1',
    productName: 'Milk 1L',
    price: 4.99,
    supermarket: 'LocalMart',
    timestamp: '2024-01-01T10:00:00.000Z',
    location: {
      latitude: -23.5505,
      longitude: -46.6333,
      address: 'São Paulo, SP',
    },
    barcode: '123'
  },
  {
    id: '2',
    productName: 'Bread Loaf',
    price: 2.50,
    supermarket: 'SuperSave',
    timestamp: '2024-01-01T09:00:00.000Z',
    barcode: '456'
  },
];

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouter.push.mockClear();
  });

  const renderHomeScreen = () => render(
    <SupermarketProvider>
      <HomeScreen />
    </SupermarketProvider>
  );

  it('should render home screen correctly', async () => {
    mockStorage.getStoredPrices.mockResolvedValue([]);

    const { getByText } = renderHomeScreen();

    expect(getByText('TaQuanto?')).toBeTruthy();
    expect(getByText('welcome')).toBeTruthy();

    await waitFor(() => {
      expect(getByText('recent_prices')).toBeTruthy();
    });
  });

  it('should display correct statistics', async () => {
    mockStorage.getStoredPrices.mockResolvedValue(mockPrices);

    const { getByText } = renderHomeScreen();

    await waitFor(() => {
      // Savings: 0 (since each product has only 1 price)
      expect(getByText('R$0.00')).toBeTruthy();
      expect(getByText('potential_savings')).toBeTruthy();

      // Prices shared count: 2
      expect(getByText('2')).toBeTruthy();
      expect(getByText('prices_shared')).toBeTruthy();
    });
  });

  it('should show correct empty state when no prices exist', async () => {
    mockStorage.getStoredPrices.mockResolvedValue([]);

    const { getByText } = renderHomeScreen();

    await waitFor(() => {
      expect(getByText('no_products_found')).toBeTruthy();
    });
  });

  it('should handle storage error gracefully', async () => {
    // Suppress console.error for this test as it expects an error
    const spy = jest.spyOn(console, 'error').mockImplementation(() => { });

    mockStorage.getStoredPrices.mockRejectedValue(new Error('Storage error'));

    const { getByText, getAllByText } = renderHomeScreen();

    await waitFor(() => {
      // Should show default values when storage fails
      expect(getByText('R$0.00')).toBeTruthy();
      // '0' appears for prices shared
      const zeros = getAllByText('0');
      expect(zeros.length).toBeGreaterThanOrEqual(1);
    });

    spy.mockRestore();
  });

  it('should calculate potential savings correctly', async () => {
    // Two prices for the same product to generate savings
    const prices: PriceEntry[] = [
      mockPrices[0], // 4.99
      {
        ...mockPrices[0],
        id: '3',
        price: 3.50
      }
    ];
    // Savings: 4.99 - 3.50 = 1.49
    mockStorage.getStoredPrices.mockResolvedValue(prices);

    const { getByText } = renderHomeScreen();

    await waitFor(() => {
      expect(getByText('R$1.49')).toBeTruthy();

      // Prices shared: 2
      expect(getByText('2')).toBeTruthy();
    });
  });
});