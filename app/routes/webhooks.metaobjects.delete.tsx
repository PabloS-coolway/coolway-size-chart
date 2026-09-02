/**
 * app/routes/webhooks.metaobjects.delete.tsx
 *
 * Tarea 2.4 — Igual que las otras dos, pero para el borrado de una
 * size_guide_rule o size_guide. Borrar una regla puede "liberar" productos
 * que solo coincidían con ella — hay que recalcular para que esos productos
 * no se queden con una referencia a una guía que ya no aplica.
 *
 * Responde a Shopify de inmediato, sin esperar (await) a que termine el
 * recálculo — ver la nota completa en webhooks.metaobjects.update.tsx sobre
 * por qué esperar provoca reintentos de Shopify y recálculos duplicados.
 */

import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { recalculateAllProducts } from "../lib/size-guide-orchestrator.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, admin } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  if (!admin) {
    console.warn(`[webhooks.metaobjects.delete] Sin admin context para ${shop} — se ignora.`);
    return new Response();
  }

  recalculateAllProducts(admin)
    .then((summary) => {
      console.log(
        `[webhooks.metaobjects.delete] Recálculo masivo completado para ${shop}: ${summary.totalProducts} productos (${summary.resolved} resueltos, ${summary.noMatch} sin guía, ${summary.ties} empates).`,
      );
    })
    .catch((err) => {
      console.error(`[webhooks.metaobjects.delete] Error en el recálculo masivo para ${shop}:`, err);
    });

  return new Response();
};
