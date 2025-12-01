import { Supermarket } from '@/types/supermarket';
import { API_URL } from '@/utils/api';

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
};

const deg2rad = (deg: number): number => {
    return deg * (Math.PI / 180);
};

export const SupermarketService = {
    getAll: async (): Promise<Supermarket[]> => {
        try {
            const response = await fetch(`${API_URL}/supermarkets`, {
                headers: { 'Bypass-Tunnel-Reminder': 'true' }
            });

            const text = await response.text();
            if (!response.ok) {
                throw new Error(`Failed to fetch supermarkets: ${response.status} ${text}`);
            }

            try {
                return JSON.parse(text);
            } catch (e) {
                console.error('Invalid JSON response from server (supermarkets):', text.substring(0, 100));
                return [];
            }
        } catch (error) {
            console.error('Error fetching supermarkets:', error);
            return [];
        }
    },

    add: async (name: string): Promise<Supermarket> => {
        const response = await fetch(`${API_URL}/supermarkets`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Bypass-Tunnel-Reminder': 'true'
            },
            body: JSON.stringify({ name }),
        });

        const text = await response.text();
        if (!response.ok) {
            try {
                const errorData = JSON.parse(text);
                throw new Error(errorData.error || 'Failed to add supermarket');
            } catch (e) {
                throw new Error(`Failed to add supermarket: ${response.status} ${text}`);
            }
        }

        try {
            return JSON.parse(text);
        } catch (e) {
            throw new Error(`Invalid JSON response from server: ${text.substring(0, 100)}`);
        }
    },

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
