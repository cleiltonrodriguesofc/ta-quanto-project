import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { manageBasketUseCase } from '@/src/application';
import { BasketItem } from '@/src/domain/entities';

export { BasketItem };

type SupermarketContextType = {
  selectedSupermarket: string | null;
  setSelectedSupermarket: (name: string) => void;
  isShopMode: boolean;
  setShopMode: (active: boolean) => void;
  basket: BasketItem[];
  addToBasket: (item: Omit<BasketItem, 'id'>) => void;
  removeFromBasket: (id: string) => void;
  updateBasketQuantity: (id: string, delta: number) => void;
  setBasketQuantity: (id: string, quantity: number) => void;
  clearBasket: () => void;
  replaceBasket: (items: BasketItem[]) => void;
  basketTotal: number;
  isLoading: boolean;
};

const SupermarketContext = createContext<SupermarketContextType | undefined>(undefined);

const STORAGE_KEY_SUPERMARKET = 'taquanto_selected_supermarket';
const STORAGE_KEY_SHOP_MODE = 'taquanto_shop_mode_active';

export const SupermarketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedSupermarket, setSelectedSupermarketState] = useState<string | null>(null);
  const [isShopMode, setIsShopMode] = useState(false);
  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { session } = useAuth();

  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    try {
      const [storedSupermarket, storedShopMode] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY_SUPERMARKET),
        AsyncStorage.getItem(STORAGE_KEY_SHOP_MODE),
      ]);

      if (storedSupermarket) setSelectedSupermarketState(storedSupermarket);
      if (storedShopMode) setIsShopMode(storedShopMode === 'true');

      const items = await manageBasketUseCase.getItems(session?.userId);
      setBasket(items);
    } catch (error) {
      console.error('Failed to load session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.userId) {
      manageBasketUseCase.getItems(session.userId).then(items => {
        if (items.length > 0) setBasket(items);
      });
    }
  }, [session?.userId]);

  const setSelectedSupermarket = async (name: string) => {
    try {
      setSelectedSupermarketState(name);
      await AsyncStorage.setItem(STORAGE_KEY_SUPERMARKET, name);
    } catch (error) {
      console.error('Failed to save supermarket:', error);
    }
  };

  const setShopMode = async (active: boolean) => {
    try {
      setIsShopMode(active);
      await AsyncStorage.setItem(STORAGE_KEY_SHOP_MODE, String(active));
    } catch (error) {
      console.error('Failed to save shop mode:', error);
    }
  };

  const addToBasket = async (item: Omit<BasketItem, 'id'>) => {
    const newItem = await manageBasketUseCase.addItem(session?.userId, item);
    setBasket(prev => [...prev, newItem]);
  };

  const removeFromBasket = async (id: string) => {
    await manageBasketUseCase.removeItem(session?.userId, id);
    setBasket(prev => prev.filter(item => item.id !== id));
  };

  const updateBasketQuantity = async (id: string, delta: number) => {
    const existing = basket.find(i => i.id === id);
    if (!existing) return;

    const updated = await manageBasketUseCase.updateQuantity(session?.userId, existing, existing.quantity + delta);
    setBasket(prev => prev.map(item => (item.id === id ? updated : item)));
  };

  const setBasketQuantity = async (id: string, quantity: number) => {
    const existing = basket.find(i => i.id === id);
    if (!existing) return;

    const updated = await manageBasketUseCase.updateQuantity(session?.userId, existing, quantity);
    setBasket(prev => prev.map(item => (item.id === id ? updated : item)));
  };

  const replaceBasket = async (items: BasketItem[]) => {
    setBasket(items);
  };

  const clearBasket = async () => {
    await manageBasketUseCase.clear(session?.userId);
    setBasket([]);
  };

  const basketTotal = useMemo(() => {
    return basket.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [basket]);

  return (
    <SupermarketContext.Provider
      value={{
        selectedSupermarket,
        setSelectedSupermarket,
        isShopMode,
        setShopMode,
        basket,
        addToBasket,
        removeFromBasket,
        updateBasketQuantity,
        setBasketQuantity,
        clearBasket,
        replaceBasket,
        basketTotal,
        isLoading,
      }}>
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
