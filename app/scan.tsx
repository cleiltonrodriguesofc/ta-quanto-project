import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Camera, RotateCcw, CircleCheck as CheckCircle, X, MapPin } from 'lucide-react-native';
import { mockVisionAPI } from '@/utils/mockVision';
import { getCurrentLocation, formatLocationDisplay, LocationData } from '@/utils/location';

export default function ScanScreen() {
  const router = useRouter();
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const [location, setLocation] = useState<LocationData | null>(null);

  // Get location when component mounts
  React.useEffect(() => {
    const getLocation = async () => {
      const currentLocation = await getCurrentLocation();
      if (currentLocation) {
        setLocation(currentLocation);
      }
    };
    getLocation();
  }, []);

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3A7DE8" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <View style={styles.permissionCard}>
          <Camera size={64} color="#3A7DE8" />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionDescription}>
            TaQuanto? needs camera access to scan products and identify prices
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;

    setIsScanning(true);
    try {
      const photo = await cameraRef.current.takePictureAsync();
      if (photo) {
        // Mock Vision API call
        const productSuggestions = await mockVisionAPI(photo.uri);
        setSuggestions(productSuggestions);
        setShowSuggestions(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to scan product. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const selectProduct = (productName: string) => {
    router.push({
      pathname: '/register',
      params: { 
        productName,
        location: location ? JSON.stringify(location) : undefined
      }
    });
  };

  const closeSuggestions = () => {
    setShowSuggestions(false);
    setSuggestions([]);
  };

  if (showSuggestions) {
    return (
      <View style={styles.container}>
        <View style={styles.suggestionsHeader}>
          <Text style={styles.suggestionsTitle}>Product Suggestions</Text>
          <TouchableOpacity onPress={closeSuggestions} style={styles.closeButton}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsSubtitle}>
            Select the product that matches what you scanned:
          </Text>
          
          {suggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestionCard}
              onPress={() => selectProduct(suggestion)}
              activeOpacity={0.7}
            >
              <CheckCircle size={24} color="#10B981" />
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity
            style={styles.manualEntryButton}
            onPress={() => router.push('/register')}
          >
            <Text style={styles.manualEntryText}>Enter product name manually</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.cameraHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <X size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.cameraTitle}>Scan Product</Text>
        <TouchableOpacity onPress={toggleCameraFacing} style={styles.flipButton}>
          <RotateCcw size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        <View style={styles.scanOverlay}>
          <View style={styles.scanFrame} />
          <Text style={styles.scanInstructions}>
            Point camera at product or price tag
          </Text>
          {location && (
            <View style={styles.locationIndicator}>
              <MapPin size={16} color="#FFFFFF" />
              <Text style={styles.locationText}>
                {formatLocationDisplay(location)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cameraControls}>
          <TouchableOpacity
            style={[styles.captureButton, isScanning && styles.captureButtonDisabled]}
            onPress={takePicture}
            disabled={isScanning}
            activeOpacity={0.7}
          >
            {isScanning ? (
              <ActivityIndicator size="large" color="#FFFFFF" />
            ) : (
              <Camera size={32} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
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
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
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
  cameraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  backButton: {
    padding: 8,
  },
  cameraTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  flipButton: {
    padding: 8,
  },
  camera: {
    flex: 1,
  },
  scanOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#3A7DE8',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  scanInstructions: {
    fontSize: 16,
    color: '#FFFFFF',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 20,
    textAlign: 'center',
  },
  locationIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
    gap: 6,
  },
  locationText: {
    fontSize: 12,
    color: '#FFFFFF',
    maxWidth: 200,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3A7DE8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  captureButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#3A7DE8',
  },
  suggestionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 8,
  },
  suggestionsContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 20,
  },
  suggestionsSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  suggestionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    gap: 16,
  },
  suggestionText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
    flex: 1,
  },
  manualEntryButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  manualEntryText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
});