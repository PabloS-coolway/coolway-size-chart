/**
 * app/routes/webhooks.metaobjects.delete.tsx
 *
 * Tarea 2.4 — Igual que las otras dos, pero para el borrado de una
 * size_guide_rule o size_guide. Borrar una regla puede "liberar" productos
 * que solo coincidían con ella — hay que recalcular para que esos productos
 * no se queden con una referencia a una guía que ya no aplica.
 *
 * ⚠️ Mismo punto sin verificar que en las otras dos — ver
 * docs/bulk-recalculate.md. Con el añadido de que, al ser un borrado, el
 * payload probablemente NO incluya el contenido completo del metaobject
 * borrado, solo su id y type — por eso extractMetaobjectType debe funcionar
 * igual con un payload más pequeño.
 */

import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { recalculateAllProducts } from "../lib/size-guide-orchestrator.server";

const RELEVANT_METAOBJECT_TYPES = ["size_guide_rule", "size_guide"];

function extractMetaobjectType(payload: unknown): string | undefined {
  const p = payload as Record<string, unknown>;
  return (p?.type ?? p?.definition_type ?? p?.metaobject_type) as string | undefined;
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload, admin } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  const metaobjectType = extractMetaobjectType(payload);

  if (!metaobjectType || !RELEVANT_METAOBJECT_TYPES.includes(metaobjectType)) {
    return new Response();
  }

  if (!admin) {
    console.warn(`[webhooks.metaobjects.delete] Sin admin context para ${shop} — se ignora.`);
    return new Response();
  }

  try {
    const summary = await recalculateAllProducts(admin);
    console.log(
      `[webhooks.metaobjects.delete] Recálculo masivo completado para ${shop}: ${summary.totalProducts} productos (${summary.resolved} resueltos, ${summary.noMatch} sin guía, ${summary.ties} empates).`,
    );
  } catch (err) {
    console.error(`[webhooks.metaobjects.delete] Error en el recálculo masivo para ${shop}:`, err);
  }

  return new Response();
};
