import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import HomeScreen from '../index';
import * as storage from '@/utils/storage';
import { PriceEntry } from '@/types/price';

// Mock dependencies
jest.mock('@/utils/storage');
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Alert: {
    alert: jest.fn(),
  },
}));

const mockStorage = storage as jest.Mocked<typeof storage>;
const mockAlert = Alert.alert as jest.Mock;

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
  },
  {
    id: '2',
    productName: 'Bread Loaf',
    price: 2.50,
    supermarket: 'SuperSave',
    timestamp: '2024-01-01T09:00:00.000Z',
  },
];

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render home screen correctly', () => {
    mockStorage.getStoredPrices.mockResolvedValue([]);

    const { getByText } = render(<HomeScreen />);

    expect(getByText('TaQuanto?')).toBeTruthy();
    expect(getByText('Share prices, save money together')).toBeTruthy();
    expect(getByText('What would you like to do?')).toBeTruthy();
    expect(getByText('Scan Product')).toBeTruthy();
    expect(getByText('Compare Prices')).toBeTruthy();
    expect(getByText('Register Manually')).toBeTruthy();
    expect(getByText('My Routes')).toBeTruthy();
  });

  it('should display correct statistics', async () => {
    mockStorage.getStoredPrices.mockResolvedValue(mockPrices);

    const { getByText } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByText('R$5.00')).toBeTruthy(); // 2 prices * R$2.50 savings each
      expect(getByText('2')).toBeTruthy(); // 2 prices shared
      expect(getByText('1')).toBeTruthy(); // 1 price with location
    });
  });

  it('should show correct activity message when prices exist', async () => {
    mockStorage.getStoredPrices.mockResolvedValue(mockPrices);

    const { getByText } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByText("You've shared 2 prices with the community!")).toBeTruthy();
    });
  });

  it('should show correct activity message when no prices exist', async () => {
    mockStorage.getStoredPrices.mockResolvedValue([]);

    const { getByText } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByText('Start sharing prices to help your community save money!')).toBeTruthy();
    });
  });

  it('should show coming soon alert for My Routes', async () => {
    mockStorage.getStoredPrices.mockResolvedValue([]);

    const { getByText } = render(<HomeScreen />);

    fireEvent.press(getByText('My Routes'));

    expect(mockAlert).toHaveBeenCalledWith(
      'Coming Soon',
      'Route planning feature will be available in the next version!'
    );
  });

  it('should handle storage error gracefully', async () => {
    mockStorage.getStoredPrices.mockRejectedValue(new Error('Storage error'));

    const { getByText } = render(<HomeScreen />);

    await waitFor(() => {
      // Should show default values when storage fails
      expect(getByText('R$0.00')).toBeTruthy();
      expect(getByText('0')).toBeTruthy();
    });
  });

  it('should calculate statistics correctly for single price', async () => {
    const singlePrice: PriceEntry[] = [mockPrices[0]];
    mockStorage.getStoredPrices.mockResolvedValue(singlePrice);

    const { getByText } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByText('R$2.50')).toBeTruthy(); // 1 price * R$2.50 savings
      expect(getByText('1')).toBeTruthy(); // 1 price shared
      expect(getByText("You've shared 1 price with the community!")).toBeTruthy();
    });
  });
});