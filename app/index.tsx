import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '@/utils/supabase';

WebBrowser.maybeCompleteAuthSession();

export default function LandingScreen() {
    console.log('[DEBUG] Landing Screen Rendered');
    const { session, isLoading } = useAuth();
    const router = useRouter();
    const [authLoading, setAuthLoading] = useState(false);

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3A7DE8" />
            </View>
        );
    }

    if (session) {
        return <Redirect href="/(tabs)" />;
    }

    return (
        <View style={styles.container}>
            <View style={styles.heroSection}>
                <View style={styles.iconContainer}>
                    <Ionicons name="cart" size={64} color="#FFFFFF" />
                </View>
                <Text style={styles.appName}>TaQuanto?</Text>
                <Text style={styles.tagline}>
                    Compare preços, economize e compartilhe ofertas com a comunidade.
                </Text>
            </View>

            <View style={styles.actionSection}>
                <TouchableOpacity
                    style={styles.emailButton}
                    onPress={() => router.push('/auth/login')}
                    disabled={authLoading}
                >
                    <Ionicons name="mail" size={24} color="#FFFFFF" style={styles.buttonIcon} />
                    <Text style={styles.emailButtonText}>Entrar com Email</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.createAccountButton}
                    onPress={() => router.push('/auth/login')} // Register often goes to login page first or same flow
                    disabled={authLoading}
                >
                    <Text style={styles.createAccountText}>Criar uma conta</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#3A7DE8',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    heroSection: {
        flex: 3,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    iconContainer: {
        width: 120,
        height: 120,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    appName: {
        fontSize: 42,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 16,
    },
    tagline: {
        fontSize: 18,
        color: '#E0E7FF',
        textAlign: 'center',
        lineHeight: 26,
    },
    actionSection: {
        flex: 2,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 30,
        justifyContent: 'center',
        gap: 16,
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 16,
        paddingVertical: 16,
        marginBottom: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    buttonIcon: {
        marginRight: 12,
    },
    googleButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#374151',
    },
    emailButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3A7DE8',
        borderRadius: 16,
        paddingVertical: 16,
        elevation: 2,
        shadowColor: '#3A7DE8',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    emailButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    createAccountButton: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    createAccountText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#3A7DE8',
    },
});
