import { IProductRepository } from '@/src/domain/repositories';
import { Product } from '@/src/domain/entities';
import {
  CosmosProductService,
  OpenFoodFactsProductService,
  OpenBeautyFactsProductService,
  UPCItemDBProductService,
  GoUPCProductService,
  ExternalProductResult,
} from '@/src/infrastructure/external';

/**
 * LookupProductUseCase — busca informações de produto por código de barras.
 *
 * Estratégia em 3 etapas para minimizar latência:
 *
 * 0. Cache local (AsyncStorage) → instantâneo
 * 1. Grupo rápido: Cosmos (BR) + OpenFoodFacts (global alimentos)
 *    → Promise.race: retorna assim que qualquer uma responder
 * 2. Grupo estendido: OpenBeautyFacts + UPCItemDB + GoUPC
 *    → Promise.race: cobre cosméticos e EAN internacionais
 *
 * Qualquer resultado encontrado é salvo em cache (fire-and-forget).
 */
export class LookupProductUseCase {
  private cosmos = new CosmosProductService();
  private openFoodFacts = new OpenFoodFactsProductService();
  private openBeautyFacts = new OpenBeautyFactsProductService();
  private upcItemDB = new UPCItemDBProductService();
  private goUPC = new GoUPCProductService();

  constructor(private productRepo: IProductRepository) {}

  async execute(barcode: string): Promise<Product | null> {
    // Etapa 0: cache local — zero latência de rede
    const cached = await this.productRepo.getByBarcode(barcode);
    if (cached) {
      console.log('[LookupProduct] Cache local hit:', barcode);
      return cached;
    }

    // Etapa 1: Cosmos (melhor para BR) + OpenFoodFacts (alimentos globais)
    // → corrida paralela: quem responder primeiro com dados válidos vence
    console.log('[LookupProduct] Buscando em Cosmos + OpenFoodFacts em paralelo...');
    const grupoRapido = await this.raceValidResult([
      this.cosmos.fetchByBarcode(barcode),
      this.openFoodFacts.fetchByBarcode(barcode),
    ]);

    if (grupoRapido) {
      console.log('[LookupProduct] Encontrado no grupo rápido:', grupoRapido.name);
      return this.persistAndReturn(grupoRapido);
    }

    // Etapa 2: OpenBeautyFacts + UPCItemDB + GoUPC (cosméticos + EAN internacionais)
    console.log('[LookupProduct] Buscando em OpenBeautyFacts + UPCItemDB + GoUPC em paralelo...');
    const grupoEstendido = await this.raceValidResult([
      this.openBeautyFacts.fetchByBarcode(barcode),
      this.upcItemDB.fetchByBarcode(barcode),
      this.goUPC.fetchByBarcode(barcode),
    ]);

    if (grupoEstendido) {
      console.log('[LookupProduct] Encontrado no grupo estendido:', grupoEstendido.name);
      return this.persistAndReturn(grupoEstendido);
    }

    console.log('[LookupProduct] Produto não encontrado em nenhuma fonte:', barcode);
    return null;
  }

  /**
   * Executa todas as promises em paralelo e retorna o PRIMEIRO resultado
   * válido (com nome preenchido). Ignora erros individuais.
   */
  private async raceValidResult(
    promises: Promise<ExternalProductResult | null>[],
  ): Promise<ExternalProductResult | null> {
    return new Promise(resolve => {
      let settled = 0;
      const total = promises.length;

      promises.forEach(p => {
        p.then(result => {
          if (result?.name) {
            resolve(result);
          }
        }).catch(() => {
          // falha silenciosa — outras fontes podem resolver
        }).finally(() => {
          settled++;
          if (settled === total) {
            // Todas terminaram sem resultado válido
            resolve(null);
          }
        });
      });
    });
  }

  private async persistAndReturn(result: ExternalProductResult): Promise<Product> {
    const product: Product = {
      barcode: result.barcode,
      name: result.name,
      brand: result.brand,
      imageUrl: result.imageUrl,
      avgPrice: result.price,
      createdAt: new Date().toISOString(),
    };

    // Salva no cache em background (não bloqueia o retorno)
    this.productRepo.save(product).catch(err => {
      console.warn('[LookupProduct] Falha ao salvar no cache:', err);
    });

    return product;
  }
}
