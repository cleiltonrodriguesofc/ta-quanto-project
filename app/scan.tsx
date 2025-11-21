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

const { width } = Dimensions.get('window');
const SCAN_SIZE = width * 0.7;

export default function ScanScreen() {
  const router = useRouter();
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
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionDescription}>
            We need permission to access your camera to scan product barcodes.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    setScanned(true);

    try {
      // 1. Check local DB
      const existingProduct = await getProductByBarcode(data);

      if (existingProduct) {
        // Found locally -> Redirect to Product Details
        router.push(`/product/${data}`);
        setTimeout(() => setScanned(false), 1000);
      } else {
        // 2. Check Public API
        const apiProduct = await fetchProductFromOpenFoodFacts(data);

        if (apiProduct) {
          // Found in API, but not in local DB -> Register with pre-filled data
          Alert.alert(
            'Product Found (New)',
            `${apiProduct.name}\nWould you like to register a price for this product?`,
            [
              { text: 'Cancel', style: 'cancel', onPress: () => setScanned(false) },
              {
                text: 'Register Price',
                onPress: () => {
                  router.push({
                    pathname: '/register',
                    params: {
                      barcode: data,
                      productName: apiProduct.name,
                      imageUrl: apiProduct.imageUrl,
                      brand: apiProduct.brand
                    }
                  });
                  setTimeout(() => setScanned(false), 1000);
                }
              }
            ]
          );
        } else {
          // 3. Not found anywhere -> Manual Register
          Alert.alert(
            'Product Not Found',
            `Barcode ${data} is not in our database. Would you like to register it?`,
            [
              { text: 'Cancel', style: 'cancel', onPress: () => setScanned(false) },
              {
                text: 'Register',
                onPress: () => {
                  router.push({
                    pathname: '/register',
                    params: { barcode: data }
                  });
                  setTimeout(() => setScanned(false), 1000);
                },
              },
            ]
          );
        }
      }
    } catch (error) {
      console.error('Error processing barcode:', error);
      Alert.alert('Error', 'Failed to process barcode. Please try again.');
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
      >
        <View style={styles.overlay}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.title}>Scan Barcode</Text>
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
              Align barcode within the frame
            </Text>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.manualButton}
              onPress={() => router.push('/register')}
            >
              <Text style={styles.manualButtonText}>Enter Manually</Text>
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
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
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'space-between',
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