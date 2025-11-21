import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    FlatList,
    ActivityIndicator,
} from 'react-native';
import { MapPin, X, Check, Store } from 'lucide-react-native';
import { Supermarket } from '@/types/supermarket';
import { useSupermarkets } from '@/hooks/useSupermarkets';

interface SupermarketSelectorProps {
    selectedSupermarket: string;
    onSelect: (name: string) => void;
}

export const SupermarketSelector: React.FC<SupermarketSelectorProps> = ({
    selectedSupermarket,
    onSelect,
}) => {
    const [modalVisible, setModalVisible] = useState(false);
    const { supermarkets, nearestSupermarket, isLoading } = useSupermarkets();

    const handleSelect = (name: string) => {
        onSelect(name);
        setModalVisible(false);
    };

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
                            {item.type} • {item.address}
                        </Text>
                    </View>
                    {isNearest && (
                        <View style={styles.badge}>
                            <MapPin size={12} color="#FFFFFF" />
                            <Text style={styles.badgeText}>Near You</Text>
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
                        {selectedSupermarket || 'Select Supermarket'}
                    </Text>
                </View>
                {nearestSupermarket && !selectedSupermarket && (
                    <View style={styles.suggestionBadge}>
                        <Text style={styles.suggestionText}>Suggested</Text>
                    </View>
                )}
            </TouchableOpacity>

            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Supermarket</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <X size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        {isLoading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#3A7DE8" />
                            </View>
                        ) : (
                            <FlatList
                                data={supermarkets}
                                renderItem={renderItem}
                                keyExtractor={(item) => item.id.toString()}
                                contentContainerStyle={styles.listContent}
                                showsVerticalScrollIndicator={false}
                            />
                        )}
                    </View>
                </View>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 20,
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
});
