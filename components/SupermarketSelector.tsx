import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    FlatList,
    ActivityIndicator,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { MapPin, X, Check, Store, Plus, Search } from 'lucide-react-native';
import { Supermarket } from '@/types/supermarket';
import { useSupermarkets } from '@/hooks/useSupermarkets';
import { useTranslation } from 'react-i18next';

interface SupermarketSelectorProps {
    selectedSupermarket: string;
    onSelect: (name: string) => void;
}

export const SupermarketSelector: React.FC<SupermarketSelectorProps> = ({
    selectedSupermarket,
    onSelect,
}) => {
    const { t } = useTranslation();
    const [modalVisible, setModalVisible] = useState(false);
    const [searchText, setSearchText] = useState('');
    const { supermarkets, nearestSupermarket, isLoading, addSupermarket } = useSupermarkets();

    const handleSelect = (name: string) => {
        onSelect(name);
        setModalVisible(false);
        setSearchText('');
    };

    const handleAddSupermarket = async () => {
        if (!searchText.trim()) return;
        try {
            const newSupermarket = await addSupermarket(searchText.trim());
            handleSelect(newSupermarket.name);
        } catch (error: any) {
            Alert.alert(t('error'), error.message || t('add_supermarket_error'));
        }
    };

    const filteredSupermarkets = supermarkets.filter(s =>
        s.name.toLowerCase().includes(searchText.toLowerCase())
    );

    const renderItem = ({ item }: { item: Supermarket }) => {
        const isSelected = item.name === selectedSupermarket;
        const isNearest = nearestSupermarket?.id === item.id;

        return (
            <TouchableOpacity
                style={[
                    styles.item,
                    isSelected && styles.itemSelected,
                    isNearest && styles.itemNearest,
                ]}
                onPress={() => handleSelect(item.name)}
            >
                <View style={styles.itemContent}>
                    <View style={styles.itemInfo}>
                        <Text style={[styles.itemName, isSelected && styles.itemNameSelected]}>
                            {item.name}
                        </Text>
                        <Text style={styles.itemDetails}>
                            {item.type} • {item.address || 'No address'}
                        </Text>
                    </View>
                    {isNearest && (
                        <View style={styles.badge}>
                            <MapPin size={12} color="#FFFFFF" />
                            <Text style={styles.badgeText}>{t('near_you')}</Text>
                        </View>
                    )}
                    {isSelected && !isNearest && <Check size={20} color="#3A7DE8" />}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <>
            <TouchableOpacity
                style={styles.selectorButton}
                onPress={() => setModalVisible(true)}
            >
                <View style={styles.selectorContent}>
                    <Store size={20} color="#6B7280" />
                    <Text
                        style={[
                            styles.selectorText,
                            selectedSupermarket ? styles.selectorTextSelected : styles.selectorTextPlaceholder,
                        ]}
                    >
                        {selectedSupermarket || t('select_supermarket')}
                    </Text>
                </View>
                {nearestSupermarket && !selectedSupermarket && (
                    <View style={styles.suggestionBadge}>
                        <Text style={styles.suggestionText}>{t('suggested')}</Text>
                    </View>
                )}
            </TouchableOpacity>

            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalContainer}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t('select_supermarket')}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <X size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.searchContainer}>
                            <Search size={20} color="#9CA3AF" style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder={t('search_or_add')}
                                value={searchText}
                                onChangeText={setSearchText}
                                autoCapitalize="words"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        {isLoading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#3A7DE8" />
                            </View>
                        ) : (
                            <FlatList
                                data={filteredSupermarkets}
                                renderItem={renderItem}
                                keyExtractor={(item) => item.id.toString()}
                                contentContainerStyle={styles.listContent}
                                showsVerticalScrollIndicator={false}
                                ListFooterComponent={
                                    searchText && !filteredSupermarkets.some(s => s.name.toLowerCase() === searchText.trim().toLowerCase()) ? (
                                        <TouchableOpacity style={styles.addButton} onPress={handleAddSupermarket}>
                                            <Plus size={20} color="#FFFFFF" />
                                            <Text style={styles.addButtonText}>{t('add')} "{searchText}"</Text>
                                        </TouchableOpacity>
                                    ) : null
                                }
                                ListEmptyComponent={
                                    !searchText ? (
                                        <Text style={styles.emptyText}>{t('no_supermarkets_found')}</Text>
                                    ) : null
                                }
                            />
                        )}
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    selectorButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    selectorContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    selectorText: {
        fontSize: 16,
    },
    selectorTextPlaceholder: {
        color: '#9CA3AF',
    },
    selectorTextSelected: {
        color: '#1F2937',
    },
    suggestionBadge: {
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#10B981',
    },
    suggestionText: {
        fontSize: 12,
        color: '#10B981',
        fontWeight: '600',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '80%',
        paddingTop: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        margin: 20,
        marginBottom: 10,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 48,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#1F2937',
        height: '100%',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 20,
        paddingTop: 0,
    },
    item: {
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#F9FAFB',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    itemSelected: {
        backgroundColor: '#EFF6FF',
        borderColor: '#3A7DE8',
    },
    itemNearest: {
        borderColor: '#10B981',
        borderWidth: 2,
    },
    itemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 4,
    },
    itemNameSelected: {
        color: '#3A7DE8',
    },
    itemDetails: {
        fontSize: 12,
        color: '#6B7280',
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#10B981',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3A7DE8',
        padding: 16,
        borderRadius: 12,
        marginTop: 12,
        gap: 8,
    },
    addButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    emptyText: {
        textAlign: 'center',
        color: '#6B7280',
        marginTop: 20,
        fontSize: 16,
    },
});
