/**
 * app/routes/webhooks.metaobjects.create.tsx
 *
 * Tarea 2.4 — Igual que webhooks.metaobjects.update.tsx, pero para la
 * creación de una size_guide_rule o size_guide nueva (una regla nueva puede
 * empezar a coincidir con productos que ya existían, sin que esos productos
 * hayan cambiado ellos mismos).
 *
 * Comparte toda la lógica con el webhook de "update" a través de
 * recalculateAllProducts — el motor de resolución no distingue "creado" de
 * "actualizado", solo evalúa el estado actual del catálogo.
 *
 * ⚠️ Mismo punto sin verificar que en webhooks.metaobjects.update.tsx — ver
 * docs/bulk-recalculate.md.
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
    console.warn(`[webhooks.metaobjects.create] Sin admin context para ${shop} — se ignora.`);
    return new Response();
  }

  try {
    const summary = await recalculateAllProducts(admin);
    console.log(
      `[webhooks.metaobjects.create] Recálculo masivo completado para ${shop}: ${summary.totalProducts} productos (${summary.resolved} resueltos, ${summary.noMatch} sin guía, ${summary.ties} empates).`,
    );
  } catch (err) {
    console.error(`[webhooks.metaobjects.create] Error en el recálculo masivo para ${shop}:`, err);
  }

  return new Response();
};
