import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSupermarketSession } from '@/context/SupermarketContext';
import { SupermarketSelector } from './SupermarketSelector';

export const SupermarketSessionModal: React.FC = () => {
    const { selectedSupermarket, setSelectedSupermarket, isLoading } = useSupermarketSession();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!isLoading && !selectedSupermarket) {
            setVisible(true);
        } else {
            setVisible(false);
        }
    }, [isLoading, selectedSupermarket]);

    const handleSelect = (name: string) => {
        setSelectedSupermarket(name);
        setVisible(false);
    };

    if (isLoading) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={() => { }} // Prevent closing without selection
        >
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <Text style={styles.title}>Where are you shopping?</Text>
                    <Text style={styles.description}>
                        Select a supermarket to start registering prices. This will be set for your current session.
                    </Text>

                    <View style={styles.selectorContainer}>
                        <SupermarketSelector
                            selectedSupermarket={selectedSupermarket || ''}
                            onSelect={handleSelect}
                        />
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 12,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 24,
    },
    selectorContainer: {
        width: '100%',
    },
});
