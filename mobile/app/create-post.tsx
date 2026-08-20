import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, Image as ImageIcon, Tag, Type, Camera } from 'lucide-react-native';
import { SocialPostType } from '@/types/social';
import { useTranslation } from 'react-i18next';

export default function CreatePostScreen() {
    const router = useRouter();
    const { t } = useTranslation();
    const [postType, setPostType] = useState<SocialPostType>('text');
    const [text, setText] = useState('');
    const [price, setPrice] = useState('');
    const [productName, setProductName] = useState('');

    const handlePost = () => {
        // Here we would normally save the post to a backend or local storage
        // For now, we'll just go back
        router.back();
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <X size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('create_post')}</Text>
                <TouchableOpacity onPress={handlePost} disabled={!text && !productName}>
                    <Text style={[styles.postButton, (!text && !productName) && styles.postButtonDisabled]}>
                        {t('post')}
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.typeSelector}>
                    <TouchableOpacity
                        style={[styles.typeButton, postType === 'text' && styles.typeButtonActive]}
                        onPress={() => setPostType('text')}
                    >
                        <Type size={20} color={postType === 'text' ? '#FFFFFF' : '#6B7280'} />
                        <Text style={[styles.typeText, postType === 'text' && styles.typeTextActive]}>{t('text')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.typeButton, postType === 'photo' && styles.typeButtonActive]}
                        onPress={() => setPostType('photo')}
                    >
                        <ImageIcon size={20} color={postType === 'photo' ? '#FFFFFF' : '#6B7280'} />
                        <Text style={[styles.typeText, postType === 'photo' && styles.typeTextActive]}>{t('photo')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.typeButton, postType === 'price' && styles.typeButtonActive]}
                        onPress={() => setPostType('price')}
                    >
                        <Tag size={20} color={postType === 'price' ? '#FFFFFF' : '#6B7280'} />
                        <Text style={[styles.typeText, postType === 'price' && styles.typeTextActive]}>{t('price')}</Text>
                    </TouchableOpacity>
                </View>

                <TextInput
                    style={styles.input}
                    placeholder={t('whats_on_your_mind')}
                    multiline
                    value={text}
                    onChangeText={setText}
                    textAlignVertical="top"
                />

                {postType === 'photo' && (
                    <TouchableOpacity style={styles.imagePlaceholder}>
                        <Camera size={40} color="#9CA3AF" />
                        <Text style={styles.imagePlaceholderText}>{t('add_photo')}</Text>
                    </TouchableOpacity>
                )}

                {postType === 'price' && (
                    <View style={styles.priceInputs}>
                        <TextInput
                            style={styles.priceInput}
                            placeholder={t('product_name')}
                            value={productName}
                            onChangeText={setProductName}
                        />
                        <TextInput
                            style={styles.priceInput}
                            placeholder={`${t('price')} (R$)`}
                            keyboardType="numeric"
                            value={price}
                            onChangeText={setPrice}
                        />
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    postButton: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#3A7DE8',
    },
    postButtonDisabled: {
        color: '#9CA3AF',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    typeSelector: {
        flexDirection: 'row',
        marginBottom: 20,
        gap: 10,
    },
    typeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        gap: 6,
    },
    typeButtonActive: {
        backgroundColor: '#3A7DE8',
    },
    typeText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    typeTextActive: {
        color: '#FFFFFF',
    },
    input: {
        fontSize: 18,
        minHeight: 100,
        color: '#1F2937',
        marginBottom: 20,
    },
    imagePlaceholder: {
        width: '100%',
        height: 200,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
    },
    imagePlaceholderText: {
        marginTop: 8,
        color: '#9CA3AF',
        fontSize: 16,
        fontWeight: '500',
    },
    priceInputs: {
        gap: 12,
    },
    priceInput: {
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 8,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
});
