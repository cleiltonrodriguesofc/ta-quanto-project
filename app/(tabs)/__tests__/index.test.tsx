import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import HomeScreen from '../index';
import * as storage from '@/utils/storage';
import { PriceEntry } from '@/types/price';

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

  it('should render home screen correctly', async () => {
    mockStorage.getStoredPrices.mockResolvedValue([]);

    const { getByText } = render(<HomeScreen />);

    expect(getByText('TaQuanto?')).toBeTruthy();
    expect(getByText('welcome')).toBeTruthy();
    expect(getByText('what_to_do')).toBeTruthy();
    expect(getByText('scan_barcode')).toBeTruthy();
    expect(getByText('community')).toBeTruthy();
    expect(getByText('enter_manually')).toBeTruthy();
    expect(getByText('shopping_list')).toBeTruthy();

    await waitFor(() => {
      expect(getByText('recent_prices')).toBeTruthy();
    });
  });

  it('should display correct statistics', async () => {
    mockStorage.getStoredPrices.mockResolvedValue(mockPrices);

    const { getByText, getAllByText } = render(<HomeScreen />);

    await waitFor(() => {
      // Savings: 2 * 2.50 = 5.00
      expect(getByText('R$5.00')).toBeTruthy();
      expect(getByText('potential_savings')).toBeTruthy();

      // Prices shared count: 2
      // Component renders separate Text for count and label
      // We might have multiple '2's in the screen if prices have '2' in them?
      // No, mock data prices are 4.99 and 2.50.
      expect(getByText('2')).toBeTruthy();
      expect(getByText('prices_shared')).toBeTruthy();

      // Locations: 1
      expect(getByText('1')).toBeTruthy();
      expect(getByText('with_location')).toBeTruthy();
    });
  });

  it('should show correct empty state when no prices exist', async () => {
    mockStorage.getStoredPrices.mockResolvedValue([]);

    const { getByText } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByText('no_products_found')).toBeTruthy();
    });
  });

  it('should navigate to routes when shopping list is pressed', async () => {
    mockStorage.getStoredPrices.mockResolvedValue([]);

    const { getByText } = render(<HomeScreen />);

    fireEvent.press(getByText('shopping_list'));

    expect(mockRouter.push).toHaveBeenCalledWith('/routes');
  });

  it('should handle storage error gracefully', async () => {
    // Suppress console.error for this test as it expects an error
    const spy = jest.spyOn(console, 'error').mockImplementation(() => { });

    mockStorage.getStoredPrices.mockRejectedValue(new Error('Storage error'));

    const { getByText, getAllByText } = render(<HomeScreen />);

    await waitFor(() => {
      // Should show default values when storage fails
      expect(getByText('R$0.00')).toBeTruthy();
      // '0' might appear multiple times (prices shared, location count)
      const zeros = getAllByText('0');
      expect(zeros.length).toBeGreaterThanOrEqual(2);
    });

    spy.mockRestore();
  });

  it('should calculate statistics correctly for single price', async () => {
    const singlePrice: PriceEntry[] = [mockPrices[0]];
    mockStorage.getStoredPrices.mockResolvedValue(singlePrice);

    const { getByText, getAllByText } = render(<HomeScreen />);

    await waitFor(() => {
      // Savings: 1 * 2.50 = 2.50
      expect(getByText('R$2.50')).toBeTruthy();

      // Prices shared: 1
      // Location: 1
      const ones = getAllByText('1');
      expect(ones.length).toBeGreaterThanOrEqual(2);
    });
  });
});