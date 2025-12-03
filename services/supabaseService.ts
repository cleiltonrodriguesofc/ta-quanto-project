import { supabase } from '@/utils/supabase';
import { PriceEntry } from '@/types/price';
import { UserProfile } from '@/types/user';
import { Supermarket } from '@/types/supermarket';

export const SupabaseService = {
    // --- Prices ---
    getPrices: async (barcode?: string): Promise<PriceEntry[]> => {
        let query = supabase
            .from('prices')
            .select('*')
            .order('timestamp', { ascending: false });

        if (barcode) {
            query = query.eq('barcode', barcode);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching prices from Supabase:', error);
            throw error;
        }

        return data || [];
    },

    addPrice: async (price: PriceEntry): Promise<void> => {
        const { error } = await supabase
            .from('prices')
            .insert([price]);

        if (error) {
            console.error('Error adding price to Supabase:', error);
            throw error;
        }
    },

    // --- Users ---
    getUser: async (id: string): Promise<UserProfile | null> => {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null; // Not found
            console.error('Error fetching user from Supabase:', error);
            throw error;
        }

        return data;
    },

    saveUser: async (user: UserProfile): Promise<void> => {
        const { error } = await supabase
            .from('users')
            .upsert([user]);

        if (error) {
            console.error('Error saving user to Supabase:', error);
            throw error;
        }
    },

    // --- Supermarkets ---
    getAllSupermarkets: async (): Promise<Supermarket[]> => {
        const { data, error } = await supabase
            .from('supermarkets')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            console.error('Error fetching supermarkets from Supabase:', error);
            return [];
        }

        return data || [];
    },

    addSupermarket: async (supermarket: Partial<Supermarket>): Promise<Supermarket> => {
        const { data, error } = await supabase
            .from('supermarkets')
            .insert([supermarket])
            .select()
            .single();

        if (error) {
            console.error('Error adding supermarket to Supabase:', error);
            throw error;
        }

        return data;
    }
};
