/**
 * app/lib/size-guide-orchestrator.server.ts
 *
 * Tarea 2.3 — Une las tres piezas para un producto concreto:
 *   1. Carga las reglas y guías existentes + el contexto del producto
 *      (size-guide-data.server.ts).
 *   2. Resuelve qué guía aplica (size-guide-resolver.ts, función pura, 2.2).
 *   3. Escribe el resultado en el metafield del producto
 *      (size-guide-writer.server.ts).
 *
 * Tarea 2.4 — Añade recalculateAllProducts, para cuando cambia una regla o
 * una guía (no un producto): recorre TODO el catálogo, cargando las reglas y
 * guías una única vez (no una vez por producto, como sería si simplemente
 * llamáramos a recalculateSizeGuideForProduct en un bucle) — evita cientos de
 * llamadas redundantes a la Admin API para leer siempre los mismos datos.
 */

import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";
import { resolveSizeGuide, type ResolutionResult, type SizeGuideRule, type SizeGuideSummary } from "./size-guide-resolver";
import {
  fetchAllProductContexts,
  fetchAllSizeGuideRules,
  fetchAllSizeGuideSummaries,
  fetchProductMatchContext,
} from "./size-guide-data.server";
import { applyResolutionToProduct } from "./size-guide-writer.server";

/**
 * Recalcula y aplica la guía de tallas resuelta para un único producto.
 * No lanza si el producto no existe (puede haber sido borrado entre el
 * disparo del webhook y esta ejecución) — simplemente no hace nada.
 */
export async function recalculateSizeGuideForProduct(
  admin: AdminApiContext,
  productId: string,
): Promise<void> {
  const product = await fetchProductMatchContext(admin, productId);
  if (!product) return;

  // NOTA DE RENDIMIENTO (a revisar si el catálogo crece mucho): se cargan
  // TODAS las reglas y guías en cada recálculo, en vez de cachearlas. Para el
  // volumen actual del proyecto (decenas de guías/reglas por tienda, ver
  // inventario de la 0.1) esto es aceptable; si se vuelve un cuello de
  // botella, cachear con invalidación al tocar una regla sería el siguiente paso.
  const [rules, guides] = await Promise.all([
    fetchAllSizeGuideRules(admin),
    fetchAllSizeGuideSummaries(admin),
  ]);

  const result = resolveSizeGuide(product, rules, guides);
  await applyResolutionToProduct(admin, productId, result);
}

/** Resumen devuelto por recalculateAllProducts, para logging/observabilidad. */
export interface BulkRecalculateSummary {
  totalProducts: number;
  resolved: number;
  noMatch: number;
  ties: number;
  tieDetails: Array<{ productId: string; tiedSizeGuideIds: string[] }>;
}

/**
 * Recalcula TODO el catálogo de la tienda. Se usa cuando cambia una
 * size_guide_rule o una size_guide (su priority) — ver tarea 2.4 y
 * docs/bulk-recalculate.md para la justificación de por qué se recalcula
 * el catálogo entero en vez de un subconjunto "adivinado".
 *
 * Carga las reglas y guías UNA sola vez (no una vez por producto) — la
 * optimización clave frente a llamar a recalculateSizeGuideForProduct en un
 * bucle, que repetiría esa carga cientos de veces sin necesidad.
 */
export async function recalculateAllProducts(
  admin: AdminApiContext,
): Promise<BulkRecalculateSummary> {
  const [rules, guides]: [SizeGuideRule[], SizeGuideSummary[]] = await Promise.all([
    fetchAllSizeGuideRules(admin),
    fetchAllSizeGuideSummaries(admin),
  ]);

  const products = await fetchAllProductContexts(admin);

  const summary: BulkRecalculateSummary = {
    totalProducts: products.length,
    resolved: 0,
    noMatch: 0,
    ties: 0,
    tieDetails: [],
  };

  for (const { productId, context } of products) {
    const result: ResolutionResult = resolveSizeGuide(context, rules, guides);

    if (result.status === "resolved") summary.resolved += 1;
    else if (result.status === "no_match") summary.noMatch += 1;
    else {
      summary.ties += 1;
      summary.tieDetails.push({ productId, tiedSizeGuideIds: result.tiedSizeGuideIds });
    }

    try {
      await applyResolutionToProduct(admin, productId, result);
    } catch (err) {
      // Un fallo al escribir el metafield de UN producto no debe abortar el
      // recálculo de los demás — se registra y se continúa.
      console.error(`[size-guide-orchestrator] Error aplicando resolución a ${productId}:`, err);
    }
  }

  return summary;
}
