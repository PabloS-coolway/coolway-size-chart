/**
 * app/routes/webhooks.customers.redact.tsx
 *
 * Tarea 2.6 — Webhook obligatorio de cumplimiento (GDPR/CCPA).
 *
 * Se dispara cuando hay que borrar los datos personales de un cliente
 * concreto (derecho al olvido), normalmente 10 días después de que el
 * cliente lo solicite o de que su cuenta se elimine.
 *
 * RESPUESTA DE ESTA APP: igual que en customers/data_request — no se
 * almacena ningún dato personal de clientes finales (ver esa misma nota en
 * webhooks.customers.data_request.tsx), así que no hay nada que borrar.
 * Se registra la solicitud y se responde 200 OK.
 */

import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);
  console.log(
    `[webhooks.customers.redact] Solicitud de borrado de cliente recibida — esta app no almacena datos de clientes finales, no hay nada que borrar. Payload:`,
    JSON.stringify(payload),
  );

  return new Response();
};
