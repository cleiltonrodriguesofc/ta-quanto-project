import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Bell } from 'lucide-react-native';
import { MOCK_POSTS } from '@/utils/mockSocialData';
import SocialPostCard from '@/components/SocialPostCard';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';

export default function SocialScreen() {
    const router = useRouter();
    const { t } = useTranslation();
    const { user, isLoading } = useAuth();

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/auth/login');
        }
    }, [user, isLoading, router]);

    if (isLoading || !user) return null;

    const handleCreatePost = () => {
        router.push('/create-post' as any);
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{t('social')}</Text>
                <TouchableOpacity style={styles.iconButton}>
                    <Bell size={24} color="#1F2937" />
                </TouchableOpacity>
            </View>

            {/* Feed */}
            <FlatList
                data={MOCK_POSTS}
                renderItem={({ item }) => <SocialPostCard post={item} />}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />

            {/* FAB */}
            <TouchableOpacity style={styles.fab} onPress={handleCreatePost}>
                <Plus size={24} color="#FFFFFF" />
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    iconButton: {
        padding: 8,
    },
    listContent: {
        paddingBottom: 80,
    },
    fab: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#3A7DE8',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#3A7DE8',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
});
