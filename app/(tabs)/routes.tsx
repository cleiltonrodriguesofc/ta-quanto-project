import React from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { MapPin, Clock, Star } from 'lucide-react-native';

export default function RoutesScreen() {
  const handleComingSoon = () => {
    Alert.alert(
      'Coming Soon!',
      'Route planning and optimization features will be available in the next version of TaQuanto?',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Routes</Text>
        <Text style={styles.subtitle}>Plan your shopping efficiently</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.comingSoonCard}>
          <MapPin size={64} color="#3A7DE8" />
          <Text style={styles.comingSoonTitle}>Route Planning Coming Soon!</Text>
          <Text style={styles.comingSoonDescription}>
            We're working on an amazing feature that will help you plan the most efficient shopping routes based on the best prices in your area.
          </Text>
          
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Star size={20} color="#F59E0B" />
              <Text style={styles.featureText}>Optimize routes by price and location</Text>
            </View>
            <View style={styles.featureItem}>
              <Clock size={20} color="#10B981" />
              <Text style={styles.featureText}>Save time with smart planning</Text>
            </View>
            <View style={styles.featureItem}>
              <MapPin size={20} color="#8B5CF6" />
              <Text style={styles.featureText}>Find the best deals nearby</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.notifyButton} onPress={handleComingSoon}>
            <Text style={styles.notifyButtonText}>Get Notified</Text>
          </TouchableOpacity>
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
    paddingTop: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comingSoonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    width: '100%',
    maxWidth: 350,
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  comingSoonDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  featureList: {
    gap: 16,
    marginBottom: 32,
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#4B5563',
    flex: 1,
  },
  notifyButton: {
    backgroundColor: '#3A7DE8',
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  notifyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});