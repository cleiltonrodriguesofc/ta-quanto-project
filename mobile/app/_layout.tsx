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
        const { syncOfflineData } = await import('@/utils/syncService');

        // Upload local offline prices to server
        const result = await syncOfflineData();
        if (result.syncedCount > 0) {
          console.log('[Sync] Synced', result.syncedCount, 'offline prices to server');
        }
      } catch (error) {
        console.error('[Sync] Failed to perform background sync:', error);
      }
    };

    performSync();
  }, []);

  return (
    <AuthProvider>
      <SupermarketProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="auth/login" />
          <Stack.Screen name="auth/register" />
          <Stack.Screen name="product/[barcode]" />
          <Stack.Screen name="product/[id]" />
          <Stack.Screen name="supermarket/[id]" />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </SupermarketProvider>
    </AuthProvider>
  );
}
