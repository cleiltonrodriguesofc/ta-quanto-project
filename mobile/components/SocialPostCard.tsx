import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Heart, MessageCircle, Share2, MoreHorizontal, TrendingDown } from 'lucide-react-native';
import { SocialPost } from '@/types/social';
import { formatTimeAgo } from '@/utils/date';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

interface SocialPostCardProps {
    post: SocialPost;
}

export default function SocialPostCard({ post }: SocialPostCardProps) {
    const router = useRouter();
    const { t } = useTranslation();

    const renderContent = () => {
        switch (post.type) {
            case 'photo':
                return (
                    <TouchableOpacity
                        onPress={() => {
                            console.log('Navigating to product:', post.content.barcode);
                            if (post.content.barcode) {
                                router.push({
                                    pathname: '/product/[barcode]',
                                    params: { barcode: post.content.barcode }
                                });
                            } else {
                                console.log('No barcode found for post:', post.id);
                            }
                        }}
                        activeOpacity={0.7}
                    >
                        <View>
                            {post.content.text && (
                                <Text style={styles.caption}>{post.content.text}</Text>
                            )}
                            {post.content.imageUrl && (
                                <Image source={{ uri: post.content.imageUrl }} style={styles.postImage} />
                            )}
                        </View>
                    </TouchableOpacity>
                );
            case 'price':
                return (
                    <TouchableOpacity
                        onPress={() => {
                            console.log('Navigating to product:', post.content.barcode);
                            if (post.content.barcode) {
                                router.push({
                                    pathname: '/product/[barcode]',
                                    params: { barcode: post.content.barcode }
                                });
                            } else {
                                console.log('No barcode found for post:', post.id);
                            }
                        }}
                        activeOpacity={0.7}
                    >
                        <View style={styles.priceContent}>
                            <View style={styles.priceInfo}>
                                <Text style={styles.productName}>{post.content.productName}</Text>
                                <Text style={styles.supermarket}>{post.content.supermarket}</Text>
                            </View>
                            <View style={styles.priceTag}>
                                <Text style={styles.currency}>R$</Text>
                                <Text style={styles.priceValue}>{post.content.price?.toFixed(2)}</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                );
            case 'promotion':
                return (
                    <TouchableOpacity
                        onPress={() => {
                            console.log('Navigating to product:', post.content.barcode);
                            if (post.content.barcode) {
                                router.push({
                                    pathname: '/product/[barcode]',
                                    params: { barcode: post.content.barcode }
                                });
                            } else {
                                console.log('No barcode found for post:', post.id);
                            }
                        }}
                        activeOpacity={0.7}
                    >
                        <View>
                            {post.content.text && (
                                <Text style={styles.caption}>{post.content.text}</Text>
                            )}
                            {post.content.imageUrl && (
                                <Image source={{ uri: post.content.imageUrl }} style={styles.postImage} />
                            )}
                            <View style={styles.promotionOverlay}>
                                <View style={styles.promotionBadge}>
                                    <TrendingDown size={16} color="#FFFFFF" />
                                    <Text style={styles.promotionText}>{t('offer')}</Text>
                                </View>
                                <View style={styles.priceContainer}>
                                    {post.content.oldPrice && (
                                        <Text style={styles.oldPrice}>R${post.content.oldPrice.toFixed(2)}</Text>
                                    )}
                                    <Text style={styles.newPrice}>R${post.content.price?.toFixed(2)}</Text>
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                );
            case 'text':
                return (
                    <Text style={styles.textPost}>{post.content.text}</Text>
                );
            default:
                return null;
        }
    };

    return (
        <View style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.userInfo}>
                    <Image source={{ uri: post.user.avatar }} style={styles.avatar} />
                    <View>
                        <Text style={styles.userName}>{post.user.name}</Text>
                        <Text style={styles.timestamp}>{formatTimeAgo(new Date(post.timestamp))}</Text>
                    </View>
                </View>
                <TouchableOpacity>
                    <MoreHorizontal size={20} color="#6B7280" />
                </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.content}>
                {renderContent()}
            </View>

            {/* Actions */}
            <View style={styles.actions}>
                <View style={styles.leftActions}>
                    <TouchableOpacity style={styles.actionButton}>
                        <Heart size={24} color={post.isLiked ? "#EF4444" : "#1F2937"} fill={post.isLiked ? "#EF4444" : "none"} />
                        <Text style={styles.actionText}>{post.likes}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                        <MessageCircle size={24} color="#1F2937" />
                        <Text style={styles.actionText}>{post.comments}</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity>
                    <Share2 size={24} color="#1F2937" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        marginBottom: 12,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#F3F4F6',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E5E7EB',
    },
    userName: {
        fontWeight: '600',
        fontSize: 14,
        color: '#1F2937',
    },
    timestamp: {
        fontSize: 12,
        color: '#6B7280',
    },
    content: {
        paddingHorizontal: 12,
        paddingBottom: 12,
    },
    caption: {
        fontSize: 14,
        color: '#1F2937',
        marginBottom: 8,
        lineHeight: 20,
    },
    postImage: {
        width: '100%',
        height: 300,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
    },
    textPost: {
        fontSize: 16,
        color: '#1F2937',
        lineHeight: 24,
        paddingVertical: 8,
    },
    priceContent: {
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    priceInfo: {
        flex: 1,
    },
    productName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4,
    },
    supermarket: {
        fontSize: 14,
        color: '#6B7280',
    },
    priceTag: {
        alignItems: 'flex-end',
    },
    currency: {
        fontSize: 12,
        color: '#3A7DE8',
        fontWeight: '600',
    },
    priceValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#3A7DE8',
    },
    promotionOverlay: {
        marginTop: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        padding: 12,
        borderRadius: 8,
    },
    promotionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EF4444',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        gap: 4,
    },
    promotionText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    priceContainer: {
        alignItems: 'flex-end',
    },
    oldPrice: {
        fontSize: 12,
        color: '#9CA3AF',
        textDecorationLine: 'line-through',
    },
    newPrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#EF4444',
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    leftActions: {
        flexDirection: 'row',
        gap: 20,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    actionText: {
        fontSize: 14,
        color: '#4B5563',
        fontWeight: '500',
    },
});
