import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type SupermarketContextType = {
    selectedSupermarket: string | null;
    setSelectedSupermarket: (name: string) => void;
    isLoading: boolean;
};

const SupermarketContext = createContext<SupermarketContextType | undefined>(undefined);

export const SupermarketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [selectedSupermarket, setSelectedSupermarketState] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadSupermarket();
    }, []);

    const loadSupermarket = async () => {
        try {
            const stored = await AsyncStorage.getItem('taquanto_selected_supermarket');
            if (stored) {
                setSelectedSupermarketState(stored);
            }
        } catch (error) {
            console.error('Failed to load supermarket session:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const setSelectedSupermarket = async (name: string) => {
        try {
            setSelectedSupermarketState(name);
            await AsyncStorage.setItem('taquanto_selected_supermarket', name);
        } catch (error) {
            console.error('Failed to save supermarket session:', error);
        }
    };

    return (
        <SupermarketContext.Provider value={{ selectedSupermarket, setSelectedSupermarket, isLoading }}>
            {children}
        </SupermarketContext.Provider>
    );
};

export const useSupermarketSession = () => {
    const context = useContext(SupermarketContext);
    if (context === undefined) {
        throw new Error('useSupermarketSession must be used within a SupermarketProvider');
    }
    return context;
};
