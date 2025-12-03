import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { session, isLoading } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === 'auth';

        if (!session && !inAuthGroup) {
            // Redirect to the login page if not signed in
            router.replace('/auth/login');
        } else if (session && inAuthGroup) {
            // Redirect to the home page if already signed in
            router.replace('/(tabs)');
        }
    }, [session, segments, isLoading]);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return <>{children}</>;
}
