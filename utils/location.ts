import * as Location from 'expo-location';

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

export const getCurrentLocation = async (): Promise<LocationData | null> => {
  try {
    // Request permission to access location
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('Location permission denied');
      return null;
    }

    // Get current position
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const locationData: LocationData = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };

    // Try to get address from coordinates
    try {
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        const formattedAddress = [
          address.street,
          address.district,
          address.city,
          address.region
        ].filter(Boolean).join(', ');
        
        locationData.address = formattedAddress || 'Unknown location';
      }
    } catch (geocodeError) {
      console.log('Reverse geocoding failed:', geocodeError);
    }

    return locationData;
  } catch (error) {
    console.error('Error getting location:', error);
    return null;
  }
};

export const formatLocationDisplay = (location: LocationData): string => {
  if (location.address) {
    return location.address;
  }
  return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
};