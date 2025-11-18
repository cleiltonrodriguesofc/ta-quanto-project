import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Save, Package, MapPin } from 'lucide-react-native';
import { savePriceEntry } from '@/utils/storage';
import { PriceEntry } from '@/types/price';
import { getCurrentLocation, formatLocationDisplay, LocationData } from '@/utils/location';

export default function RegisterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [productName, setProductName] = useState(params.productName as string || '');
  const [price, setPrice] = useState('');
  const [supermarket, setSupermarket] = useState('');
  const [quantity, setQuantity] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Load location from params if passed from scan screen
  React.useEffect(() => {
    if (params.location) {
      try {
        const locationData = JSON.parse(params.location as string);
        setLocation(locationData);
      } catch (error) {
        console.log('Error parsing location from params:', error);
      }
    }
  }, [params.location]);

  const handleGetLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const currentLocation = await getCurrentLocation();
      if (currentLocation) {
        setLocation(currentLocation);
        Alert.alert('Location Found', `Location: ${formatLocationDisplay(currentLocation)}`);
      } else {
        Alert.alert('Location Error', 'Could not get your location. Please check your location permissions.');
      }
    } catch (error) {
      Alert.alert('Location Error', 'Failed to get location. Please try again.');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleSave = async () => {
    if (!productName.trim() || !price.trim() || !supermarket.trim()) {
      Alert.alert('Missing Information', 'Please fill in product name, price, and supermarket.');
      return;
    }

    const priceNumber = parseFloat(price);
    if (isNaN(priceNumber) || priceNumber <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price.');
      return;
    }

    setIsLoading(true);
    try {
      const priceEntry: Omit<PriceEntry, 'id'> = {
        productName: productName.trim(),
        price: priceNumber,
        supermarket: supermarket.trim(),
        quantity: quantity.trim() || undefined,
        timestamp: new Date().toISOString(),
        location: location || undefined,
      };

      await savePriceEntry(priceEntry);
      
      Alert.alert(
        'Price Shared!',
        `Thank you for sharing the price of ${productName}!`,
        [
          {
            text: 'Add Another',
            onPress: () => {
              setProductName('');
              setPrice('');
              setSupermarket('');
              setQuantity('');
              setLocation(null);
            }
          },
          {
            text: 'View Community',
            onPress: () => router.push('/community')
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save price. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Register Price</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          <View style={styles.iconHeader}>
            <Package size={32} color="#3A7DE8" />
            <Text style={styles.formTitle}>Product Information</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Product Name *</Text>
            <TextInput
              style={styles.input}
              value={productName}
              onChangeText={setProductName}
              placeholder="e.g., Milk 1L, Bread, Rice 5kg"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Price (R$) *</Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              placeholder="0.00"
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Supermarket *</Text>
            <TextInput
              style={styles.input}
              value={supermarket}
              onChangeText={setSupermarket}
              placeholder="e.g., LocalMart, SuperSave"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Quantity (Optional)</Text>
            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={setQuantity}
              placeholder="e.g., 1L, 500g, 12 units"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.locationSection}>
            <Text style={styles.label}>Location (Optional)</Text>
            <TouchableOpacity
              style={[styles.locationButton, location && styles.locationButtonActive]}
              onPress={handleGetLocation}
              disabled={isLoadingLocation}
            >
              {isLoadingLocation ? (
                <ActivityIndicator size="small" color="#3A7DE8" />
              ) : (
                <MapPin size={20} color={location ? '#10B981' : '#6B7280'} />
              )}
              <Text style={[styles.locationButtonText, location && styles.locationButtonTextActive]}>
                {location 
                  ? formatLocationDisplay(location)
                  : 'Add Location'
                }
              </Text>
            </TouchableOpacity>
            {location && (
              <TouchableOpacity
                style={styles.removeLocationButton}
                onPress={() => setLocation(null)}
              >
                <Text style={styles.removeLocationText}>Remove Location</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Save size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Share Price</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.helpCard}>
            <Text style={styles.helpTitle}>💡 Tips for better results</Text>
            <Text style={styles.helpText}>
              • Be specific with product names (include brand, size)
              • Double-check the price for accuracy
              • Include quantity when relevant (weight, volume, count)
              • Adding location helps others find nearby deals
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#3A7DE8',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 40,
  },
  iconHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
  },
  saveButton: {
    backgroundColor: '#3A7DE8',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 20,
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  helpCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#3A7DE8',
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  locationSection: {
    marginBottom: 20,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    gap: 8,
  },
  locationButtonActive: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  locationButtonText: {
    fontSize: 16,
    color: '#6B7280',
    flex: 1,
  },
  locationButtonTextActive: {
    color: '#10B981',
    fontWeight: '600',
  },
  removeLocationButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  removeLocationText: {
    fontSize: 14,
    color: '#EF4444',
    textDecorationLine: 'underline',
  },
});