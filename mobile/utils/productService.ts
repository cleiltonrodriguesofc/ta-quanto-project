import { lookupProductUseCase } from '@/src/application';
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
