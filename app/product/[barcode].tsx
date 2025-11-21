import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Plus, MapPin, Clock, TrendingDown, TrendingUp } from 'lucide-react-native';
import { getPricesByBarcode } from '@/utils/storage';
import { PriceEntry } from '@/types/price';
import { formatTimeAgo } from '@/utils/date';
import { formatLocationDisplay } from '@/utils/location';

export default function ProductDetailsScreen() {
    const { barcode } = useLocalSearchParams<{ barcode: string }>();
    const router = useRouter();
    const [prices, setPrices] = useState<PriceEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [productInfo, setProductInfo] = useState<{
        name: string;
        brand?: string;
        imageUrl?: string;
    } | null>(null);

    useEffect(() => {
        if (barcode) {
            loadPrices();
        }
    }, [barcode]);

    const loadPrices = async () => {
        setLoading(true);
        try {
            const fetchedPrices = await getPricesByBarcode(barcode);
            setPrices(fetchedPrices);

            if (fetchedPrices.length > 0) {
                const newest = fetchedPrices[0];
                setProductInfo({
                    name: newest.productName,
                    brand: newest.brand,
                    imageUrl: newest.imageUrl,
                });
            }
        } catch (error) {
            console.error('Error loading prices:', error);
        } finally {
            setLoading(false);
        }
    };

    const getPriceStats = () => {
        if (prices.length === 0) return null;
        const values = prices.map(p => p.price);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        return { min, max, avg };
    };

    const stats = getPriceStats();

    const handleAddPrice = () => {
        router.push({
            pathname: '/register',
            params: {
                barcode,
                productName: productInfo?.name,
                imageUrl: productInfo?.imageUrl,
                brand: productInfo?.brand,
            },
        });
    };

    const renderPriceItem = ({ item }: { item: PriceEntry }) => (
        <View style={styles.priceCard}>
            <View style={styles.priceHeader}>
                <Text style={styles.supermarket}>{item.supermarket}</Text>
                <Text style={styles.price}>R${item.price.toFixed(2)}</Text>
            </View>
            <View style={styles.priceDetails}>
                {item.location && (
                    <View style={styles.detailRow}>
                        <MapPin size={14} color="#6B7280" />
                        <Text style={styles.detailText}>{formatLocationDisplay(item.location)}</Text>
                    </View>
                )}
                <View style={styles.detailRow}>
                    <Clock size={14} color="#6B7280" />
                    <Text style={styles.detailText}>{formatTimeAgo(new Date(item.timestamp))}</Text>
                </View>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3A7DE8" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Product Details</Text>
                <View style={{ width: 24 }} />
            </View>

            <FlatList
                data={prices}
                renderItem={renderPriceItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={
                    <>
                        <View style={styles.productCard}>
                            {productInfo?.imageUrl ? (
                                <Image source={{ uri: productInfo.imageUrl }} style={styles.productImage} />
                            ) : (
                                <View style={styles.placeholderImage} />
                            )}
                            <View style={styles.productInfo}>
                                <Text style={styles.productName}>{productInfo?.name || 'Unknown Product'}</Text>
                                {productInfo?.brand && (
                                    <Text style={styles.productBrand}>{productInfo.brand}</Text>
                                )}
                                <Text style={styles.barcode}>{barcode}</Text>
                            </View>
                        </View>

                        {stats && (
                            <View style={styles.statsContainer}>
                                <View style={styles.statItem}>
                                    <TrendingDown size={20} color="#10B981" />
                                    <View>
                                        <Text style={styles.statLabel}>Best Price</Text>
                                        <Text style={[styles.statValue, { color: '#10B981' }]}>
                                            R${stats.min.toFixed(2)}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statItem}>
                                    <TrendingUp size={20} color="#3A7DE8" />
                                    <View>
                                        <Text style={styles.statLabel}>Average</Text>
                                        <Text style={styles.statValue}>R${stats.avg.toFixed(2)}</Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        <Text style={styles.sectionTitle}>Price History</Text>
                    </>
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No prices recorded yet.</Text>
                    </View>
                }
            />

            <TouchableOpacity style={styles.fab} onPress={handleAddPrice}>
                <Plus size={24} color="#FFFFFF" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: '#3A7DE8',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    listContent: {
        padding: 20,
        paddingBottom: 100,
    },
    productCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    productImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        backgroundColor: '#F1F5F9',
    },
    placeholderImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        backgroundColor: '#F1F5F9',
    },
    productInfo: {
        flex: 1,
        marginLeft: 16,
        justifyContent: 'center',
    },
    productName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4,
    },
    productBrand: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 4,
    },
    barcode: {
        fontSize: 12,
        color: '#9CA3AF',
        fontFamily: 'monospace',
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    statItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    statDivider: {
        width: 1,
        backgroundColor: '#E5E7EB',
        marginHorizontal: 16,
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 2,
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 12,
    },
    priceCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    priceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    supermarket: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    price: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#3A7DE8',
    },
    priceDetails: {
        gap: 4,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    detailText: {
        fontSize: 12,
        color: '#6B7280',
    },
    emptyState: {
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        color: '#6B7280',
        fontSize: 14,
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#3A7DE8',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 8,
    },
});
