import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, Flashlight, CheckCircle2, AlertCircle, Search } from 'lucide-react-native';
import { useCallback } from 'react';
import { PriceEntry } from '@/types/price';
import { getProductByBarcode, getPricesByBarcode } from '@/utils/storage';
import { fetchProductFromOpenFoodFacts } from '@/utils/api';
import { SupermarketSessionModal } from '@/components/SupermarketSessionModal';
import { useTranslation } from 'react-i18next';
import { useSupermarketSession } from '@/context/SupermarketContext';

const { width } = Dimensions.get('window');
const SCAN_SIZE = width * 0.7;

type ScanStatus = 'idle' | 'searching' | 'found' | 'checking_price' | 'price_not_found' | 'success';

export default function ScanScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const { selectedSupermarket } = useSupermarketSession();

  const [scanned, setScanned] = useState(false);
  const [flash, setFlash] = useState(false);
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [fadeAnim] = useState(new Animated.Value(0));

  // Reset state when screen focus is regained
  useFocusEffect(
    useCallback(() => {
      setStatus('idle');
      setScanned(false);
      setStatusMessage('');
    }, [])
  );

  useEffect(() => {
    if (status !== 'idle') {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [status]);

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    setScanned(true);

    try {
      // Step 1: Searching
      setStatus('searching');
      setStatusMessage(t('searching_product'));

      // Artificial delay for UX (to allow user to read the message)
      await new Promise(resolve => setTimeout(resolve, 800));

      const existingProduct = await getProductByBarcode(data);
      let productData: Partial<PriceEntry> | null = existingProduct;

      // If product exists but has no image, try to fetch from API to enrich it
      if (existingProduct && !existingProduct.imageUrl) {
        console.log(`[Scan] Product ${existingProduct.productName} (local) has no image. Attempting enrichment...`);
        const apiProduct = await fetchProductFromOpenFoodFacts(data);

        if (apiProduct && apiProduct.imageUrl) {
          console.log(`[Scan] Enrichment successful! Found image: ${apiProduct.imageUrl}`);
          productData = {
            ...existingProduct,
            imageUrl: apiProduct.imageUrl
          };
        } else {
          console.log('[Scan] Enrichment failed: No image found in API.');
        }
      } else if (!existingProduct) {
        console.log('[Scan] Product not found locally. Checking API...');
        // Try API
        const apiProduct = await fetchProductFromOpenFoodFacts(data);
        if (apiProduct) {
          console.log(`[Scan] Found in API: ${apiProduct.name}`);
          productData = {
            barcode: data,
            productName: apiProduct.name,
            brand: apiProduct.brand,
            imageUrl: apiProduct.imageUrl,
          };
        } else {
          console.log('[Scan] Product not found in API.');
        }
      }

      const foundProductStart = async (prod: any) => {
        // Step 2: Found
        setStatus('found');
        setStatusMessage(t('product_found'));
        await new Promise(resolve => setTimeout(resolve, 800));

        // Step 3: Checking Prices
        setStatus('checking_price');
        setStatusMessage(t('checking_prices'));

        const prices = await getPricesByBarcode(data);
        // Check if price exists for CURRENT supermarket
        const hasPriceInCurrentSupermarket = selectedSupermarket && prices.some(p => p.supermarket === selectedSupermarket);

        if (hasPriceInCurrentSupermarket) {
          // Success - Redirect to Product Details
          setStatus('success');
          await new Promise(resolve => setTimeout(resolve, 500));
          router.push(`/product/${data}`);
        } else {
          // Price not found for this supermarket
          setStatus('price_not_found');
          setStatusMessage(t('price_not_found_supermarket'));
          await new Promise(resolve => setTimeout(resolve, 1500));

          // Redirect to Register
          router.push({
            pathname: '/register',
            params: {
              barcode: data,
              productName: prod?.productName,
              imageUrl: prod?.imageUrl,
              brand: prod?.brand
            }
          });
        }
      };

      if (productData) {
        await foundProductStart(productData);
      } else {
        // Product totally unknown
        setStatus('price_not_found');
        setStatusMessage(t('be_the_first'));
        await new Promise(resolve => setTimeout(resolve, 1500));

        router.push({
          pathname: '/register',
          params: { barcode: data }
        });
      }

    } catch (error) {
      console.error('Error processing barcode:', error);
      Alert.alert(t('error'), t('error'));
      setScanned(false);
      setStatus('idle');
    } finally {
      if (status === 'success' || status === 'price_not_found') {
        setTimeout(() => {
          setScanned(false);
          setStatus('idle');
        }, 1000);
      }
    }
  };

  const renderStatusOverlay = () => {
    if (status === 'idle') return null;

    let icon = <ActivityIndicator size="large" color="#FFFFFF" />;
    let color = 'rgba(0,0,0,0.8)';

    if (status === 'found') {
      icon = <CheckCircle2 size={48} color="#10B981" />;
      color = 'rgba(16, 185, 129, 0.9)';
    } else if (status === 'price_not_found') {
      icon = <AlertCircle size={48} color="#F59E0B" />;
      color = 'rgba(245, 158, 11, 0.9)';
    } else if (status === 'searching') {
      icon = <Search size={48} color="#3A7DE8" />;
      color = 'rgba(58, 125, 232, 0.9)';
    }

    return (
      <Animated.View style={[styles.statusOverlay, { opacity: fadeAnim, backgroundColor: color }]}>
        {icon}
        <Text style={styles.statusText}>{statusMessage}</Text>
      </Animated.View>
    );
  };

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <View style={styles.permissionCard}>
          <Text style={styles.permissionTitle}>{t('camera_permission')}</Text>
          <Text style={styles.permissionDescription}>{t('camera_permission')}</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>{t('grant_permission')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        enableTorch={flash}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr", "ean13", "ean8", "upc_a", "upc_e", "code128"],
        }}
      />

      {renderStatusOverlay()}

      <View style={styles.overlay}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.replace('/(tabs)/add')}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.title}>{t('scan_barcode')}</Text>
          <TouchableOpacity style={styles.iconButton} onPress={() => setFlash(!flash)}>
            <Flashlight size={24} color={flash ? '#F59E0B' : '#FFFFFF'} />
          </TouchableOpacity>
        </View>

        <View style={styles.scanArea}>
          <View style={styles.scanFrame} />
          <Text style={styles.scanHint}>{t('align_barcode')}</Text>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.manualButton} onPress={() => router.push('/register')}>
            <Text style={styles.manualButtonText}>{t('enter_manually')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <SupermarketSessionModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  permissionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    width: '100%',
    maxWidth: 350,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: '#3A7DE8',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  iconButton: {
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
  },
  scanArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: SCAN_SIZE,
    height: SCAN_SIZE,
    borderWidth: 2,
    borderColor: '#3A7DE8',
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  scanHint: {
    color: '#FFFFFF',
    marginTop: 20,
    fontSize: 16,
    fontWeight: '500',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  footer: {
    padding: 40,
    alignItems: 'center',
  },
  manualButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  manualButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statusOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  statusText: {
    marginTop: 20,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});