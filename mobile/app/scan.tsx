import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter, useFocusEffect, useLocalSearchParams, useIsFocused } from 'expo-router';
import { ArrowLeft, Flashlight } from 'lucide-react-native';
import { SupermarketSessionModal } from '@/components/SupermarketSessionModal';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');
const SCAN_SIZE = width * 0.7;

export default function ScanScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const { fromBasket } = useLocalSearchParams<{ fromBasket?: string }>();
  const isFocused = useIsFocused();

  const [scanned, setScanned] = useState(false);
  const [flash, setFlash] = useState(false);
  const scanHandled = useRef(false);

  useFocusEffect(
    useCallback(() => {
      scanHandled.current = false;
      setScanned(false);
    }, [])
  );

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    const barcode = data.trim();
    if (!isFocused || scanHandled.current || !barcode) return;

    scanHandled.current = true;
    setScanned(true);
    router.push({
      pathname: '/product/[barcode]',
      params: { barcode, fromBasket },
    });
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
});
