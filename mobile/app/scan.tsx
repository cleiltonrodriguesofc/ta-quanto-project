import React, { useState, useEffect, useCallback } from 'react';
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
import { useRouter, useFocusEffect, useLocalSearchParams, useIsFocused } from 'expo-router';
import { ArrowLeft, Flashlight, CheckCircle2, AlertCircle, Search } from 'lucide-react-native';
import { PriceEntry } from '@/types/price';
import { getCachedProductByBarcode, getLocalPrices, getProductByBarcode } from '@/utils/storage';
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
  const params = useLocalSearchParams();
  const fromBasket = params.fromBasket as string;
  const isFocused = useIsFocused();

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
  }, [status, fadeAnim]);

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    setScanned(true);
    console.log(`[Scan] Barcode detected: ${data} (Type: ${type})`);

    try {
      // Resolve from on-device cache only. A barcode scan must never wait for
      // Render or a public product provider before opening the next screen.
      const [cachedProduct, cachedPrices] = await Promise.all([
        getCachedProductByBarcode(data),
        getLocalPrices(data),
      ]);
      const localPrice = cachedPrices.find((item: PriceEntry) => item.supermarket === selectedSupermarket)
        || cachedPrices[0];
      const productName = cachedProduct?.name || localPrice?.productName;
      const imageUrl = cachedProduct?.imageUrl || localPrice?.imageUrl;
      const brand = cachedProduct?.brand || localPrice?.brand;

      // Enrich this device's catalog after navigation; do not block the scan.
      if (!cachedProduct) {
        void getProductByBarcode(data).catch(error => {
          console.warn('[Scan] Background product lookup failed:', error);
        });
      }

      if (
        (selectedSupermarket && localPrice?.supermarket === selectedSupermarket)
        || cachedProduct
        || cachedPrices.length > 0
      ) {
        // The details screen loads shared backend prices when the device has
        // no local match, while the camera itself stays responsive.
        router.push(`/product/${data}?fromBasket=${fromBasket || ''}`);
      } else {
        router.push({
          pathname: '/register',
          params: {
            barcode: data,
            productName,
            imageUrl,
            brand,
            fromBasket: fromBasket || '',
          },
        });
      }
    } catch (error) {
      console.error('Error processing barcode:', error);
      Alert.alert(t('error'), t('error'));
      setScanned(false);
      setStatus('idle');
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
      {isFocused && (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          enableTorch={flash}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["qr", "ean13", "ean8", "upc_a", "upc_e", "code128"],
          }}
        />
      )}

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
    ...StyleSheet.absoluteFill,
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
    ...StyleSheet.absoluteFill,
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
