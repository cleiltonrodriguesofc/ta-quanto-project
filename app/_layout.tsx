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
        const { isCacheStale, hydrateLocalCache } = await import('@/utils/syncService');

        // 1. Sink local changes TO server (Upload)
        const result = await syncLocalData();
        console.log('[Sync] Upload Result:', result.message);

        // 2. Hydrate local cache FROM server (Download)
        if (await isCacheStale()) {
          console.log('[Sync] Cache is stale, hydrating...');
          await hydrateLocalCache();
        }
      } catch (error) {
        console.error('[Sync] Failed to perform background sync/hydration:', error);
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
