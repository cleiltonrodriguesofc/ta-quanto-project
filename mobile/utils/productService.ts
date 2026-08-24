import { lookupProductUseCase, getCommunityPricesUseCase } from '@/src/application';
import { Product } from '@/types/product';
import { getLocalProducts, saveLocalProducts } from './storage';

export const fetchProductMetadata = async (barcode: string): Promise<Product | null> => {
  const result = await lookupProductUseCase.execute(barcode);
  if (!result) return null;
  return {
    barcode: result.barcode,
    name: result.name,
    brand: result.brand,
    imageUrl: result.imageUrl,
    avgPrice: result.avgPrice,
    createdAt: result.createdAt,
  };
};

export const searchProductsLocally = async (query: string): Promise<Product[]> => {
  const products = await getLocalProducts();
  const lower = query.toLowerCase();
  return products.filter(
    p => p.name.toLowerCase().includes(lower) || p.barcode.includes(query),
  );
};

export const addProductToLocalCache = async (product: Product): Promise<void> => {
  const products = await getLocalProducts();
  const existingIndex = products.findIndex(p => p.barcode === product.barcode);
  let updated: Product[];
  if (existingIndex >= 0) {
    updated = [...products];
    updated[existingIndex] = product;
  } else {
    updated = [...products, product];
  }
  await saveLocalProducts(updated as any);
};

/**
 * Busca produtos do Supabase (via getCommunityPricesUseCase com fallback local).
 * Agrupa por barcode e expõe o melhor preço e supermercado para cada produto.
 */
export const getProducts = async (): Promise<Product[]> => {
  try {
    const prices = await getCommunityPricesUseCase.execute();
    if (!prices || prices.length === 0) return getLocalProducts();

    // Agrupa por barcode, mantendo o menor preço
    const map = new Map<string, Product>();
    for (const p of prices) {
      const barcode = p.barcode || '';
      if (!barcode) continue;

      const existing = map.get(barcode);
      if (!existing || p.price < (existing.bestPrice ?? Infinity)) {
        map.set(barcode, {
          barcode,
          name: p.productName || barcode,
          brand: p.brand,
          imageUrl: p.imageUrl,
          bestPrice: p.price,
          supermarket: p.supermarket,
          createdAt: p.timestamp || new Date().toISOString(),
        });
      }
    }
    return Array.from(map.values());
  } catch (error) {
    console.warn('[productService] getProducts fallback to local cache:', error);
    return getLocalProducts();
  }
};
