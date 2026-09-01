/**
 * app/lib/size-guide-data.server.ts
 *
 * Tarea 2.3 — Capa de acceso a datos para el motor de resolución (2.2).
 * Tarea 2.4 — Ampliado con fetchAllProductContexts, para el recálculo masivo.
 *
 * Reúne desde la Admin API todo lo que `resolveSizeGuide` necesita:
 * - Todas las entradas `size_guide_rule` (con sus condiciones ya parseadas).
 * - Todas las entradas `size_guide` (solo id + priority, lo mínimo para desempatar).
 * - El contexto de un producto concreto, o de TODOS los productos de la tienda
 *   (tags, colecciones, tipo, vendor, título).
 *
 * Deliberadamente separado de size-guide-resolver.ts (que es puro, sin red) y
 * de size-guide-writer.server.ts (que escribe el resultado) — cada módulo hace
 * una sola cosa, para poder testear la lógica de resolución sin mocks de red.
 *
 * "*.server.ts" es la convención de Remix para código que solo debe ejecutarse
 * en el servidor (nunca se envía al navegador) — igual que db.server.ts y
 * shopify.server.ts, ya existentes en el repo.
 */

import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";
import type {
  ProductMatchContext,
  RuleCondition,
  SizeGuideRule,
  SizeGuideSummary,
} from "./size-guide-resolver";

