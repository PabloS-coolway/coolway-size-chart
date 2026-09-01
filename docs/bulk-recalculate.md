# Recálculo masivo al cambiar una regla — `app/routes/webhooks.metaobjects.*`

**Tarea:** 2.4 — Recálculo masivo al cambiar una regla
**Estado:** ⚠️ Código escrito — pendiente de probar contra `coolway-sandbox` (necesita disparar webhooks de metaobject reales, algo que no se pudo simular desde este entorno).
**Fecha:** 01-sept-2026

## El problema que resuelve

El webhook de producto (2.3) solo reacciona cuando **un producto** cambia. Pero si alguien edita una `size_guide_rule` (por ejemplo, cambia el tag de la condición de "football" a "soccer"), ningún producto ha cambiado — y sin embargo el resultado de `resolveSizeGuide` para muchos productos puede haber cambiado. Sin este mecanismo, esos productos se quedarían con la guía antigua "congelada" en su metafield, de forma silenciosa.

## Decisión de estrategia: recalcular todo el catálogo, no un subconjunto

Se consideró intentar acotar el recálculo solo a "los productos que coincidían con la condición antigua o la nueva" — pero el payload del webhook de metaobject **no incluye el valor anterior** de los campos, solo el estado actual tras el cambio. Sin el valor antiguo, no hay forma fiable de saber qué productos había que "soltar" (los que coincidían con la condición vieja y ya no coinciden con la nueva). Intentar acotar el recálculo sin esa información arriesga precisamente lo que el criterio de aceptación de la 2.4 prohíbe: dejar productos con la guía antigua congelada.

**Por eso se recalcula el catálogo completo de la tienda** cada vez que cambia una `size_guide_rule` o una `size_guide` — más caro computacionalmente, pero la única forma de garantizar corrección total.

## Por qué también reacciona a cambios en `size_guide` (no solo en `size_guide_rule`)

`size_guide.priority` participa en el desempate cuando varias guías coinciden a la vez (ver 2.2). Cambiar la prioridad de una guía puede cambiar qué guía gana ese desempate, sin que ninguna regla ni ningún producto hayan cambiado. Por eso `RELEVANT_METAOBJECT_TYPES` en los 3 webhooks incluye ambos tipos — pero **no** los 4 `size_guide_block_*` (cambiar el contenido de un bloque de texto o una imagen no afecta a qué guía se resuelve, solo a qué se muestra una vez resuelta).

## Piezas nuevas

| Archivo | Qué hace |
|---|---|
| `app/lib/size-guide-data.server.ts` (ampliado) | Nueva función `fetchAllProductContexts` — pagina TODOS los productos de la tienda con su contexto completo (tags, colecciones, tipo, vendor, título) en la misma llamada, sin N+1. |
| `app/lib/size-guide-orchestrator.server.ts` (ampliado) | Nueva función `recalculateAllProducts` — carga reglas y guías **una sola vez**, no una vez por producto, y recorre todo el catálogo aplicando `resolveSizeGuide` + `applyResolutionToProduct` a cada uno. Devuelve un resumen (`BulkRecalculateSummary`) con contadores de resueltos/sin match/empates, para logging. |
| `app/routes/webhooks.metaobjects.update.tsx` | Webhook `metaobjects/update`, filtra por tipo (`size_guide_rule`/`size_guide`) dentro del propio handler. |
| `app/routes/webhooks.metaobjects.create.tsx` | Igual, para `metaobjects/create` (una regla nueva puede empezar a afectar a productos que no han cambiado). |
| `app/routes/webhooks.metaobjects.delete.tsx` | Igual, para `metaobjects/delete` (borrar una regla puede "liberar" productos). |
| `shopify.app.toml` | 3 suscripciones nuevas. |

## ⚠️ Puntos sin verificar (mayor incertidumbre que en tareas anteriores)

