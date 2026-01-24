import { useEffect } from 'react';
import '@/utils/i18n';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { SupermarketProvider } from '@/context/SupermarketContext';

export default function RootLayout() {
  useFrameworkReady();
  useEffect(() => {
    console.log('[DEBUG] App Layout Mounted');
  }, []);


  return (
    <SupermarketProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </SupermarketProvider>
  );
}
