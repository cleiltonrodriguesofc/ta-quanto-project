import '@testing-library/jest-native/extend-expect';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Expo modules
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  Stack: ({ children }) => children,
  Tabs: ({ children }) => children,
}));

jest.mock('expo-camera', () => ({
  CameraView: 'CameraView',
  useCameraPermissions: () => [
    { granted: true },
    jest.fn(),
  ],
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' })
  ),
  getCurrentPositionAsync: jest.fn(() =>
    Promise.resolve({
      coords: {
        latitude: -23.5505,
        longitude: -46.6333,
      },
    })
  ),
  reverseGeocodeAsync: jest.fn(() =>
    Promise.resolve([
      {
        street: 'Rua Augusta',
        district: 'Consolação',
        city: 'São Paulo',
        region: 'SP',
      },
    ])
  ),
  Accuracy: {
    Balanced: 4,
  },
}));

// Mock react-native modules
// jest.mock('react-native', () => {
//   const RN = jest.requireActual('react-native');
//   return {
//     ...RN,
//     Alert: {
//       alert: jest.fn(),
//     },
//   };
// });

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      changeLanguage: () => new Promise(() => { }),
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: () => { },
  },
}));

// Mock TurboModuleRegistry to handle DevMenu
jest.mock('react-native/Libraries/TurboModule/TurboModuleRegistry', () => {
  const actual = jest.requireActual('react-native/Libraries/TurboModule/TurboModuleRegistry');
  return {
    ...actual,
    getEnforcing: (name) => {
      // Return a generic mock for any module to prevent crashes
      const genericMock = {
        show: jest.fn(),
        reload: jest.fn(),
        addListener: jest.fn(),
        removeListeners: jest.fn(),
        getConstants: () => ({}),
      };

      try {
        return actual.getEnforcing(name);
      } catch (e) {
        // Fallback if not found
        return genericMock;
      }
    },
  };
});

// Mock Global React Native modules to silence warnings and fix environment
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');
jest.mock('react-native/Libraries/EventEmitter/RCTNativeAppEventEmitter');

// Mock Assertions
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Alert: {
      ...RN.Alert,
      alert: jest.fn(),
    },
    NativeEventEmitter: jest.fn(() => ({
      addListener: jest.fn(() => ({ remove: jest.fn() })),
      removeListeners: jest.fn(),
    })),
    Keyboard: {
      addListener: jest.fn(() => ({ remove: jest.fn() })),
      dismiss: jest.fn(),
    },
    // Mock deprecated/extracted modules to silence warnings
    PushNotificationIOS: {
      addEventListener: jest.fn(),
      requestPermissions: jest.fn(() => Promise.resolve({})),
      getInitialNotification: jest.fn(() => Promise.resolve(null)),
    },
    Clipboard: {
      setString: jest.fn(),
      getString: jest.fn(() => Promise.resolve('')),
    },
    ProgressBarAndroid: 'ProgressBarAndroid',
    SafeAreaView: 'SafeAreaView',
  };
});

// Mock internal Keyboard module to ensure imports rely on this mock
jest.mock('react-native/Libraries/Components/Keyboard/Keyboard', () => ({
  addListener: jest.fn(() => ({ remove: jest.fn() })),
  dismiss: jest.fn(),
  removeAllListeners: jest.fn(),
  isVisible: jest.fn(() => false),
}));