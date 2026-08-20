export type SocialPostType = 'price' | 'photo' | 'promotion' | 'text';

export interface SocialUser {
    id: string;
    name: string;
    avatar?: string;
}

export interface SocialPost {
    id: string;
    type: SocialPostType;
    user: SocialUser;
    timestamp: string;
    content: {
        text?: string;
        imageUrl?: string;
        price?: number;
        productName?: string;
        supermarket?: string;
        oldPrice?: number; // For promotions
        barcode?: string;
    };
    likes: number;
    comments: number;
    isLiked?: boolean;
}
