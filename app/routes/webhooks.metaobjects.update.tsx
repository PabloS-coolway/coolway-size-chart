/**
 * app/routes/webhooks.metaobjects.update.tsx
 *
 * Tarea 2.4 — Recálculo masivo al cambiar una regla (o una guía, por su
 * priority) — dispara sobre el webhook de actualización de metaobjects,
 * filtrado a "size_guide_rule" y "size_guide" a nivel de suscripción (ver
 * shopify.app.toml y docs/bulk-recalculate.md).
 *
 * ⚠️ CORRECCIÓN IMPORTANTE (01-sept-2026, tras la primera prueba real):
 * el handler responde a Shopify DE INMEDIATO, sin esperar a que termine
 * recalculateAllProducts. Si se espera (await) antes de responder, con
 * catálogos de varios cientos de productos el recálculo tarda más de lo que
 * Shopify espera una respuesta — Shopify interpreta la tardanza como un
 * fallo y REINTENTA la entrega del webhook, lo que dispara otro recálculo
 * completo encima del que ya estaba en marcha (confirmado en la práctica:
 * un solo guardado de una regla disparó 2+ recálculos completos de 728
 * productos). La solución es no esperar el resultado antes de devolver la
 * respuesta — el recálculo sigue corriendo en segundo plano en el mismo
 * proceso de Node (no es un entorno serverless), y Shopify recibe su 200 OK
 * al instante, sin reintentar.
 */

import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { recalculateAllProducts } from "../lib/size-guide-orchestrator.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, admin } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  if (!admin) {
    console.warn(`[webhooks.metaobjects.update] Sin admin context para ${shop} — se ignora.`);
    return new Response();
  }

  // Deliberadamente SIN await: responder a Shopify ya, dejar que el
  // recálculo corra en segundo plano. Ver nota de cabecera.
  recalculateAllProducts(admin)
    .then((summary) => {
      console.log(
        `[webhooks.metaobjects.update] Recálculo masivo completado para ${shop}: ${summary.totalProducts} productos (${summary.resolved} resueltos, ${summary.noMatch} sin guía, ${summary.ties} empates).`,
      );
      if (summary.ties > 0) {
        console.warn(`[webhooks.metaobjects.update] ⚠️ ${summary.ties} producto(s) con empate de prioridad:`, summary.tieDetails);
      }
    })
    .catch((err) => {
      console.error(`[webhooks.metaobjects.update] Error en el recálculo masivo para ${shop}:`, err);
    });

  return new Response();
};
