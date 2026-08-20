import { SocialPost } from '@/types/social';

export const MOCK_POSTS: SocialPost[] = [
    {
        id: '1',
        type: 'photo',
        user: {
            id: 'u1',
            name: 'Maria Silva',
            avatar: 'https://i.pravatar.cc/150?u=u1',
        },
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
        content: {
            text: 'Found this amazing deal on coffee today! ☕️',
            imageUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=1000&auto=format&fit=crop',
            productName: 'Premium Coffee',
            supermarket: 'SuperMarket Plus',
            barcode: '7891000053508'
        },
        likes: 24,
        comments: 5,
        isLiked: true,
    },
    {
        id: '2',
        type: 'price',
        user: {
            id: 'u2',
            name: 'João Santos',
            avatar: 'https://i.pravatar.cc/150?u=u2',
        },
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        content: {
            productName: 'Milk 1L',
            price: 4.50,
            supermarket: 'City Market',
            barcode: '7896005800009'
        },
        likes: 12,
        comments: 0,
    },
    {
        id: '3',
        type: 'promotion',
        user: {
            id: 'u3',
            name: 'Super Ofertas',
            avatar: 'https://i.pravatar.cc/150?u=u3',
        },
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
        content: {
            text: 'Weekend Special! 50% off on all fresh vegetables. 🥦🥕',
            imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1000&auto=format&fit=crop',
            productName: 'Fresh Vegetables',
            supermarket: 'Green Grocer',
            price: 2.99,
            oldPrice: 5.99,
            barcode: '7891000248703'
        },
        likes: 156,
        comments: 32,
    },
    {
        id: '4',
        type: 'text',
        user: {
            id: 'u4',
            name: 'Ana Oliveira',
            avatar: 'https://i.pravatar.cc/150?u=u4',
        },
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        content: {
            text: 'Does anyone know if the new bakery downtown has gluten-free bread?',
        },
        likes: 8,
        comments: 15,
    },
];
