import * as Location from 'expo-location';
import { getCurrentLocation, formatLocationDisplay } from '../location';

// Mock expo-location
jest.mock('expo-location');
const mockLocation = Location as jest.Mocked<typeof Location>;

describe('Location Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentLocation', () => {
    it('should return location data with address', async () => {
      mockLocation.requestForegroundPermissionsAsync.mockResolvedValue({
        status: 'granted',
        granted: true,
        canAskAgain: true,
        expires: 'never',
      });

      mockLocation.getCurrentPositionAsync.mockResolvedValue({
        coords: {
          latitude: -23.5505,
          longitude: -46.6333,
          altitude: null,
          accuracy: 10,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      });

      mockLocation.reverseGeocodeAsync.mockResolvedValue([
        {
          street: 'Rua Augusta',
          district: 'Consolação',
          city: 'São Paulo',
          region: 'SP',
          country: 'Brazil',
          postalCode: '01305-000',
          name: null,
          isoCountryCode: 'BR',
          timezone: null,
        },
      ]);

      const result = await getCurrentLocation();

      expect(result).toEqual({
        latitude: -23.5505,
        longitude: -46.6333,
        address: 'Rua Augusta, Consolação, São Paulo, SP',
      });
    });

    it('should return location data without address when geocoding fails', async () => {
      mockLocation.requestForegroundPermissionsAsync.mockResolvedValue({
        status: 'granted',
        granted: true,
        canAskAgain: true,
        expires: 'never',
      });

      mockLocation.getCurrentPositionAsync.mockResolvedValue({
        coords: {
          latitude: -23.5505,
          longitude: -46.6333,
          altitude: null,
          accuracy: 10,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      });

      mockLocation.reverseGeocodeAsync.mockRejectedValue(new Error('Geocoding failed'));

      const result = await getCurrentLocation();

      expect(result).toEqual({
        latitude: -23.5505,
        longitude: -46.6333,
      });
    });

    it('should return null when permission is denied', async () => {
      mockLocation.requestForegroundPermissionsAsync.mockResolvedValue({
        status: 'denied',
        granted: false,
        canAskAgain: true,
        expires: 'never',
      });

      const result = await getCurrentLocation();

      expect(result).toBeNull();
      expect(mockLocation.getCurrentPositionAsync).not.toHaveBeenCalled();
    });

    it('should return null when location fails', async () => {
      mockLocation.requestForegroundPermissionsAsync.mockResolvedValue({
        status: 'granted',
        granted: true,
        canAskAgain: true,
        expires: 'never',
      });

      mockLocation.getCurrentPositionAsync.mockRejectedValue(new Error('Location failed'));

      const result = await getCurrentLocation();

      expect(result).toBeNull();
    });
  });

  describe('formatLocationDisplay', () => {
    it('should return address when available', () => {
      const location = {
        latitude: -23.5505,
        longitude: -46.6333,
        address: 'Rua Augusta, São Paulo, SP',
      };

      const result = formatLocationDisplay(location);

      expect(result).toBe('Rua Augusta, São Paulo, SP');
    });

    it('should return coordinates when address is not available', () => {
      const location = {
        latitude: -23.5505,
        longitude: -46.6333,
      };

      const result = formatLocationDisplay(location);

      expect(result).toBe('-23.5505, -46.6333');
    });

    it('should format coordinates with proper precision', () => {
      const location = {
        latitude: -23.550512345,
        longitude: -46.633298765,
      };

      const result = formatLocationDisplay(location);

      expect(result).toBe('-23.5505, -46.6333');
    });
  });
});