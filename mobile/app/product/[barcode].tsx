import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Plus, MapPin, Clock, TrendingDown, TrendingUp, Check, X } from 'lucide-react-native';
import { useKeepAwake } from 'expo-keep-awake';
import { getLocalPrices, getProductByBarcode, refreshPricesByBarcode, savePriceEntry } from '@/utils/storage';
import { PriceEntry } from '@/types/price';
import { Product } from '@/src/domain/entities';
import { formatTimeAgo } from '@/utils/date';
import { formatLocationDisplay } from '@/utils/location';
import { useSupermarketSession } from '@/context/SupermarketContext';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';


export default function ProductDetailsScreen() {
    useKeepAwake();
    const { barcode, fromBasket } = useLocalSearchParams<{ barcode: string, fromBasket?: string }>();
    const isFromBasket = fromBasket === 'true';

    const { session } = useAuth();
    const router = useRouter();
    const { t } = useTranslation();

    const [prices, setPrices] = useState<PriceEntry[]>([]);
    const [catalogProduct, setCatalogProduct] = useState<Product | null>(null);
    const [priceStatus, setPriceStatus] = useState<'loading' | 'ready' | 'error'>('loading');
    const [selectedPriceStore, setSelectedPriceStore] = useState<string | null>(null);
    const { selectedSupermarket: currentStore, addToBasket } = useSupermarketSession();

    useFocusEffect(useCallback(() => {
        let active = true;
        void (async () => {
            try {
                const cachedPrices = await getLocalPrices(barcode);
                if (!active) return;
                setPrices(cachedPrices);
                setPriceStatus('loading');

                const sharedPrices = await refreshPricesByBarcode(barcode);
                if (!active) return;
                setPrices(current => [...new Map(
                    [...current, ...sharedPrices].map(price => [price.id, price])
                ).values()]);
                setPriceStatus('ready');
            } catch (error) {
                if (!active) return;
                console.warn('[Product Detail] Failed to load prices:', error);
                setPriceStatus('error');
            }
        })();
        return () => { active = false; };
    }, [barcode]));

    useEffect(() => {
        let active = true;
        void getProductByBarcode(barcode).then(product => {
            if (active) setCatalogProduct(product);
        }).catch(error => console.warn('[Product Detail] Product lookup failed:', error));
        return () => { active = false; };
    }, [barcode]);

    const { latestPrices, mostRecent, stats } = useMemo(() => {
        const byStore = new Map<string, PriceEntry>();
        let mostRecent: PriceEntry | undefined;
        for (const price of prices) {
            const previous = byStore.get(price.supermarket);
            if (!previous || Date.parse(price.timestamp) > Date.parse(previous.timestamp)) {
                byStore.set(price.supermarket, price);
            }
            if (!mostRecent || Date.parse(price.timestamp) > Date.parse(mostRecent.timestamp)) {
                mostRecent = price;
            }
        }
        const latestPrices = [...byStore.values()].sort((a, b) => a.price - b.price);
        const best = latestPrices[0];
        const stats = best ? {
            min: best.price,
            avg: latestPrices.reduce((total, price) => total + price.price, 0) / latestPrices.length,
            minSupermarket: best.supermarket,
        } : null;
        return { latestPrices, mostRecent, stats };
    }, [prices]);

    const productInfo = {
        productName: mostRecent?.productName || catalogProduct?.name,
        brand: mostRecent?.brand || catalogProduct?.brand,
        imageUrl: mostRecent?.imageUrl || catalogProduct?.imageUrl,
    };
    const selectedSupermarket = selectedPriceStore ?? currentStore ?? stats?.minSupermarket;
    const currentSupermarketPrice = latestPrices.find(price =>
        price.supermarket === (currentStore ?? selectedSupermarket)
    );

    const isUpdatedToday = currentSupermarketPrice && new Date(currentSupermarketPrice.timestamp).toDateString() === new Date().toDateString();

    const handleConfirmPrice = async () => {
        if (!session) {
            router.push('/auth/login');
            return;
        }
        if (!currentSupermarketPrice) return;

        try {
            const confirmed = await savePriceEntry({
                ...currentSupermarketPrice,
                timestamp: new Date().toISOString(),
            });

            setPrices(current => [confirmed, ...current]);

            if (isFromBasket) {
                await addToBasket({
                    barcode,
                    productName: productInfo.productName || t('unknown_product'),
                    price: currentSupermarketPrice.price,
                    quantity: 1,
                    supermarket: currentSupermarketPrice.supermarket,
                    imageUrl: productInfo.imageUrl,
                    timestamp: new Date().toISOString(),
                });
            }

            Alert.alert(t('success'), isFromBasket ? t('item_added_to_basket') : t('price_confirmed'), [
                {
                    text: isFromBasket ? t('add_more') : 'OK',
                    onPress: () => {
                        console.log('[Product Detail] User chose:', isFromBasket ? 'Add More' : 'OK');
                        if (isFromBasket) {
                            // Pass fromBasket=true back to scan
                            router.replace('/scan?fromBasket=true');
                        }
                    }
                },
                ...(isFromBasket ? [{
                    text: t('view_basket'),
                    onPress: () => {
                        console.log('[Product Detail] User chose: View Basket');
                        router.replace('/(tabs)/shop');
                    }
                }] : [])
            ]);
        } catch (error) {
            console.error('Error confirming price:', error);
            Alert.alert(t('error'), t('confirm_error'));
        }
    };

    const handleUpdatePrice = () => {
        if (!session) {
            router.push('/auth/login');
            return;
        }
        router.push({
            pathname: '/register',
            params: {
                barcode,
                productName: productInfo.productName,
                imageUrl: productInfo.imageUrl,
                brand: productInfo.brand,
                productSource: catalogProduct?.source,
                fromBasket,
                fromProduct: 'true',
            },
        });
    };

    const renderPriceItem = ({ item }: { item: PriceEntry }) => {
        const isBestPrice = stats && item.price === stats.min;
        const isSelected = item.supermarket === selectedSupermarket;

        return (
            <TouchableOpacity
                style={[
                    styles.priceCard,
                    isSelected && styles.priceCardSelected,
                    isBestPrice && styles.priceCardBest
                ]}
                onPress={() => setSelectedPriceStore(item.supermarket)}
                activeOpacity={0.7}
            >
                <View style={styles.priceHeader}>
                    <View style={styles.supermarketContainer}>
                        <Text style={[styles.supermarket, isBestPrice && styles.supermarketBest]}>
                            {item.supermarket}
                        </Text>
                        {isBestPrice && (
                            <View style={styles.bestPriceBadge}>
                                <Text style={styles.bestPriceText}>{t('best_price')}</Text>
                            </View>
                        )}
                    </View>
                    <Text style={[styles.price, isBestPrice && styles.priceBest]}>
                        R${item.price.toFixed(2)}
                    </Text>
                </View>
                <View style={styles.priceDetails}>
                    {item.location && (
                        <View style={styles.detailRow}>
                            <MapPin size={14} color={isBestPrice ? "#059669" : "#6B7280"} />
                            <Text style={[styles.detailText, isBestPrice && styles.detailTextBest]}>
                                {formatLocationDisplay(item.location)}
                            </Text>
                        </View>
                    )}
                    <View style={styles.detailRow}>
                        <Clock size={14} color={isBestPrice ? "#059669" : "#6B7280"} />
                        <Text style={[styles.detailText, isBestPrice && styles.detailTextBest]}>
                            {formatTimeAgo(new Date(item.timestamp))}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('product_details')}</Text>
                <View style={{ width: 24 }} />
            </View>

            <FlatList
                data={latestPrices}
                renderItem={renderPriceItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={
                    <>
                        {currentStore && (
                            <View style={styles.supermarketBadge}>
                                <MapPin size={24} color="#FFFFFF" />
                                <Text style={styles.supermarketBadgeText}>{currentStore}</Text>
                            </View>
                        )}

                        <View style={styles.productCard}>
                            {productInfo.imageUrl ? (
                                <Image source={{ uri: productInfo.imageUrl }} style={styles.productImage} />
                            ) : (
                                <View style={styles.placeholderImage} />
                            )}
                            <View style={styles.productInfo}>
                                <Text style={styles.productName}>{productInfo.productName || t('unknown_product')}</Text>
                                {productInfo.brand && (
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
                                        <Text style={styles.statLabel}>{t('best_price')}</Text>
                                        <Text style={[styles.statValue, { color: '#10B981' }]}>
                                            R${stats.min.toFixed(2)}
                                        </Text>
                                        <Text style={styles.statSupermarket}>{stats.minSupermarket}</Text>
                                    </View>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statItem}>
                                    <TrendingUp size={20} color="#3A7DE8" />
                                    <View>
                                        <Text style={styles.statLabel}>{t('average')}</Text>
                                        <Text style={styles.statValue}>R${stats.avg.toFixed(2)}</Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        {currentSupermarketPrice && (
                            <View style={[
                                styles.verificationCard,
                                isUpdatedToday ? styles.cardUpdated : styles.cardVerify
                            ]}>
                                <Text style={styles.verificationTitle}>
                                    {isUpdatedToday ? t('price_updated_today') : t('verify_price')}
                                </Text>
                                <Text style={styles.verificationText}>
                                    {isUpdatedToday
                                        ? t('price_confirmed_today')
                                        : t('is_price_still', { price: currentSupermarketPrice.price.toFixed(2) })
                                    }
                                </Text>
                                {!isUpdatedToday && (
                                    <View style={styles.verificationButtons}>
                                        <TouchableOpacity style={[styles.verifyButton, styles.verifyButtonNo]} onPress={handleUpdatePrice}>
                                            <X size={20} color="#EF4444" />
                                            <Text style={styles.verifyButtonText}>{t('no')}</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[styles.verifyButton, styles.verifyButtonYes]} onPress={handleConfirmPrice}>
                                            <Check size={20} color="#10B981" />
                                            <Text style={styles.verifyButtonText}>{isFromBasket ? t('confirm_and_add') : t('yes')}</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        )}

                        <Text style={styles.sectionTitle}>{t('supermarket_prices')}</Text>
                        {currentStore && !currentSupermarketPrice && priceStatus === 'ready' && (
                            <Text style={styles.emptyText}>{t('price_not_found_supermarket')}</Text>
                        )}
                        {latestPrices.length > 0 && priceStatus === 'error' && (
                            <Text style={styles.emptyText}>{t('prices_unavailable')}</Text>
                        )}
                    </>
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        {priceStatus === 'loading' ? (
                            <ActivityIndicator color="#3A7DE8" />
                        ) : (
                            <Text style={styles.emptyText}>
                                {t(priceStatus === 'error' ? 'prices_unavailable' : 'no_prices_recorded')}
                            </Text>
                        )}
                    </View>
                }
            />

            <TouchableOpacity style={styles.fab} onPress={handleUpdatePrice} accessibilityLabel={t('add_price')}>
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
    supermarketBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3A7DE8',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 30,
        marginBottom: 20,
        gap: 10,
        alignSelf: 'center',
        shadowColor: '#3A7DE8',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 6,
    },
    supermarketBadgeText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
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
    statSupermarket: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    verificationCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
    },
    cardVerify: {
        backgroundColor: '#EFF6FF',
        borderColor: '#BFDBFE',
    },
    cardUpdated: {
        backgroundColor: '#ECFDF5',
        borderColor: '#A7F3D0',
    },
    cardMissing: {
        backgroundColor: '#FFFBEB',
        borderColor: '#FDE68A',
    },
    verificationTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    textVerify: { color: '#1E40AF' },
    textUpdated: { color: '#065F46' },
    textMissing: { color: '#92400E' },
    verificationText: {
        fontSize: 16,
        color: '#1E3A8A',
        marginBottom: 12,
    },
    verificationPrice: {
        fontWeight: 'bold',
    },
    verificationButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    verifyButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        gap: 6,
    },
    verifyButtonNo: {
        backgroundColor: '#FEF2F2',
        borderColor: '#FECACA',
    },
    verifyButtonYes: {
        backgroundColor: '#ECFDF5',
        borderColor: '#A7F3D0',
    },
    verifyButtonAdd: {
        backgroundColor: '#3A7DE8',
        borderColor: '#2563EB',
        borderWidth: 0,
    },
    verifyButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    verifyButtonTextWhite: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statusText: {
        fontSize: 14,
        color: '#059669',
        fontWeight: '500',
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
        borderWidth: 1,
        borderColor: 'transparent',
    },
    priceCardSelected: {
        borderColor: '#3A7DE8',
        backgroundColor: '#F0F9FF',
    },
    priceCardBest: {
        borderColor: '#10B981',
        backgroundColor: '#ECFDF5',
    },
    priceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    supermarketContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    supermarket: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    supermarketBest: {
        color: '#059669',
        fontWeight: 'bold',
    },
    bestPriceBadge: {
        backgroundColor: '#10B981',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    bestPriceText: {
        fontSize: 10,
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    price: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#3A7DE8',
    },
    priceBest: {
        color: '#059669',
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
    detailTextBest: {
        color: '#047857',
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
    toast: {
        position: 'absolute',
        bottom: 90,
        left: 20,
        right: 20,
        backgroundColor: '#10B981',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 6,
    },
    toastText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
