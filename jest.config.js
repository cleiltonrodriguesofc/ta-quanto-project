module.exports = {
  preset: 'jest-expo/android',
  setupFilesAfterEnv: ['<rootDir>/jest-setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo|@unimodules|unimodules|sentry-expo|native-base|react-clone-referenced-element|@react-native-community|expo-router|@expo/vector-icons|lucide-react-native|expo-modules-core|expo-font|expo-asset|expo-constants|expo-image-picker|expo-image-manipulator|expo-camera|@react-navigation|react-navigation|react-native-url-polyfill|expo-localization)/)',
  ],
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)',
  ],
  collectCoverageFrom: [
    'utils/**/*.{ts,tsx}',
    'app/**/*.{ts,tsx}',
    'types/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};