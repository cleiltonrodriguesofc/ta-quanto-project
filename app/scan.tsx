import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Image,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { ArrowLeft, Flashlight, X } from 'lucide-react-native';
import { getProductByBarcode } from '@/utils/storage';
import { fetchProductFromOpenFoodFacts } from '@/utils/api';
import { SupermarketSessionModal } from '@/components/SupermarketSessionModal';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');
const SCAN_SIZE = width * 0.7;

export default function ScanScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [flash, setFlash] = useState(false);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <View style={styles.permissionCard}>
          <Text style={styles.permissionTitle}>{t('camera_permission')}</Text>
          <Text style={styles.permissionDescription}>
            {t('camera_permission')}
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>{t('grant_permission')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    setScanned(true);

    try {
      console.log(`[Scan] Processing barcode: ${data}`);

      // 1. Check local DB
      const existingProduct = await getProductByBarcode(data);

      if (existingProduct) {
        console.log('[Scan] Found in local DB:', existingProduct.productName);
        // Found locally -> Redirect to Product Details
        router.push(`/product/${data}`);
        setTimeout(() => setScanned(false), 1000);
      } else {
        console.log('[Scan] Not found locally. Checking API...');
        // 2. Check Public API
        const apiProduct = await fetchProductFromOpenFoodFacts(data);

        if (apiProduct) {
          console.log('[Scan] Found in API:', apiProduct.name);
          console.log('[Scan] API Image URL:', apiProduct.imageUrl);

          // Found in API -> Redirect to Register with pre-filled data
          router.push({
            pathname: '/register',
            params: {
              barcode: data,
              productName: apiProduct.name,
              imageUrl: apiProduct.imageUrl,
              brand: apiProduct.brand
            }
          });
        } else {
          console.log('[Scan] Not found in API. Redirecting to manual entry.');
          // 3. Not found anywhere -> Redirect to Register (Manual)
          router.push({
            pathname: '/register',
            params: { barcode: data }
          });
        }
        setTimeout(() => setScanned(false), 1000);
      }
    } catch (error) {
      console.error('Error processing barcode:', error);
      Alert.alert(t('error'), t('error'));
      setScanned(false);
    }
  };

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

      <View style={styles.overlay}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.title}>{t('scan_barcode')}</Text>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setFlash(!flash)}
          >
            <Flashlight size={24} color={flash ? '#F59E0B' : '#FFFFFF'} />
          </TouchableOpacity>
        </View>

        <View style={styles.scanArea}>
          <View style={styles.scanFrame} />
          <Text style={styles.scanText}>
            {t('align_barcode')}
          </Text>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.manualButton}
            onPress={() => router.push('/register')}
          >
            <Text style={styles.manualButtonText}>{t('enter_manually')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Force Supermarket Selection if not set */}
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
  scanText: {
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
});