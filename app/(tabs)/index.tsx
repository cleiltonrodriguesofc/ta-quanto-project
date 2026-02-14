import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Search } from 'lucide-react-native';
import { getStoredPrices } from '@/utils/storage';
import { calculatePotentialSavings } from '@/utils/savings';
import { PriceEntry } from '@/types/price';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [totalSavings, setTotalSavings] = useState(0);
  const [priceCount, setPriceCount] = useState(0);
  const [recentPrices, setRecentPrices] = useState<PriceEntry[]>([]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      console.log('[Home] Loading stats...');
      const prices = await getStoredPrices();
      console.log(`[Home] Stats loaded: ${prices.length} prices`);
      setPriceCount(prices.length);

      // Real savings calculation
      const calculatedSavings = calculatePotentialSavings(prices);
      setTotalSavings(calculatedSavings);

      // Get 3 most recent prices
      const sortedPrices = [...prices].sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setRecentPrices(sortedPrices.slice(0, 3));
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>TaQuanto?</Text>
        <Text style={styles.subtitle}>{t('welcome')}</Text>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>R${totalSavings.toFixed(2)}</Text>
          <Text style={styles.statLabel}>{t('potential_savings')}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{priceCount}</Text>
          <Text style={styles.statLabel}>{t('prices_shared')}</Text>
        </View>
      </View>

      <View style={styles.recentActivity}>
        <Text style={styles.sectionTitle}>{t('recent_prices')}</Text>
        {recentPrices.length > 0 ? (
          recentPrices.map((price) => (
            <TouchableOpacity
              key={price.id}
              style={styles.activityCard}
              onPress={() => router.push(`/product/${price.barcode}`)}
            >
              <View style={styles.activityContent}>
                {price.imageUrl ? (
                  <Image source={{ uri: price.imageUrl }} style={styles.activityImage} />
                ) : (
                  <View style={styles.placeholderActivityImage}>
                    <Search size={20} color="#CBD5E1" />
                  </View>
                )}
                <View style={styles.activityInfo}>
                  <View style={styles.activityHeader}>
                    <Text
                      style={styles.activityProduct}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {price.productName}
                    </Text>
                    <Text style={styles.activityPrice}>R${price.price.toFixed(2)}</Text>
                  </View>
                  <View style={styles.activityDetails}>
                    <Text style={styles.activitySupermarket}>{price.supermarket}</Text>
                    <Text style={styles.activityTime}>
                      {new Date(price.timestamp).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyActivityCard}>
            <Text style={styles.emptyActivityText}>
              {t('no_products_found')}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#E0E7FF',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: -10,
    borderRadius: 12,
    flexDirection: 'row',
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  recentActivity: {
    paddingHorizontal: 20,
    marginTop: 30,
    marginBottom: 40,
  },
  activityCard: {
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
  activityContent: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  activityImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  placeholderActivityImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityInfo: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  activityProduct: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  activityPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  activityDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  activitySupermarket: {
    fontSize: 14,
    color: '#6B7280',
  },
  activityTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  emptyActivityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyActivityText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});