# Webhook de recálculo por cambio de producto — `app/routes/webhooks.products.*`

**Tarea:** 2.3 — Webhook de recálculo por cambio de producto
**Estado:** ✅ Completada y verificada de extremo a extremo contra `coolway-sandbox`.
**Fecha:** 01-sept-2026

## Piezas nuevas

| Archivo | Qué hace |
|---|---|
| `app/lib/size-guide-data.server.ts` | Carga desde la Admin API: todas las `size_guide_rule`, todas las `size_guide` (id + priority), y el contexto de un producto (tags, colecciones, tipo, vendor, título). |
| `app/lib/size-guide-writer.server.ts` | Escribe/borra el metafield `custom.resolved_size_guide` de un producto según el resultado de `resolveSizeGuide` (2.2). Si hay empate (`status: "tie"`), no escribe nada — solo avisa por consola (ver decisión de la 2.2). |
| `app/lib/size-guide-orchestrator.server.ts` | Une las tres piezas: carga datos → `resolveSizeGuide` (2.2, sin cambios) → escribe el resultado. Es la función que llaman los webhooks, y la que reutilizará el recálculo masivo (2.4). |
| `app/routes/webhooks.products.update.tsx` | Webhook `products/update`. |
| `app/routes/webhooks.products.create.tsx` | Webhook `products/create`. |
| `shopify.app.toml` | Se añadieron las 2 suscripciones de webhook. |
| `scripts/deploy-metaobject-definitions.js` | Ampliado (mismo script de la 1.4) para crear también la definición del metafield `custom.resolved_size_guide` en productos — misma decisión de arquitectura: por script, nunca a mano. |

## Por qué se relee el producto en vez de fiarse del payload del webhook

El payload de `products/update`/`products/create` incluye `tags`, pero **no** la lista de colecciones a las que pertenece el producto (eso no viaja en el webhook). Para no mezclar "datos parciales del webhook" con "datos completos vía API" de forma inconsistente, `size-guide-data.server.ts` **siempre relee el producto completo** desde la Admin API usando el `admin_graphql_api_id` del payload — una sola fuente de verdad, siempre actualizada al momento de la llamada, en vez de dos fuentes distintas según el campo.

## Namespace del metafield: `custom`, no `app`

Igual que los metaobjects de la Fase 1 (creados sin prefijo de app), el metafield `resolved_size_guide` se crea en el namespace `custom` — visible y consultable desde el Admin y desde cualquier herramienta externa, sin depender de que la app siga instalada para poder leerlo. El nombre visible en el Admin ("Guía de tallas resuelta") se hereda directamente del script — coherente con el resto del proyecto (etiquetas en español para Marketing, keys en inglés para el código).

## Manejo de errores

- Si el webhook llega sin `admin` (sesión offline no disponible) o sin `admin_graphql_api_id` en el payload: se registra un aviso y se responde `200 OK` sin hacer nada — nunca se devuelve un error 5xx por esto, para no entrar en el bucle de reintentos de Shopify por algo que reintentar no arregla.
- Si falla el recálculo de un producto concreto (error de red, de la API, etc.): se registra el error por consola, pero tampoco se relanza como 5xx — un fallo puntual no debe bloquear los reintentos de Shopify para otros productos, y el producto afectado se recalculará solo en su próximo cambio, o se puede forzar manualmente cuando se implemente el recálculo masivo (2.4).
- Si el resultado es un empate de prioridad (`status: "tie"`): no se escribe nada, solo se avisa por consola — decisión ya tomada en la 2.2, no se resuelve solo.

## Nota de rendimiento, a revisar si el catálogo crece

`recalculateSizeGuideForProduct` carga **todas** las reglas y guías en cada ejecución, sin caché. Para el volumen actual del proyecto (decenas de guías/reglas por tienda, según el inventario de la 0.1) esto es aceptable. Si en el futuro se vuelve un cuello de botella, cachear con invalidación al tocar una regla sería el siguiente paso — anotado aquí para no perderlo de vista, no resuelto en esta tarea.

## Validación realizada (01-sept-2026, contra `coolway-sandbox`)

1. **Script de despliegue ampliado, ejecutado con éxito:**
   ```
   ✅ Creado el metafield "custom.resolved_size_guide" (gid://shopify/MetafieldDefinition/201332785257)
   ```
   Sin errores — confirma que la estructura de `MetafieldDefinitionInput` usada (namespace, key, type, ownerType, y la validación `metaobject_definition_id`) era correcta a la primera. Se retira de la lista de "puntos sin verificar" de la 1.4/2.3 — no hizo falta corregir nada.
2. Las 6 definiciones de metaobject de la 1.4 se confirmaron de nuevo como ya existentes, sin duplicados — la idempotencia sigue intacta tras esta ampliación del script.
3. **Prueba end-to-end del webhook, con `npm run dev` corriendo:** se añadió el tag `football` al producto real "Goal Green Forest" (`gid://shopify/Product/9408182222953`) en `coolway-sandbox`. La terminal registró:
   ```
   Received PRODUCTS_UPDATE webhook for coolway-sandbox.myshopify.com
   [size-guide-writer] gid://shopify/Product/9408182222953 -> gid://shopify/Metaobject/229892849769 (reglas: gid://shopify/Metaobject/229912772713)
   ```
4. **Confirmado en el Admin:** Producto → Metacampos de producto → "Guía de tallas resuelta" = `Size Guide #FOOTBALL` — exactamente la guía de prueba de la 1.1, resuelta a través de la regla ANY de la 1.3 (tag=football), tal como debía.

Flujo completo verificado: cambio de tag → webhook recibido → producto releído vía Admin API → reglas/guías cargadas → motor de resolución (2.2) → metafield escrito con el valor correcto.

## Siguiente paso

2.4 — Recálculo masivo al cambiar una regla: reutilizará `size-guide-orchestrator.server.ts` para reevaluar todos los productos afectados cuando se crea/edita/borra una `size_guide_rule`, en vez de esperar a que cada producto se edite individualmente.
