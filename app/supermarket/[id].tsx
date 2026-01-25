import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    Image,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ArrowLeft, Search, MapPin } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { getProductsBySupermarketName, getSupermarketById } from '@/utils/supermarketService';
import { Supermarket } from '@/types/supermarket';
import { PriceEntry } from '@/types/price';
import { formatTimeAgo } from '@/utils/date';

export default function SupermarketDetailScreen() {
    const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
    const router = useRouter();
    const { t } = useTranslation();

    const [supermarket, setSupermarket] = useState<Supermarket | null>(null);
    const [products, setProducts] = useState<PriceEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadData();
    }, [id, name]);

    const loadData = async () => {
        try {
            let currentName = name;

            // If we don't have the name passed via params, or just to get full details
            if (id) {
                const data = await getSupermarketById(id);
                if (data) {
                    setSupermarket(data);
                    currentName = data.name;
                }
            }

            if (currentName) {
                const productData = await getProductsBySupermarketName(currentName);
                setProducts(productData);
            }
        } catch (error) {
            console.error('Error loading supermarket details:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const renderProduct = ({ item }: { item: PriceEntry }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/product/${item.barcode}`)}
        >
            <View style={styles.cardContent}>
                {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
                ) : (
                    <View style={styles.placeholderImage}>
                        <Search size={24} color="#CBD5E1" />
                    </View>
                )}
                <View style={styles.cardInfo}>
                    <Text style={styles.productName} numberOfLines={2}>
                        {item.productName}
                    </Text>
                    <Text style={styles.price}>R${item.price.toFixed(2)}</Text>
                    <View style={styles.footer}>
                        <Text style={styles.timestamp}>{formatTimeAgo(new Date(item.timestamp))}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.title}>{supermarket?.name || name || t('supermarket')}</Text>
                    {supermarket?.address && (
                        <View style={styles.addressContainer}>
                            <MapPin size={12} color="#E0E7FF" />
                            <Text style={styles.address}>{supermarket.address}</Text>
                        </View>
                    )}
                </View>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3A7DE8" />
                </View>
            ) : (
                <FlatList
                    data={products}
                    renderItem={renderProduct}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <StoreIcon size={48} color="#9CA3AF" />
                            <Text style={styles.emptyTitle}>{t('no_products_found')}</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

function StoreIcon({ size, color }: { size: number; color: string }) {
    return (
        <View style={{ marginBottom: 16 }}>
            <Search size={size} color={color} />
        </View>
    )
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: '#3A7DE8',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    backButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    addressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: 4,
    },
    address: {
        fontSize: 12,
        color: '#E0E7FF',
    },
    list: {
        padding: 20,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    cardContent: {
        flexDirection: 'row',
        gap: 12,
    },
    productImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
        backgroundColor: '#F1F5F9',
    },
    placeholderImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    productName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4,
    },
    price: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#3A7DE8',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    timestamp: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyTitle: {
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '600',
    },
});
