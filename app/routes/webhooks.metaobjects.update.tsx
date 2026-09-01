/**
 * app/routes/webhooks.metaobjects.update.tsx
 *
 * Tarea 2.4 — Recálculo masivo al cambiar una regla (o una guía, por su
 * priority) — dispara sobre el webhook genérico de actualización de
 * metaobjects.
 *
 * ⚠️ PUNTO SIN VERIFICAR (ver docs/bulk-recalculate.md): el nombre exacto del
 * topic de webhook para metaobjects, y la forma exacta del payload (en qué
 * campo viene el "type" del metaobject actualizado) son la mejor estimación,
 * no verificadas contra el schema real — igual que otros puntos ya marcados
 * así en la 1.4/2.3. Se usa "metaobjects/update" como topic, y se comprueba
 * el campo `type` del payload con varios nombres candidatos por si acaso.
 * CONFIRMAR con el Shopify Dev MCP o con el primer log real antes de fiarse
 * de este código sin probarlo.
 */

import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { recalculateAllProducts } from "../lib/size-guide-orchestrator.server";

// Solo estos dos tipos de metaobject afectan al resultado de resolveSizeGuide
// (las reglas en sí, y la priority de las guías para el desempate). Cambios
// en size_guide_block_* o en el contenido no-priority de size_guide no
// necesitan disparar un recálculo — evita recalcular el catálogo entero por
// cada cambio de texto o imagen de una guía.
const RELEVANT_METAOBJECT_TYPES = ["size_guide_rule", "size_guide"];

function extractMetaobjectType(payload: unknown): string | undefined {
  const p = payload as Record<string, unknown>;
  // Varios nombres candidatos, por si el payload real usa una forma distinta
  // a la que hemos estimado.
  return (p?.type ?? p?.definition_type ?? p?.metaobject_type) as string | undefined;
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload, admin } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);
  console.log(`[webhooks.metaobjects.update] Payload recibido (para verificar la forma real):`, JSON.stringify(payload));

  const metaobjectType = extractMetaobjectType(payload);

  if (!metaobjectType || !RELEVANT_METAOBJECT_TYPES.includes(metaobjectType)) {
    // No es una size_guide_rule ni una size_guide (o no pudimos determinar el
    // tipo) — no hace falta recalcular nada. Esto también filtra cambios en
    // el metaobject "Example" del CLI y en los 4 size_guide_block_*.
    return new Response();
  }

  if (!admin) {
    console.warn(`[webhooks.metaobjects.update] Sin admin context para ${shop} — se ignora.`);
    return new Response();
  }

  try {
    const summary = await recalculateAllProducts(admin);
    console.log(
      `[webhooks.metaobjects.update] Recálculo masivo completado para ${shop}: ${summary.totalProducts} productos (${summary.resolved} resueltos, ${summary.noMatch} sin guía, ${summary.ties} empates).`,
    );
    if (summary.ties > 0) {
      console.warn(`[webhooks.metaobjects.update] ⚠️ ${summary.ties} producto(s) con empate de prioridad:`, summary.tieDetails);
    }
  } catch (err) {
    console.error(`[webhooks.metaobjects.update] Error en el recálculo masivo para ${shop}:`, err);
  }

  return new Response();
};
