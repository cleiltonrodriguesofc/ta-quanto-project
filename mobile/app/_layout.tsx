import { useEffect, useState } from 'react';
import '@/utils/i18n';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useBackendWarmup } from '@/hooks/useBackendWarmup';
import { SupermarketProvider } from '@/context/SupermarketContext';
import { AuthProvider } from '@/context/AuthContext';


function WarmupBanner({ status }: { status: string }) {
  const [opacity] = useState(new Animated.Value(0));

  useEffect(() => {
    // Fade in
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (status === 'ready') {
      // Fade out quando pronto
      Animated.timing(opacity, {
        toValue: 0,
        duration: 600,
        delay: 800,
        useNativeDriver: true,
      }).start();
    }
  }, [status]);

  if (status === 'loading') {
    return (
      <Animated.View style={[styles.banner, styles.bannerLoading, { opacity }]}>
        <Text style={styles.bannerText}>⏳ Conectando ao servidor...</Text>
      </Animated.View>
    );
  }

  if (status === 'ready') {
    return (
      <Animated.View style={[styles.banner, styles.bannerReady, { opacity }]}>
        <Text style={styles.bannerText}>✅ Servidor pronto</Text>
      </Animated.View>
    );
  }

  if (status === 'timeout' || status === 'error') {
    return (
      <Animated.View style={[styles.banner, styles.bannerError, { opacity }]}>
        <Text style={styles.bannerText}>⚠️ Servidor demorando — tente novamente</Text>
      </Animated.View>
    );
  }

  return null;
}

export default function RootLayout() {
  useFrameworkReady();
  const { status: warmupStatus } = useBackendWarmup();
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    console.log('[DEBUG] App Layout Mounted');
    console.log(`[Warmup] Status inicial: ${warmupStatus}`);
  }, []);

  // Oculta o banner após 2s do servidor ficar pronto (ou em caso de erro permanente)
  useEffect(() => {
    if (warmupStatus === 'ready') {
      const t = setTimeout(() => setShowBanner(false), 2000);
      return () => clearTimeout(t);
    }
    if (warmupStatus === 'timeout' || warmupStatus === 'error') {
      const t = setTimeout(() => setShowBanner(false), 5000);
      return () => clearTimeout(t);
    }
  }, [warmupStatus]);

  useEffect(() => {
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
        {showBanner && <WarmupBanner status={warmupStatus} />}
      </SupermarketProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 48,
    paddingBottom: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    zIndex: 9999,
  },
  bannerLoading: {
    backgroundColor: '#1E3A5F',
  },
  bannerReady: {
    backgroundColor: '#166534',
  },
  bannerError: {
    backgroundColor: '#7F1D1D',
  },
  bannerText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

