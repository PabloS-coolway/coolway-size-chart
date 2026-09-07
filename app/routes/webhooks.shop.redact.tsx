/**
 * app/routes/webhooks.shop.redact.tsx
 *
 * Tarea 2.6 — Webhook obligatorio de cumplimiento (GDPR/CCPA).
 *
 * Se dispara unos 48 días después de que una tienda desinstale la app,
 * pidiendo borrar TODOS los datos que la app haya guardado sobre esa tienda
 * en sus propios sistemas (no en Shopify — los metaobjects/metafields que la
 * app creó en la tienda son datos del comercio, no de la app, y no se tocan
 * aquí).
 *
 * RESPUESTA DE ESTA APP: lo único que la app guarda por tienda en su propia
 * base de datos es la fila de `Session` (shop, accessToken, scope — ver
 * db.server.ts / prisma/schema.prisma). Esa fila ya se borra al desinstalar
 * (ver webhooks.app.uninstalled.tsx), así que en el caso normal este webhook
 * llega cuando ya no queda nada que borrar. Se repite el borrado aquí de
 * todos modos, de forma idempotente (deleteMany no falla si no hay filas que
 * coincidan) — por si el borrado de la desinstalación no llegó a completarse
 * por cualquier motivo, o si la tienda se reinstaló y desinstaló varias veces
 * entre medias.
 */

import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);
  console.log(`[webhooks.shop.redact] Borrando cualquier dato residual de ${shop}. Payload:`, JSON.stringify(payload));

  await db.session.deleteMany({ where: { shop } });

  return new Response();
};
