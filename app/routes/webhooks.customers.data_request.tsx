/**
 * app/routes/webhooks.customers.data_request.tsx
 *
 * Tarea 2.6 — Webhook obligatorio de cumplimiento (GDPR/CCPA).
 *
 * Shopify exige este webhook a CUALQUIER app instalada, pública o privada,
 * sin excepción. Se dispara cuando un cliente final de la tienda solicita
 * acceder a los datos personales que la app pueda tener guardados sobre él
 * (derecho de acceso).
 *
 * RESPUESTA DE ESTA APP: coolway-size-chart no almacena ningún dato personal
 * de clientes finales. El único dato que persiste la app (tabla `Session`,
 * ver db.server.ts / prisma/schema.prisma) es la sesión offline de la propia
 * tienda (shop, accessToken, scope) — nunca nada asociado a un cliente
 * concreto (ni email, ni nombre, ni pedidos). Los metaobjects y metafields
 * que la app crea (size_guide, size_guide_rule, resolved_size_guide, etc.)
 * son datos de PRODUCTO, no de cliente.
 *
 * Por tanto, no hay ninguna búsqueda que hacer: se registra la solicitud
 * (para tener rastro por si se necesita en una auditoría) y se responde
 * 200 OK sin devolver ningún dato, porque no existe ninguno que devolver.
 */

import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);
  console.log(
    `[webhooks.customers.data_request] Solicitud de acceso a datos recibida — esta app no almacena datos de clientes finales, no hay nada que devolver. Payload:`,
    JSON.stringify(payload),
  );

  return new Response();
};
