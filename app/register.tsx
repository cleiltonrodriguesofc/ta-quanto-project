import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Save, MapPin, Camera } from 'lucide-react-native';
import * as Location from 'expo-location';
import {
  launchCameraAsync,
  requestCameraPermissionsAsync
} from 'expo-image-picker';
import { savePriceEntry } from '@/utils/storage';
import { SupermarketSelector } from '@/components/SupermarketSelector';
import { useSupermarketSession } from '@/context/SupermarketContext';
import { useTranslation } from 'react-i18next';

let globalLastLoggedBarcode: string | null = null;

export default function RegisterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useTranslation();
  const { selectedSupermarket, setSelectedSupermarket } = useSupermarketSession();
  const hasInitialized = useRef(false);

  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [supermarket, setSupermarket] = useState('');
  const [barcode, setBarcode] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [brand, setBrand] = useState('');
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  useEffect(() => {
    if (params.barcode && params.barcode !== globalLastLoggedBarcode) {
      console.log('Register params:', params);
      globalLastLoggedBarcode = params.barcode as string;
    }

    // Only initialize fields ONCE when the screen opens with target params.
    // This prevents them from "snapping back" if the user clears the field later.
    if (!hasInitialized.current && params.barcode) {
      if (params.barcode) setBarcode(params.barcode as string);
      if (params.productName) setProductName(params.productName as string);
      if (params.imageUrl) setImageUrl(params.imageUrl as string);
      if (params.brand) setBrand(params.brand as string);

      hasInitialized.current = true;
    }

    // Initialize supermarket from global session if available
    if (selectedSupermarket) {
      setSupermarket(selectedSupermarket);
    }
  }, [params, selectedSupermarket]);

  const handleGetLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('permission_denied'), t('location_denied'));
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(t('error'), t('error'));
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('permission_denied'), t('camera_denied_msg'));
      return;
    }

    const result = await launchCameraAsync({
      mediaTypes: 'images',
      allowsEditing: false,
      aspect: [1, 1],
      quality: 0.3, // Optimized for KB size
    });

    if (!result.canceled) {
      setImageUrl(result.assets[0].uri);
    }
  };

  const handleSupermarketChange = (name: string) => {
    setSupermarket(name);
    setSelectedSupermarket(name); // Update global session
  };

  const handleSave = async () => {
    if (!productName || !price || !supermarket || !barcode) {
      Alert.alert(t('missing_info'), t('fill_required'));
      return;
    }

    setIsLoading(true);
    try {
      await savePriceEntry({
        productName,
        price: parseFloat(price.replace(',', '.')),
        supermarket,
        barcode,
        brand,
        imageUrl,
        timestamp: new Date().toISOString(),
        location: location ? {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        } : undefined,
      });

      Alert.alert(t('success'), t('product_registered'), [
        {
          text: 'OK',
          onPress: () => router.replace(`/product/${barcode}`)
        }
      ]);
    } catch (error) {
      console.error('Error saving price:', error);
      Alert.alert(t('error'), t('error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/add')} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('register_price')}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>

          <View style={styles.imageContainer}>
            {imageUrl ? (
              <TouchableOpacity onPress={handleTakePhoto}>
                <Image source={{ uri: imageUrl }} style={styles.productImage} resizeMode="contain" />
                <View style={styles.editImageBadge}>
                  <Camera size={16} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.placeholderImage} onPress={handleTakePhoto}>
                <Camera size={40} color="#9CA3AF" />
                <Text style={styles.placeholderText}>{t('take_photo')}</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('product_name')} *</Text>
            <TextInput
              style={styles.input}
              value={productName}
              onChangeText={setProductName}
              placeholder="e.g., Coca-Cola 2L"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('how_much_is_it')} *</Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              placeholder="0.00"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('supermarket')} *</Text>
            <SupermarketSelector
              selectedSupermarket={supermarket}
              onSelect={handleSupermarketChange}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('brand_optional')}</Text>
            <TextInput
              style={styles.input}
              value={brand}
              onChangeText={setBrand}
              placeholder="e.g., Coca-Cola"
            />
          </View>


          <TouchableOpacity
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Save size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>{t('save')}</Text>
              </>
            )}
          </TouchableOpacity>

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
    paddingBottom: 20,
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
    padding: 20,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  productImage: {
    width: 150,
    height: 150,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  editImageBadge: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    backgroundColor: '#3A7DE8',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  placeholderImage: {
    width: 150,
    height: 150,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
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
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  locationSection: {
    marginBottom: 24,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  locationButtonActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  locationButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  locationButtonTextActive: {
    color: '#10B981',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3A7DE8',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    shadowColor: '#3A7DE8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: '#93C5FD',
    shadowOpacity: 0,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});