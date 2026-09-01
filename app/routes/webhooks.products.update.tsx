/**
 * app/routes/webhooks.products.update.tsx
 *
 * Tarea 2.3 — Webhook de recálculo por cambio de producto (products/update).
 *
 * Se dispara cuando Marketing cambia tags/colecciones (o cualquier otro campo)
 * de un producto ya existente. Recalcula qué size_guide le corresponde y
 * actualiza el metafield resolved_size_guide.
 */

import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { recalculateSizeGuideForProduct } from "../lib/size-guide-orchestrator.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload, admin } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  const productId = (payload as { admin_graphql_api_id?: string }).admin_graphql_api_id;

  if (!admin || !productId) {
    // Sin sesión offline válida para esta tienda, o payload sin ID de
    // producto — no hay nada que recalcular. No lanzamos error: Shopify
    // reintentaría el webhook indefinidamente por algo que no se puede
    // arreglar reintentando.
    console.warn(
      `[webhooks.products.update] Sin admin context o sin admin_graphql_api_id para ${shop} — se ignora.`,
    );
    return new Response();
  }

  try {
    await recalculateSizeGuideForProduct(admin, productId);
  } catch (err) {
    // Se registra pero no se relanza como error 5xx: un fallo puntual al
    // recalcular una guía no debería hacer que Shopify reintente el webhook
    // en bucle. El producto se recalculará de nuevo en el próximo cambio, o
    // se puede forzar manualmente vía el recálculo masivo (2.4).
    console.error(`[webhooks.products.update] Error recalculando ${productId}:`, err);
  }

  return new Response();
};
