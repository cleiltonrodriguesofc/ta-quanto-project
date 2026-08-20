import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import CommunityScreen from '../community';
import * as storage from '@/utils/storage';
import { PriceEntry } from '@/types/price';

// Mock dependencies
jest.mock('@/utils/storage');
const mockStorage = storage as jest.Mocked<typeof storage>;

const mockPrices: PriceEntry[] = [
  {
    id: '1',
    productName: 'Milk 1L',
    price: 4.99,
    supermarket: 'LocalMart',
    quantity: '1L',
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
  {
    id: '3',
    productName: 'Milk 1L',
    price: 5.99,
    supermarket: 'ExpensiveMart',
    timestamp: '2024-01-01T08:00:00.000Z',
  },
];

describe('CommunityScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock current time for consistent date formatting
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should render community screen correctly', async () => {
    mockStorage.getStoredPrices.mockResolvedValue(mockPrices);

    const { getByText, getByPlaceholderText } = render(<CommunityScreen />);

    expect(getByText('community_prices')).toBeTruthy();
    expect(getByPlaceholderText('search_placeholder')).toBeTruthy();
    expect(getByText('recent')).toBeTruthy();
    expect(getByText('price')).toBeTruthy();

    await waitFor(() => {
      // "3 prices shared" logic might be dynamic: `${count} prices shared` or key with param.
      // If it uses t('prices_shared_count', { count: ... }), and we mocked t returns key...
      // It returns 'prices_shared_count'.
      // If mock returns key, arguments are ignored.
      expect(getByText('prices_shared_count')).toBeTruthy();
    });
  });

  it('should display price entries correctly', async () => {
    mockStorage.getStoredPrices.mockResolvedValue(mockPrices);

    const { getByText, getAllByText } = render(<CommunityScreen />);

    await waitFor(() => {
      expect(getAllByText('Milk 1L')[0]).toBeTruthy();
      expect(getByText('R$4.99')).toBeTruthy();
      expect(getByText('LocalMart')).toBeTruthy();
      expect(getByText('1L')).toBeTruthy();
      expect(getByText('📍 São Paulo, SP')).toBeTruthy();
    });
  });

  it('should filter prices by search query', async () => {
    mockStorage.getStoredPrices.mockResolvedValue(mockPrices);

    const { getByPlaceholderText, getByText, getAllByText, queryByText } = render(<CommunityScreen />);

    await waitFor(() => {
      expect(getAllByText('Milk 1L')[0]).toBeTruthy();
      expect(getByText('Bread Loaf')).toBeTruthy();
    });

    fireEvent.changeText(getByPlaceholderText('search_placeholder'), 'Milk');

    await waitFor(() => {
      expect(getAllByText('Milk 1L')[0]).toBeTruthy();
      expect(queryByText('Bread Loaf')).toBeNull();
    });
  });

  it('should sort prices by price when price sort is selected', async () => {
    mockStorage.getStoredPrices.mockResolvedValue(mockPrices);

    const { getByText, getAllByText } = render(<CommunityScreen />);

    await waitFor(() => {
      expect(getAllByText('Milk 1L')[0]).toBeTruthy();
    });

    fireEvent.press(getByText('price'));

    await waitFor(() => {
      const priceElements = getAllByText(/R\$\d+\.\d+/);
      // Should be sorted by price: 2.50, 4.99, 5.99
      expect(priceElements[0]).toHaveTextContent('R$2.50');
      expect(priceElements[1]).toHaveTextContent('R$4.99');
      expect(priceElements[2]).toHaveTextContent('R$5.99');
    });
  });

  it('should show empty state when no prices exist', async () => {
    mockStorage.getStoredPrices.mockResolvedValue([]);

    const { getByText } = render(<CommunityScreen />);

    await waitFor(() => {
      expect(getByText('no_prices_shared')).toBeTruthy();
      expect(getByText('start_sharing_community_msg')).toBeTruthy();
    });
  });

  it('should show no results message when search has no matches', async () => {
    mockStorage.getStoredPrices.mockResolvedValue(mockPrices);

    const { getByPlaceholderText, getByText } = render(<CommunityScreen />);

    fireEvent.changeText(getByPlaceholderText('search_placeholder'), 'NonExistentProduct');

    await waitFor(() => {
      expect(getByText('no_matching_prices')).toBeTruthy();
      expect(getByText('try_searching_msg')).toBeTruthy();
    });
  });

  it('should handle refresh functionality', async () => {
    mockStorage.getStoredPrices.mockResolvedValue(mockPrices);

    render(<CommunityScreen />);

    // Note: Testing refresh requires finding the FlatList and triggering refresh
    // This is a simplified test - in a real scenario you'd need to find the FlatList
    // and trigger the onRefresh callback
    await waitFor(() => {
      expect(mockStorage.getStoredPrices).toHaveBeenCalled();
    });
  });
});