const RULES_QUERY = `#graphql
  query SizeGuideRulesPage($cursor: String) {
    metaobjects(type: "size_guide_rule", first: 100, after: $cursor) {
      nodes {
        id
        sizeGuide: field(key: "size_guide") {
          reference {
            ... on Metaobject { id }
          }
        }
        rootOperator: field(key: "root_operator") { value }
        conditions: field(key: "conditions") { value }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

const GUIDES_QUERY = `#graphql
  query SizeGuidesPage($cursor: String) {
    metaobjects(type: "size_guide", first: 100, after: $cursor) {
      nodes {
        id
        priority: field(key: "priority") { value }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

const PRODUCT_CONTEXT_QUERY = `#graphql
  query ProductMatchContext($id: ID!) {
    product(id: $id) {
      id
      title
      vendor
      productType
      tags
      collections(first: 100) {
        nodes { id }
      }
    }
  }
`;

/**
 * Igual que PRODUCT_CONTEXT_QUERY pero paginada sobre TODOS los productos de
 * la tienda, para el recálculo masivo (2.4). Trae el contexto completo en la
 * misma pasada (sin N+1: no hace falta una llamada extra por producto).
 */
const ALL_PRODUCTS_CONTEXT_QUERY = `#graphql
  query AllProductsContext($cursor: String) {
    products(first: 100, after: $cursor) {
      nodes {
        id
        title
        vendor
        productType
        tags
        collections(first: 100) {
          nodes { id }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

/**
 * Carga TODAS las entradas size_guide_rule, paginando si hay más de 100.
 * Las condiciones (guardadas como JSON en texto, ver tarea 1.3) se parsean
 * aquí — si una entrada tiene un JSON corrupto, se descarta con un aviso en
 * consola en vez de tumbar la carga completa (una regla mal formada no debe
 * bloquear el recálculo de las demás).
 */
export async function fetchAllSizeGuideRules(
  admin: AdminApiContext,
): Promise<SizeGuideRule[]> {
  const rules: SizeGuideRule[] = [];
  let cursor: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const response = await admin.graphql(RULES_QUERY, { variables: { cursor } });
    const { data } = await response.json();
    const page = data.metaobjects;

    for (const node of page.nodes) {
      const sizeGuideId = node.sizeGuide?.reference?.id;
      const rootOperator = node.rootOperator?.value;
      const rawConditions = node.conditions?.value;

      if (!sizeGuideId || (rootOperator !== "ANY" && rootOperator !== "ALL")) {
        console.warn(
          `[size-guide-data] Regla ${node.id} sin size_guide o root_operator válido — se ignora.`,
        );
        continue;
      }

      let conditions: RuleCondition[] = [];
      try {
        conditions = JSON.parse(rawConditions ?? "[]");
      } catch (err) {
        console.warn(
          `[size-guide-data] Regla ${node.id} tiene "conditions" con JSON inválido — se trata como sin condiciones (nunca coincide). Valor: ${rawConditions}`,
        );
      }

      rules.push({ id: node.id, sizeGuideId, rootOperator, conditions });
    }

    hasNextPage = page.pageInfo.hasNextPage;
    cursor = page.pageInfo.endCursor;
  }

  return rules;
}

/** Carga TODAS las entradas size_guide (solo id + priority), paginando si hace falta. */
export async function fetchAllSizeGuideSummaries(
  admin: AdminApiContext,
): Promise<SizeGuideSummary[]> {
  const guides: SizeGuideSummary[] = [];
  let cursor: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const response = await admin.graphql(GUIDES_QUERY, { variables: { cursor } });
    const { data } = await response.json();
    const page = data.metaobjects;

    for (const node of page.nodes) {
      const priorityRaw = node.priority?.value;
      const priority = priorityRaw ? parseInt(priorityRaw, 10) : 0;
      guides.push({ id: node.id, priority: Number.isNaN(priority) ? 0 : priority });
    }

    hasNextPage = page.pageInfo.hasNextPage;
    cursor = page.pageInfo.endCursor;
  }

  return guides;
}

function toProductMatchContext(product: {
  tags?: string[] | null;
  collections: { nodes: { id: string }[] };
  productType?: string | null;
  vendor?: string | null;
  title?: string | null;
}): ProductMatchContext {
  return {
    tags: product.tags ?? [],
    collectionIds: product.collections.nodes.map((c) => c.id),
    productType: product.productType ?? undefined,
    vendor: product.vendor ?? undefined,
    title: product.title ?? undefined,
  };
}

/**
 * Carga el contexto de un producto (tags, colecciones, tipo, vendor, título)
 * directamente desde la Admin API, en vez de fiarse de los campos del propio
 * payload del webhook — así el resultado siempre refleja el estado real y
 * actual del producto, no una fotografía potencialmente desactualizada.
 */
export async function fetchProductMatchContext(
  admin: AdminApiContext,
  productId: string,
): Promise<ProductMatchContext | null> {
  const response = await admin.graphql(PRODUCT_CONTEXT_QUERY, {
    variables: { id: productId },
  });
  const { data } = await response.json();
  const product = data.product;

  if (!product) {
    console.warn(`[size-guide-data] Producto ${productId} no encontrado (¿borrado entre el webhook y esta lectura?).`);
    return null;
  }

  return toProductMatchContext(product);
}

/**
 * Carga el contexto de TODOS los productos de la tienda, paginando. Usado por
 * el recálculo masivo (2.4) cuando cambia una regla o una guía — se recalcula
 * el catálogo entero en vez de intentar adivinar qué productos "dejaron" de
 * coincidir con la condición anterior (el payload del webhook de metaobject
 * no incluye el valor anterior de los campos, así que no hay forma fiable de
 * acotar el recálculo sin arriesgar dejar productos con la guía antigua
 * "congelada" — ver docs/bulk-recalculate.md para el razonamiento completo).
 *
 * Devuelve pares [productId, contexto] en vez de un Map para mantener el
 * orden de llegada (paginación estable) y evitar sorpresas de iteración.
 */
export async function fetchAllProductContexts(
  admin: AdminApiContext,
): Promise<Array<{ productId: string; context: ProductMatchContext }>> {
  const results: Array<{ productId: string; context: ProductMatchContext }> = [];
  let cursor: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const response = await admin.graphql(ALL_PRODUCTS_CONTEXT_QUERY, {
      variables: { cursor },
    });
    const { data } = await response.json();
    const page = data.products;

    for (const node of page.nodes) {
      results.push({ productId: node.id, context: toProductMatchContext(node) });
    }

    hasNextPage = page.pageInfo.hasNextPage;
    cursor = page.pageInfo.endCursor;
  }

  return results;
}
