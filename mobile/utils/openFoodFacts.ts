/**
 * @deprecated Use LookupProductUseCase ou OpenFoodFactsProductService diretamente.
 * Este módulo existe apenas para retrocompatibilidade.
 * A lógica real está em:
 *   src/infrastructure/external/OpenFoodFactsProductService.ts
 */
import { ScannedProduct } from '@/types/product';
import { OpenFoodFactsProductService } from '@/src/infrastructure/external/OpenFoodFactsProductService';

const service = new OpenFoodFactsProductService();

/**
 * Busca produto pelo código de barras via Open Food Facts.
 * Delega para OpenFoodFactsProductService (infra layer).
 */
export async function fetchProductByBarcode(barcode: string): Promise<ScannedProduct | null> {
    const result = await service.fetchByBarcode(barcode);

    if (!result) return null;

    // Formata nome com marca se disponível e não repetida
    let formattedName = result.name;
    if (result.brand && !result.name.toLowerCase().includes(result.brand.toLowerCase())) {
        formattedName = `${result.brand} - ${result.name}`;
    }

    return {
        barcode,
        name: formattedName,
        brand: result.brand,
        quantity: undefined,
        imageUrl: result.imageUrl,
        rawResponse: undefined,
    };
}
