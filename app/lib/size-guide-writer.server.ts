/**
 * app/lib/size-guide-writer.server.ts
 *
 * Tarea 2.3 — Escribe el resultado del motor de resolución (2.2) en el
 * metafield `custom.resolved_size_guide` del producto.
 *
 * Namespace "custom" (no "app") a propósito: igual que los metaobjects de la
 * Fase 1, se mantiene fuera del namespace propio de la app para que el
 * metafield sea visible/consultable con normalidad desde el Admin y desde
 * cualquier otra herramienta, sin depender de que la app siga instalada.
 *
 * La DEFINICIÓN de este metafield (namespace, key, tipo) se crea con el mismo
 * script idempotente de la 1.4 (ver scripts/deploy-metaobject-definitions.js)
 * — nunca a mano desde el Admin, siguiendo la misma decisión de arquitectura.
 * Este módulo solo escribe/borra el VALOR en un producto concreto; asume que
 * la definición ya existe.
 */

import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";
import type { ResolutionResult } from "./size-guide-resolver";

const METAFIELD_NAMESPACE = "custom";
const METAFIELD_KEY = "resolved_size_guide";

const SET_METAFIELD_MUTATION = `#graphql
  mutation SetResolvedSizeGuide($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields { id }
      userErrors { field message }
    }
  }
`;

const DELETE_METAFIELD_MUTATION = `#graphql
  mutation DeleteResolvedSizeGuide($metafields: [MetafieldIdentifierInput!]!) {
    metafieldsDelete(metafields: $metafields) {
      deletedMetafields { key ownerId }
      userErrors { field message }
    }
  }
`;

/**
 * Aplica el resultado de resolveSizeGuide a un producto:
 * - "resolved" → escribe el metafield apuntando a la guía ganadora.
 * - "no_match" → borra el metafield si existía (el producto ya no tiene guía).
 * - "tie" → NO escribe ni borra nada. Se limita a avisar por consola — un
 *   empate de prioridad es una incidencia de configuración que alguien del
 *   equipo debe revisar y corregir (ver decisión de la tarea 2.2), no algo
 *   que el sistema deba "arreglar" solo eligiendo una guía al azar.
 */
export async function applyResolutionToProduct(
  admin: AdminApiContext,
  productId: string,
  result: ResolutionResult,
): Promise<void> {
  if (result.status === "resolved") {
    const response = await admin.graphql(SET_METAFIELD_MUTATION, {
      variables: {
        metafields: [
          {
            ownerId: productId,
            namespace: METAFIELD_NAMESPACE,
            key: METAFIELD_KEY,
            type: "metaobject_reference",
            value: result.sizeGuideId,
          },
        ],
      },
    });
    const { data } = await response.json();
    const userErrors = data.metafieldsSet.userErrors;
    if (userErrors.length) {
      throw new Error(
        `No se pudo escribir resolved_size_guide en ${productId}: ${JSON.stringify(userErrors)}`,
      );
    }
    console.log(
      `[size-guide-writer] ${productId} -> ${result.sizeGuideId} (reglas: ${result.matchedRuleIds.join(", ")})`,
    );
    return;
  }

  if (result.status === "no_match") {
    const response = await admin.graphql(DELETE_METAFIELD_MUTATION, {
      variables: {
        metafields: [{ ownerId: productId, namespace: METAFIELD_NAMESPACE, key: METAFIELD_KEY }],
      },
    });
    const { data } = await response.json();
    const userErrors = data.metafieldsDelete.userErrors;
    if (userErrors.length) {
      // No tratamos como error fatal: borrar un metafield que ya no existía
      // no debería pasar, pero si Shopify lo reporta como error, no bloqueamos
      // el resto del recálculo por esto.
      console.warn(
        `[size-guide-writer] Aviso al borrar resolved_size_guide de ${productId}: ${JSON.stringify(userErrors)}`,
      );
    } else {
      console.log(`[size-guide-writer] ${productId} -> sin guía aplicable (metafield borrado si existía).`);
    }
    return;
  }

  // status === "tie"
  console.warn(
    `[size-guide-writer] ⚠️ Empate de prioridad para el producto ${productId} entre las guías: ${result.tiedSizeGuideIds.join(", ")} (reglas: ${result.matchedRuleIds.join(", ")}). No se ha escrito ningún metafield — revisar manualmente las prioridades de esas guías.`,
  );
}
