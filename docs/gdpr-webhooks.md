# Webhooks obligatorios de cumplimiento (GDPR/CCPA) — `app/routes/webhooks.customers.*` y `webhooks.shop.redact.tsx`

**Tarea:** 2.6 — Webhooks obligatorios de cumplimiento (GDPR)
**Estado:** ✅ Completada y verificada con los 3 eventos de prueba reales.
**Fecha:** 01-sept-2026

## Por qué son obligatorios

Shopify exige estos 3 webhooks a **cualquier** app instalada en una tienda, sea pública o privada — no es opcional ni depende de si la app maneja datos de clientes o no. Antes de esta tarea, `coolway-size-chart` no los tenía implementados (solo existían `app/uninstalled` y `app/scopes_update`, del scaffold original del CLI).

## Los 3 webhooks

| Webhook | Cuándo se dispara | Qué hace nuestra app |
|---|---|---|
| `customers/data_request` | Un cliente final pide acceder a sus datos personales (derecho de acceso) | Responde 200 OK sin devolver ningún dato — la app no almacena datos de clientes finales |
| `customers/redact` | Hay que borrar los datos de un cliente concreto (derecho al olvido) | Responde 200 OK sin borrar nada — no hay nada que borrar, mismo motivo que arriba |
| `shop/redact` | ~48 días después de desinstalar la app, hay que borrar todo lo que la app guardó de esa tienda | Borra la fila de `Session` de esa tienda (`db.session.deleteMany({ where: { shop } })`) |

## Por qué la respuesta a los dos primeros es tan simple

`coolway-size-chart` no tiene ningún modelo de datos que almacene información de clientes finales — se revisó `prisma/schema.prisma` y solo existe el modelo `Session` (datos de sesión de la propia tienda: shop, accessToken, scope), sin ningún campo ni tabla relacionada con clientes, emails, pedidos, etc. Los metaobjects y metafields que la app crea (`size_guide`, `size_guide_rule`, `resolved_size_guide`...) son datos de **producto**, no de cliente. Por tanto, no hay ninguna búsqueda ni borrado real que hacer para `customers/data_request` ni `customers/redact` — la respuesta correcta es simplemente confirmar la recepción y registrar la solicitud para tener rastro por si se necesita en una auditoría.

## Por qué `shop/redact` sí borra algo, aunque probablemente ya esté borrado

`webhooks.app.uninstalled.tsx` (ya existente, del scaffold) ya borra la sesión de la tienda en el momento de la desinstalación. `shop/redact` llega ~48 días después, como confirmación formal exigida por Shopify — en el caso normal, cuando llega, ya no queda nada que borrar. Se repite el borrado aquí de todos modos porque `deleteMany` es idempotente (no falla si no hay filas que coincidan) — por si el borrado de la desinstalación no se completó por cualquier motivo, o si hubo instalaciones/desinstalaciones repetidas entre medias.

## Hallazgo real durante el despliegue: estos 3 webhooks NO se declaran como `[[webhooks.subscriptions]]` normales

Al lanzar `npm run dev` con los 3 declarados igual que `products/update` o `metaobjects/update` (como bloques `[[webhooks.subscriptions]]` normales con `uri`+`topics`), Shopify los rechazó:
```
Error
└ The following topic is invalid: customers/data_request
└ The following topic is invalid: customers/redact
└ The following topic is invalid: shop/redact
```

**Causa:** estos 3 webhooks de cumplimiento son un caso especial en el schema de `shopify.app.toml` — van en un bloque dedicado `[webhooks.privacy_compliance]`, con un campo de URL específico por webhook (`customer_data_request_url`, `customer_deletion_url`, `shop_deletion_url`), no como una lista de suscripciones con topic. Corregido, y `npm run dev` arrancó sin error tras el cambio.

## Validación realizada (01-sept-2026, contra `coolway-sandbox`)

Usando el CLI directamente (`shopify app webhook trigger --topic=<topic>`), con API version `2026-07` (la misma que usa el resto de la app) y delivery method `HTTP` apuntando al túnel activo de `npm run dev`:

```bash
shopify app webhook trigger --topic=customers/data_request
shopify app webhook trigger --topic=customers/redact
shopify app webhook trigger --topic=shop/redact
```

Los 3 devolvieron `✅ Success! Webhook has been enqueued for delivery.`, y **los 3 llegaron correctamente** a la terminal de `npm run dev` — confirmado visualmente por Juanmi (`Received CUSTOMERS_DATA_REQUEST webhook...`, `Received CUSTOMERS_REDACT webhook...`, `Received SHOP_REDACT webhook...`, cada uno con el log correspondiente de la app, sin errores).

## Siguiente paso

Retomar la 2.9 (decisiones pendientes del diseño del panel, ver `docs/admin-panel-design.md`) para poder empezar la 2.10 (implementación del panel).
