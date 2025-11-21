import { Supermarket } from '@/types/supermarket';

const SUPERMARKETS: Supermarket[] = [
    { id: 1, name: 'Zumica Supermercado', type: 'Supermarket', address: 'Av. Davi Alves Silva, 495 – Centro' },
    { id: 2, name: 'Mateus Supermercados', type: 'Supermarket', address: 'Rua Divino Espírito Santo – Vila Mansueto' },
    { id: 3, name: 'Mundo Atacado (Mundô Supermercado)', type: 'Supermarket', address: 'Av. Davi Alves Silva, 820 – Colégio Agrícola' },
    { id: 4, name: 'Supermercado Bom Preço', type: 'Supermarket', address: 'Rua da Paz, 72 – Vila Davi' },
    { id: 5, name: 'Sacolão Econômico', type: 'Fruit Store/Sacolão', address: 'BR-222 (rodovia) – Buriticupu' },
    { id: 6, name: 'Atacadão das Frutas', type: 'Fruit Store/Sacolão', address: 'BR-222, km 554, s/n – Buritizinho area' },
    { id: 7, name: 'Mercado União', type: 'Small Market', address: 'Av. Davi Alves Silva, 599 – Centro' },
    { id: 8, name: 'Mercadinho Jb', type: 'Small Market', address: 'Rua 244 – Terra Bela' },
    { id: 9, name: 'Mercadinho Marques', type: 'Small Market', address: 'Av. 20 – Eco II' },
    { id: 10, name: 'Mercadinho Menor Preço', type: 'Small Market', address: 'Rua 220 – Terra Bela' },
    { id: 11, name: 'Mercadinho Mix Davi', type: 'Small Market', address: 'Rua 08 – Letra A – Vila Primo' },
    { id: 12, name: 'Mercadinho Rodrigues', type: 'Small Market', address: 'Rua 21 – Armz – Terra Bela' },
    { id: 13, name: 'Mercantil J. Rezende', type: 'Small Market', address: 'Zona Rural – Buriticupu' },
    { id: 14, name: 'Mercantil Mateuzin', type: 'Small Market', address: 'Av. 343 – Centro' },
    { id: 15, name: 'Mercantil Oliveira', type: 'Small Market', address: 'Rua 537 – Armz – Centro' },
    { id: 16, name: 'Mercearia Moraes', type: 'Small Market', address: 'Rua 14 – Vila Cajueiro' },
    { id: 17, name: 'Supermercado Wonanth', type: 'Supermarket', address: 'Rua Cafeteira, 115 – Buriticupu' },
    { id: 18, name: 'Depósito Vale Buriti', type: 'Supermarket', address: 'Av. Davi Alves Silva – Buriticupu' },
    { id: 19, name: 'Solange M. C. Brito Supermercados', type: 'Supermarket', address: 'Rua Dom Pedro I – Centro' },
    { id: 20, name: 'Comercial Johnattan', type: 'Supermarket', address: 'Av. Castelo Branco – Buriticupu' },
];

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
    getAll: (): Supermarket[] => {
        return SUPERMARKETS;
    },

    getNearest: (latitude: number, longitude: number): Supermarket | null => {
        let nearest: Supermarket | null = null;
        let minDistance = Infinity;

        SUPERMARKETS.forEach((supermarket) => {
            if (supermarket.latitude && supermarket.longitude) {
                const distance = calculateDistance(latitude, longitude, supermarket.latitude, supermarket.longitude);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearest = supermarket;
                }
            }
        });

        // If no supermarkets have coordinates, or none are close enough (optional threshold), return null
        return nearest;
    },
};
