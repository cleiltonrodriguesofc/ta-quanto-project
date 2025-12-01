import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Supermarket } from '@/types/supermarket';
import { SupermarketService } from '@/services/supermarketService';

export const useSupermarkets = () => {
    const [supermarkets, setSupermarkets] = useState<Supermarket[]>([]);
    const [nearestSupermarket, setNearestSupermarket] = useState<Supermarket | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [locationPermission, setLocationPermission] = useState<boolean | null>(null);

    useEffect(() => {
        loadSupermarkets();
    }, []);

    const loadSupermarkets = async () => {
        setIsLoading(true);
        try {
            // Load from API
            const allSupermarkets = await SupermarketService.getAll();
            setSupermarkets(allSupermarkets);

            // Try to get location for nearest suggestion
            const { status } = await Location.requestForegroundPermissionsAsync();
            setLocationPermission(status === 'granted');

            if (status === 'granted') {
                const location = await Location.getCurrentPositionAsync({});
                const nearest = SupermarketService.getNearest(
                    location.coords.latitude,
                    location.coords.longitude,
                    allSupermarkets
                );
                setNearestSupermarket(nearest);
            }
        } catch (error) {
            console.error('Error loading supermarkets or location:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const addSupermarket = async (name: string) => {
        try {
            const newSupermarket = await SupermarketService.add(name);
            setSupermarkets(prev => [...prev, newSupermarket]);
            return newSupermarket;
        } catch (error) {
            console.error('Error adding supermarket:', error);
            throw error;
        }
    };

    return {
        supermarkets,
        nearestSupermarket,
        isLoading,
        locationPermission,
        refresh: loadSupermarkets,
        addSupermarket,
    };
};
