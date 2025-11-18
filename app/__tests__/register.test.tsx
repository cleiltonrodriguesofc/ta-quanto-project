import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import RegisterScreen from '../register';
import * as storage from '@/utils/storage';
import * as location from '@/utils/location';

// Mock dependencies
jest.mock('@/utils/storage');
jest.mock('@/utils/location');
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Alert: {
    alert: jest.fn(),
  },
}));

const mockStorage = storage as jest.Mocked<typeof storage>;
const mockLocation = location as jest.Mocked<typeof location>;
const mockAlert = Alert.alert as jest.Mock;

describe('RegisterScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render register form correctly', () => {
    const { getByText, getByPlaceholderText } = render(<RegisterScreen />);

    expect(getByText('Register Price')).toBeTruthy();
    expect(getByText('Product Information')).toBeTruthy();
    expect(getByPlaceholderText('e.g., Milk 1L, Bread, Rice 5kg')).toBeTruthy();
    expect(getByPlaceholderText('0.00')).toBeTruthy();
    expect(getByPlaceholderText('e.g., LocalMart, SuperSave')).toBeTruthy();
    expect(getByText('Share Price')).toBeTruthy();
  });

  it('should show validation error for empty required fields', async () => {
    const { getByText } = render(<RegisterScreen />);

    fireEvent.press(getByText('Share Price'));

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        'Missing Information',
        'Please fill in product name, price, and supermarket.'
      );
    });
  });

  it('should show validation error for invalid price', async () => {
    const { getByPlaceholderText, getByText } = render(<RegisterScreen />);

    fireEvent.changeText(getByPlaceholderText('e.g., Milk 1L, Bread, Rice 5kg'), 'Milk');
    fireEvent.changeText(getByPlaceholderText('0.00'), 'invalid');
    fireEvent.changeText(getByPlaceholderText('e.g., LocalMart, SuperSave'), 'LocalMart');

    fireEvent.press(getByText('Share Price'));

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        'Invalid Price',
        'Please enter a valid price.'
      );
    });
  });

  it('should save price entry successfully', async () => {
    mockStorage.savePriceEntry.mockResolvedValue();
    
    const { getByPlaceholderText, getByText } = render(<RegisterScreen />);

    fireEvent.changeText(getByPlaceholderText('e.g., Milk 1L, Bread, Rice 5kg'), 'Milk 1L');
    fireEvent.changeText(getByPlaceholderText('0.00'), '4.99');
    fireEvent.changeText(getByPlaceholderText('e.g., LocalMart, SuperSave'), 'LocalMart');
    fireEvent.changeText(getByPlaceholderText('e.g., 1L, 500g, 12 units'), '1L');

    fireEvent.press(getByText('Share Price'));

    await waitFor(() => {
      expect(mockStorage.savePriceEntry).toHaveBeenCalledWith({
        productName: 'Milk 1L',
        price: 4.99,
        supermarket: 'LocalMart',
        quantity: '1L',
        timestamp: expect.any(String),
        location: undefined,
      });
    });

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        'Price Shared!',
        'Thank you for sharing the price of Milk 1L!',
        expect.any(Array)
      );
    });
  });

  it('should handle location addition', async () => {
    const mockLocationData = {
      latitude: -23.5505,
      longitude: -46.6333,
      address: 'São Paulo, SP',
    };
    mockLocation.getCurrentLocation.mockResolvedValue(mockLocationData);

    const { getByText } = render(<RegisterScreen />);

    fireEvent.press(getByText('Add Location'));

    await waitFor(() => {
      expect(mockLocation.getCurrentLocation).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        'Location Found',
        'Location: São Paulo, SP'
      );
    });
  });

  it('should handle location removal', async () => {
    const mockLocationData = {
      latitude: -23.5505,
      longitude: -46.6333,
      address: 'São Paulo, SP',
    };
    mockLocation.getCurrentLocation.mockResolvedValue(mockLocationData);

    const { getByText } = render(<RegisterScreen />);

    // Add location first
    fireEvent.press(getByText('Add Location'));
    await waitFor(() => {
      expect(getByText('São Paulo, SP')).toBeTruthy();
    });

    // Remove location
    fireEvent.press(getByText('Remove Location'));
    await waitFor(() => {
      expect(getByText('Add Location')).toBeTruthy();
    });
  });

  it('should handle save error', async () => {
    mockStorage.savePriceEntry.mockRejectedValue(new Error('Save failed'));
    
    const { getByPlaceholderText, getByText } = render(<RegisterScreen />);

    fireEvent.changeText(getByPlaceholderText('e.g., Milk 1L, Bread, Rice 5kg'), 'Milk 1L');
    fireEvent.changeText(getByPlaceholderText('0.00'), '4.99');
    fireEvent.changeText(getByPlaceholderText('e.g., LocalMart, SuperSave'), 'LocalMart');

    fireEvent.press(getByText('Share Price'));

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        'Error',
        'Failed to save price. Please try again.'
      );
    });
  });
});