A diferencia del metafield de la 2.3 (que funcionó a la primera), aquí hay más cosas sin confirmar contra el schema real de Shopify:

1. **Nombre exacto de los topics** — se usa `metaobjects/update`, `metaobjects/create`, `metaobjects/delete` como mejor estimación. Es posible que Shopify no ofrezca webhooks genéricos de metaobject para todos los tipos, o que use un nombre distinto.
2. **Forma del payload** — no se sabe con certeza en qué campo viene el `type` del metaobject actualizado (¿`type`? ¿`definition_type`? ¿anidado en otro objeto?). El código de `extractMetaobjectType` prueba varios nombres candidatos, y **cada handler imprime el payload completo por consola** (`console.log(JSON.stringify(payload))` en el de `update`) precisamente para poder ver la forma real en el primer disparo de prueba y corregir el código si hace falta.
3. **Si Shopify permite filtrar la suscripción por tipo de metaobject** a nivel de `shopify.app.toml` (con un campo `filter`, como existe para otros webhooks) — no se ha intentado, se filtra siempre dentro del handler por seguridad, así que aunque el filtro a nivel de suscripción no exista o no funcione, el comportamiento sigue siendo correcto (solo más tráfico de webhooks descartados de inmediato).

**Si el primer despliegue de prueba falla o no se recibe ningún webhook al editar una regla real, revisar estos 3 puntos con el Shopify Dev MCP antes de asumir un bug de lógica.**

## Rendimiento y coste

`recalculateAllProducts` recorre **todo** el catálogo de la tienda en cada disparo. Para el volumen documentado en la 0.1 (unos cientos de productos por tienda, 6.860 en total repartidos entre 14) esto es asumible como operación puntual (se dispara solo cuando alguien edita una regla o guía, no en cada visita de cliente), pero no es instantáneo — con catálogos grandes puede tardar bastante en escribir el metafield de cada producto uno a uno. **No implementado en esta tarea, pendiente si se detecta que hace falta:** procesar en lotes en paralelo (con límite de concurrencia) en vez de secuencialmente, o mover el recálculo a un job en background en vez de dentro del propio webhook.

## Manejo de errores

- Si el metaobject actualizado no es `size_guide_rule` ni `size_guide` (incluye el metaobject "Example" del CLI, y los 4 `size_guide_block_*`): se ignora sin hacer nada, respondiendo `200 OK` de inmediato.
- Si falla el recálculo de un producto concreto dentro del bucle: se registra el error y se continúa con el resto — un fallo puntual no debe abortar el recálculo de todo el catálogo.
- Los empates de prioridad (`status: "tie"`) se acumulan en el resumen final y se listan por consola como aviso — igual que en la 2.2/2.3, nunca se resuelven solos.

## Pendiente de validar por Juanmi

1. Ejecutar `npm run dev` con el túnel activo, y en el Admin de `coolway-sandbox` editar la regla de prueba "ANY" (por ejemplo, cambiar la condición de tag) — comprobar en la terminal si aparece `Received METAOBJECTS_UPDATE webhook` (o el nombre real que use Shopify).
2. **Si no aparece nada:** el topic o el nombre del webhook puede no existir tal cual — revisar con el Shopify Dev MCP qué webhooks admite Shopify para metaobjects, y corregir `shopify.app.toml` y los 3 archivos de ruta según corresponda.
3. **Si aparece pero con un `type` distinto al esperado en el log del payload:** ajustar `extractMetaobjectType` en los 3 archivos para leer el campo correcto.
4. Una vez funcione, comprobar que el metafield `resolved_size_guide` del producto de prueba sigue correcto tras el cambio de regla, y que el log muestra el resumen (`X productos, Y resueltos, Z sin match, W empates`).

## Siguiente paso

2.6 — Webhooks obligatorios de cumplimiento (GDPR), o retomar la 2.9 (decisiones pendientes del diseño del panel) según se prefiera priorizar.
