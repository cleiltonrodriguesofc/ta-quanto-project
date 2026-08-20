import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    RefreshControl,
    ActivityIndicator,
    Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Package, Search, Tag, TrendingDown } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Product } from '@/types/product';
import { getProducts } from '@/utils/productService';

export default function ProductsScreen() {
    const router = useRouter();
    const { t } = useTranslation();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const loadData = async () => {
        try {
            const data = await getProducts();
            setProducts(data);
        } catch (error) {
            console.error('Failed to load products:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const filteredProducts = products.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.brand && product.brand.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const renderItem = ({ item }: { item: Product }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() =>
                router.push({
                    pathname: '/product/[id]',
                    params: { id: item.barcode, name: item.name },
                })
            }
        >
            <View style={styles.cardContent}>
                {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
                ) : (
                    <View style={styles.placeholderImage}>
                        <Package size={24} color="#CBD5E1" />
                    </View>
                )}
                <View style={styles.cardInfo}>
                    <View style={styles.priceHeader}>
                        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                        {item.bestPrice !== undefined && (
                            <View style={styles.priceContainer}>
                                <View style={styles.bestPriceBadge}>
                                    <TrendingDown size={12} color="#16A34A" />
                                    <Text style={styles.bestPriceLabel}>{t('best_price') || 'Best'}</Text>
                                </View>
                                <Text style={styles.price}>R${item.bestPrice.toFixed(2)}</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.priceDetails}>
                        {item.supermarket && (
                            <Text style={styles.supermarket}>{item.supermarket}</Text>
                        )}
                        {item.brand && (
                            <View style={styles.tagContainer}>
                                <Tag size={12} color="#6B7280" />
                                <Text style={styles.brand}>{item.brand}</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.barcode}>{item.barcode}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{t('products') || 'Products'}</Text>
            </View>

            <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                    <Search size={20} color="#9CA3AF" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={t('search_placeholder') || 'Search...'}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#9CA3AF"
                    />
                </View>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3A7DE8" />
                </View>
            ) : (
                <FlatList
                    data={filteredProducts}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.barcode}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>{t('no_products_found') || 'No products found'}</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
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
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    searchContainer: {
        paddingHorizontal: 20,
        marginTop: 20,
        marginBottom: 10,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        height: 48,
        fontSize: 16,
        color: '#1F2937',
    },
    list: {
        padding: 20,
        paddingBottom: 100,
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
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardInfo: {
        flex: 1,
    },
    priceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    productName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
        flex: 1,
        marginRight: 8,
    },
    price: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#16A34A', // Green for best price
    },
    priceContainer: {
        alignItems: 'flex-end',
    },
    bestPriceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        backgroundColor: '#DCFCE7',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginBottom: 2,
    },
    bestPriceLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#16A34A',
    },
    priceDetails: {
        flexDirection: 'column', // Stack supermarket and brand
        marginBottom: 8,
        gap: 2,
    },
    supermarket: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '600',
    },
    tagContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    brand: {
        fontSize: 12,
        color: '#6B7280',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginTop: 4,
    },
    barcode: {
        fontSize: 10,
        color: '#9CA3AF',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        overflow: 'hidden',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: '#6B7280',
        fontSize: 16,
    },
});
