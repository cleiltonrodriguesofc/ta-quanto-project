import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Search, Clock, TrendingUp, User } from 'lucide-react-native';
import { getStoredPrices, getUserProfile } from '@/utils/storage';
import { PriceEntry } from '@/types/price';
import { formatTimeAgo } from '@/utils/date';
import { formatLocationDisplay } from '@/utils/location';
import { UserProfile } from '@/types/user';
import { useTranslation } from 'react-i18next';

export default function CommunityScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [prices, setPrices] = useState<PriceEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'price'>('recent');
  const [filterBy, setFilterBy] = useState<'all' | 'mine'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [storedPrices, profile] = await Promise.all([
        getStoredPrices(),
        getUserProfile()
      ]);
      setPrices(storedPrices);
      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const filteredAndSortedPrices = useMemo(() => {
    let filtered = prices;

    // Filter by user (My Contributions)
    if (filterBy === 'mine' && userProfile?.id) {
      filtered = filtered.filter(price => price.userId === userProfile.id);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = prices.filter(price =>
        price.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        price.supermarket.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort by selected criteria
    if (sortBy === 'recent') {
      filtered = filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } else {
      filtered = filtered.sort((a, b) => a.price - b.price);
    }

    return filtered;
  }, [prices, searchQuery, sortBy, filterBy, userProfile]);

  const renderPriceItem = ({ item }: { item: PriceEntry }) => (
    <TouchableOpacity
      style={styles.priceCard}
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
          <View style={styles.priceHeader}>
            <Text style={styles.productName} numberOfLines={2}>{item.productName}</Text>
            <Text style={styles.price}>R${item.price.toFixed(2)}</Text>
          </View>
          <View style={styles.priceDetails}>
            <Text style={styles.supermarket}>{item.supermarket}</Text>
            {item.quantity && <Text style={styles.quantity}>{item.quantity}</Text>}
          </View>
          {item.location && (
            <Text style={styles.location}>📍 {formatLocationDisplay(item.location)}</Text>
          )}
          <View style={styles.footer}>
            <Text style={styles.timestamp}>{formatTimeAgo(new Date(item.timestamp))}</Text>
            {item.userId === userProfile?.id && (
              <View style={styles.myContributionTag}>
                <User size={12} color="#3A7DE8" />
                <Text style={styles.myContributionText}>{t('me')}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Search size={48} color="#9CA3AF" />
      <Text style={styles.emptyTitle}>
        {filterBy === 'mine' ? t('no_contributions') : (searchQuery ? t('no_matching_prices') : t('no_prices_shared'))}
      </Text>
      <Text style={styles.emptyDescription}>
        {filterBy === 'mine'
          ? t('start_sharing_msg')
          : (searchQuery
            ? t('try_searching_msg')
            : t('start_sharing_community_msg')
          )
        }
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('community_prices')}</Text>
        <Text style={styles.subtitle}>{t('prices_shared_count', { count: prices.length })}</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('search_placeholder')}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      <View style={styles.filtersScroll}>
        <View style={styles.sortContainer}>
          <TouchableOpacity
            style={[styles.sortButton, filterBy === 'all' && styles.sortButtonActive]}
            onPress={() => setFilterBy('all')}
          >
            <Text style={[styles.sortButtonText, filterBy === 'all' && styles.sortButtonTextActive]}>
              {t('all')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, filterBy === 'mine' && styles.sortButtonActive]}
            onPress={() => setFilterBy('mine')}
          >
            <User size={16} color={filterBy === 'mine' ? '#FFFFFF' : '#6B7280'} />
            <Text style={[styles.sortButtonText, filterBy === 'mine' && styles.sortButtonTextActive]}>
              {t('my_contributions')}
            </Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'recent' && styles.sortButtonActive]}
            onPress={() => setSortBy('recent')}
          >
            <Clock size={16} color={sortBy === 'recent' ? '#FFFFFF' : '#6B7280'} />
            <Text style={[styles.sortButtonText, sortBy === 'recent' && styles.sortButtonTextActive]}>
              {t('recent')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'price' && styles.sortButtonActive]}
            onPress={() => setSortBy('price')}
          >
            <TrendingUp size={16} color={sortBy === 'price' ? '#FFFFFF' : '#6B7280'} />
            <Text style={[styles.sortButtonText, sortBy === 'price' && styles.sortButtonTextActive]}>
              {t('price')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredAndSortedPrices}
        renderItem={renderPriceItem}
        keyExtractor={item => item.id}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={filteredAndSortedPrices.length === 0 ? styles.emptyList : styles.list}
      />
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#E0E7FF',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
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
  filtersScroll: {
    marginTop: 16,
  },
  sortContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 8,
    flexWrap: 'wrap',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
    marginBottom: 8,
  },
  sortButtonActive: {
    backgroundColor: '#3A7DE8',
    borderColor: '#3A7DE8',
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  sortButtonTextActive: {
    color: '#FFFFFF',
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 4,
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 100,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  priceCard: {
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3A7DE8',
  },
  priceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  supermarket: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  quantity: {
    fontSize: 14,
    color: '#9CA3AF',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
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
  location: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  myContributionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 4,
  },
  myContributionText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#3A7DE8',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});