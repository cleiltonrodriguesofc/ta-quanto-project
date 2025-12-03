import { Supermarket } from '@/types/supermarket';
import { supabase } from '@/utils/supabase';

// Haversine formula to calculate distance between two points
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
    getNearest: (latitude: number, longitude: number, supermarkets: Supermarket[]): Supermarket | null => {
        let nearest: Supermarket | null = null;
        let minDistance = Infinity;

        supermarkets.forEach((supermarket) => {
            if (supermarket.latitude && supermarket.longitude) {
                const distance = calculateDistance(latitude, longitude, supermarket.latitude, supermarket.longitude);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearest = supermarket;
                }
            }
        });

        return nearest;
    },
};
