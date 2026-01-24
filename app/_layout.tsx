import { useEffect } from 'react';
import '@/utils/i18n';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { SupermarketProvider } from '@/context/SupermarketContext';
import { AuthProvider } from '@/context/AuthContext';

export default function RootLayout() {
  useFrameworkReady();

  useEffect(() => {
    console.log('[DEBUG] App Layout Mounted');

    // Attempt to sync local data to Supabase on app start
    const performSync = async () => {
      console.log('[Sync] Starting background sync...');
      try {
        const { syncLocalData } = await import('@/utils/storage');
        const result = await syncLocalData();
        console.log('[Sync] Result:', result.message);
      } catch (error) {
        console.error('[Sync] Failed to start sync:', error);
      }
    };

    performSync();
  }, []);

  return (
    <AuthProvider>
      <SupermarketProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </SupermarketProvider>
    </AuthProvider>
  );
}
