import { supabase } from '@/utils/supabase';
import { SupabasePriceRepository } from './SupabasePriceRepository';
import { SupabaseProductRepository } from './SupabaseProductRepository';
import { SupabaseUserRepository } from './SupabaseUserRepository';
import { SupabaseSupermarketRepository } from './SupabaseSupermarketRepository';
import { SupabaseBasketRepository } from './SupabaseBasketRepository';
import { SupabaseSavedBasketRepository } from './SupabaseSavedBasketRepository';
import { SupabaseAuthService } from './SupabaseAuthService';

export const supabasePriceRepository = new SupabasePriceRepository(supabase);
export const supabaseProductRepository = new SupabaseProductRepository(supabase);
export const supabaseUserRepository = new SupabaseUserRepository(supabase);
export const supabaseSupermarketRepository = new SupabaseSupermarketRepository(supabase);
export const supabaseBasketRepository = new SupabaseBasketRepository(supabase);
export const supabaseSavedBasketRepository = new SupabaseSavedBasketRepository(supabase);
export const supabaseAuthService = new SupabaseAuthService(supabase);

export {
  SupabasePriceRepository,
  SupabaseProductRepository,
  SupabaseUserRepository,
  SupabaseSupermarketRepository,
  SupabaseBasketRepository,
  SupabaseSavedBasketRepository,
  SupabaseAuthService,
};
