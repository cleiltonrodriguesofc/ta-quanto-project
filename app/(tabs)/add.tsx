import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Camera, CreditCard as Edit3 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

export default function AddScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const handleScanProduct = () => {
    router.push('/scan');
  };

  const handleManualEntry = () => {
    router.push('/register');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('add_price')}</Text>
        <Text style={styles.subtitle}>{t('share_price_subtitle')}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>{t('choose_add_method')}</Text>

        <TouchableOpacity
          style={styles.optionCard}
          onPress={handleScanProduct}
          activeOpacity={0.7}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#3A7DE8' + '20' }]}>
            <Camera size={32} color="#3A7DE8" />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>{t('scan_product')}</Text>
            <Text style={styles.optionDescription}>
              {t('scan_product_desc')}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionCard}
          onPress={handleManualEntry}
          activeOpacity={0.7}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#10B981' + '20' }]}>
            <Edit3 size={32} color="#10B981" />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>{t('manual_entry')}</Text>
            <Text style={styles.optionDescription}>
              {t('manual_entry_desc')}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>💡 {t('pro_tip')}</Text>
          <Text style={styles.tipText}>
            {t('pro_tip_desc')}
          </Text>
        </View>
      </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 24,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 6,
  },
  optionDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  tipCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400E',
    marginBottom: 6,
  },
  tipText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
});