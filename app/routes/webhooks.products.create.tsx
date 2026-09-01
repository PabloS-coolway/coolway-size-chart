/**
 * app/routes/webhooks.products.create.tsx
 *
 * Tarea 2.3 — Webhook de recálculo por creación de producto (products/create).
 *
 * Un producto recién creado puede ya cumplir las condiciones de una regla
 * existente (por ejemplo, si se crea directamente con el tag y la colección
 * correctos) — sin este webhook, ese producto no tendría resolved_size_guide
 * hasta su primera edición posterior.
 *
 * Comparte toda la lógica con webhooks.products.update.tsx a través de
 * recalculateSizeGuideForProduct — el propio motor de resolución (2.2) no
 * distingue "creado" de "actualizado", solo evalúa el estado actual del
 * producto.
 */

import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { recalculateSizeGuideForProduct } from "../lib/size-guide-orchestrator.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload, admin } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  const productId = (payload as { admin_graphql_api_id?: string }).admin_graphql_api_id;

  if (!admin || !productId) {
    console.warn(
      `[webhooks.products.create] Sin admin context o sin admin_graphql_api_id para ${shop} — se ignora.`,
    );
    return new Response();
  }

  try {
    await recalculateSizeGuideForProduct(admin, productId);
  } catch (err) {
    console.error(`[webhooks.products.create] Error recalculando ${productId}:`, err);
  }

  return new Response();
};
