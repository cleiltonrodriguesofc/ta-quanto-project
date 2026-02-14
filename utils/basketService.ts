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
    // Prepare items for RPC (JSONB array)
    const rpcItems = items.map(item => ({
        barcode: item.barcode,
        productName: item.productName,
        price: item.price,
        quantity: item.quantity,
        imageUrl: item.imageUrl
    }));

    const { data, error } = await supabase
        .rpc('create_basket', {
            p_name: name,
            p_supermarket: supermarket,
            p_total_amount: totalAmount,
            p_item_count: items.length,
            p_items: rpcItems
        });

    if (error) {
        console.error('[BasketService] RPC Error creating basket:', error);
        throw error;
    }

    if (data && !data.success) {
        throw new Error(data.error || 'Failed to create basket via RPC');
    }

    // Return object compatible with UI expectations (needs at least id)
    return { id: data.id, name, supermarket, total_amount: totalAmount, item_count: items.length };
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
    // Prepare items for RPC (JSONB array)
    const rpcItems = items.map(item => ({
        barcode: item.barcode,
        productName: item.productName,
        price: item.price,
        quantity: item.quantity,
        imageUrl: item.imageUrl
    }));

    const { data, error } = await supabase
        .rpc('update_basket_details', {
            p_basket_id: basketId,
            p_total_amount: totalAmount,
            p_item_count: items.length,
            p_items: rpcItems
        });

    if (error) {
        console.error('[BasketService] RPC Error updating basket:', error);
        throw error;
    }

    if (data && !data.success) {
        throw new Error(data.error || 'Failed to update basket via RPC');
    }
};

export const deleteSavedBasket = async (userId: string, basketId: string) => {
    console.log('[BasketService] Attempting to delete basket via RPC:', basketId);

    const { data, error } = await supabase
        .rpc('delete_basket', { basket_id: basketId });

    if (error) {
        console.error('[BasketService] RPC Error deleting basket:', error);
        throw error;
    }

    console.log('[BasketService] RPC result:', data);

    if (data && !data.success) {
        console.warn('[BasketService] Deletion failed on server:', data.error);
        // Fallback debug: Check existence
        const { data: debugBasket } = await supabase
            .from('saved_baskets')
            .select('*')
            .eq('id', basketId)
            .single();

        if (debugBasket) {
            console.warn('[BasketService] Basket exists. Owner check:',
                { owner: debugBasket.user_id, sessionUser: userId, ownerType: typeof debugBasket.user_id, userType: typeof userId }
            );
        }
    }
};

export const renameSavedBasket = async (userId: string, basketId: string, newName: string) => {
    const { error } = await supabase
        .from('saved_baskets')
        .update({ name: newName })
        .eq('id', basketId)
        .eq('user_id', userId);

    if (error) throw error;
};
