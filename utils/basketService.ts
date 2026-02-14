import { supabase } from './supabase';
import { BasketItem } from '@/context/SupermarketContext';

export const getUserBasket = async (userId: string): Promise<BasketItem[]> => {
    const { data, error } = await supabase
        .from('basket_items')
        .select('*')
        .eq('user_id', userId);
    if (error) throw error;
    return data as BasketItem[];
};

export const syncBasketItem = async (userId: string, item: BasketItem) => {
    const { error } = await supabase
        .from('basket_items')
        .upsert({
            id: item.id,
            user_id: userId,
            barcode: item.barcode,
            productName: item.productName,
            price: item.price,
            quantity: item.quantity,
            supermarket: item.supermarket,
            imageUrl: item.imageUrl,
            timestamp: item.timestamp
        });
    if (error) throw error;
};

export const deleteBasketItem = async (userId: string, itemId: string) => {
    const { error } = await supabase
        .from('basket_items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', userId);
    if (error) throw error;
};

export const clearUserBasket = async (userId: string) => {
    const { error } = await supabase
        .from('basket_items')
        .delete()
        .eq('user_id', userId);
    if (error) throw error;
};

export const saveNamedBasket = async (
    userId: string,
    name: string,
    items: BasketItem[],
    supermarket: string,
    totalAmount: number
) => {
    // 1. Create the basket record
    const { data: basket, error: basketError } = await supabase
        .from('saved_baskets')
        .insert({
            user_id: userId,
            name,
            supermarket,
            total_amount: totalAmount,
            item_count: items.length
        })
        .select()
        .single();

    if (basketError) throw basketError;

    // 2. Create the items records
    const basketItems = items.map(item => ({
        basket_id: basket.id,
        barcode: item.barcode,
        productName: item.productName,
        price: item.price,
        quantity: item.quantity,
        imageUrl: item.imageUrl
    }));

    const { error: itemsError } = await supabase
        .from('saved_basket_items')
        .insert(basketItems);

    if (itemsError) throw itemsError;

    return basket;
};

export const getSavedBaskets = async (userId: string) => {
    const { data, error } = await supabase
        .from('saved_baskets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

export const getSavedBasketItems = async (basketId: string) => {
    const { data, error } = await supabase
        .from('saved_basket_items')
        .select('*')
        .eq('basket_id', basketId);

    if (error) throw error;
    return data;
};

export const updateSavedBasket = async (
    userId: string,
    basketId: string,
    items: BasketItem[],
    totalAmount: number
) => {
    // 1. Update basket totals
    const { error: basketError } = await supabase
        .from('saved_baskets')
        .update({
            total_amount: totalAmount,
            item_count: items.length
        })
        .eq('id', basketId)
        .eq('user_id', userId);

    if (basketError) throw basketError;

    // 2. Delete existing items
    const { error: deleteError } = await supabase
        .from('saved_basket_items')
        .delete()
        .eq('basket_id', basketId);

    if (deleteError) throw deleteError;

    // 3. Insert new items
    const basketItems = items.map(item => ({
        basket_id: basketId,
        barcode: item.barcode,
        productName: item.productName,
        price: item.price,
        quantity: item.quantity,
        imageUrl: item.imageUrl
    }));

    const { error: insertError } = await supabase
        .from('saved_basket_items')
        .insert(basketItems);

    if (insertError) throw insertError;
};

export const deleteSavedBasket = async (userId: string, basketId: string) => {
    // 1. Delete items first to be safe
    const { error: itemsError } = await supabase
        .from('saved_basket_items')
        .delete()
        .eq('basket_id', basketId);

    if (itemsError) throw itemsError;

    // 2. Delete basket
    const { error: basketError } = await supabase
        .from('saved_baskets')
        .delete()
        .eq('id', basketId)
        .eq('user_id', userId);

    if (basketError) throw basketError;
};

export const renameSavedBasket = async (userId: string, basketId: string, newName: string) => {
    const { error } = await supabase
        .from('saved_baskets')
        .update({ name: newName })
        .eq('id', basketId)
        .eq('user_id', userId);

    if (error) throw error;
};
