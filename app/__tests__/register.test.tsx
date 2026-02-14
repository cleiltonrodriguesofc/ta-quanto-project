import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import RegisterScreen from '../register';
import { SupermarketProvider } from '@/context/SupermarketContext';
import * as storage from '@/utils/storage';


// Mock dependencies
jest.mock('@/utils/storage');
jest.mock('expo-location');


// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: jest.fn(() => ({ barcode: '123456' })),
}));

// Mock AuthContext
jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    session: { user: { id: 'test-user-id' } },
    isAdmin: false,
  }),
}));

// Mock SupermarketSelector to behave like a TextInput for testing
jest.mock('@/components/SupermarketSelector', () => {
  const { TextInput } = jest.requireActual('react-native');
  return {
    SupermarketSelector: ({ onSelect, selectedSupermarket }: any) => (
      <TextInput
        testID="supermarket-selector"
        placeholder="e.g., LocalMart, SuperSave"
        value={selectedSupermarket}
        onChangeText={onSelect}
      />
    ),
  };
});

const mockStorage = storage as jest.Mocked<typeof storage>;

const mockAlert = Alert.alert as jest.Mock;

describe('RegisterScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render register form correctly', () => {
    const { getByText, getByPlaceholderText } = render(
      <SupermarketProvider>
        <RegisterScreen />
      </SupermarketProvider>
    );

    expect(getByText('register_price')).toBeTruthy();
    expect(getByText('product_name *')).toBeTruthy();
    expect(getByPlaceholderText('e.g., Coca-Cola 2L')).toBeTruthy();
    expect(getByPlaceholderText('0.00')).toBeTruthy();
    expect(getByPlaceholderText('e.g., LocalMart, SuperSave')).toBeTruthy();
    expect(getByText('save')).toBeTruthy();
  });

  it('should show validation error for empty required fields', async () => {
    const { getByText } = render(
      <SupermarketProvider>
        <RegisterScreen />
      </SupermarketProvider>
    );

    fireEvent.press(getByText('save'));

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        'missing_info',
        'fill_required'
      );
    });
  });

  it('should save price entry successfully', async () => {
    mockStorage.savePriceEntry.mockResolvedValue();

    const { getByPlaceholderText, getByText } = render(
      <SupermarketProvider>
        <RegisterScreen />
      </SupermarketProvider>
    );

    fireEvent.changeText(getByPlaceholderText('e.g., Coca-Cola 2L'), 'Milk 1L');
    fireEvent.changeText(getByPlaceholderText('0.00'), '4.99');
    fireEvent.changeText(getByPlaceholderText('e.g., LocalMart, SuperSave'), 'LocalMart');

    fireEvent.press(getByText('save'));

    await waitFor(() => {
      expect(mockStorage.savePriceEntry).toHaveBeenCalledWith({
        productName: 'Milk 1L',
        price: 4.99,
        supermarket: 'LocalMart',
        barcode: '123456',
        brand: '',
        imageUrl: '',
        timestamp: expect.any(String),
        location: undefined,
      });
    });

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        'success',
        'product_registered',
        expect.any(Array)
      );
    });
  });

  /*
    it('should handle location addition', async () => {
      const mockLocationData = {
        coords: {
          latitude: -23.5505,
          longitude: -46.6333,
        },
      };
      mockExpoLocation.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' } as any);
      mockExpoLocation.getCurrentPositionAsync.mockResolvedValue(mockLocationData as any);
  
      const { getByText } = render(
        <SupermarketProvider>
          <RegisterScreen />
        </SupermarketProvider>
      );
  
      fireEvent.press(getByText('add_location'));
  
      await waitFor(() => {
        expect(mockExpoLocation.getCurrentPositionAsync).toHaveBeenCalled();
      });
  
      await waitFor(() => {
        expect(getByText('location_added')).toBeTruthy();
      });
    });
  */

  it('should handle save error', async () => {
    mockStorage.savePriceEntry.mockRejectedValue(new Error('Save failed'));

    const { getByPlaceholderText, getByText } = render(
      <SupermarketProvider>
        <RegisterScreen />
      </SupermarketProvider>
    );

    fireEvent.changeText(getByPlaceholderText('e.g., Coca-Cola 2L'), 'Milk 1L');
    fireEvent.changeText(getByPlaceholderText('0.00'), '4.99');
    fireEvent.changeText(getByPlaceholderText('e.g., LocalMart, SuperSave'), 'LocalMart');

    fireEvent.press(getByText('save'));

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        'error',
        'error'
      );
    });
  });
});
