/**
 * app/routes/webhooks.metaobjects.create.tsx
 *
 * Tarea 2.4 — Igual que webhooks.metaobjects.update.tsx, pero para la
 * creación de una size_guide_rule o size_guide nueva (una regla nueva puede
 * empezar a coincidir con productos que ya existían, sin que esos productos
 * hayan cambiado ellos mismos).
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
    console.warn(`[webhooks.metaobjects.create] Sin admin context para ${shop} — se ignora.`);
    return new Response();
  }

  recalculateAllProducts(admin)
    .then((summary) => {
      console.log(
        `[webhooks.metaobjects.create] Recálculo masivo completado para ${shop}: ${summary.totalProducts} productos (${summary.resolved} resueltos, ${summary.noMatch} sin guía, ${summary.ties} empates).`,
      );
    })
    .catch((err) => {
      console.error(`[webhooks.metaobjects.create] Error en el recálculo masivo para ${shop}:`, err);
    });

  return new Response();
};
