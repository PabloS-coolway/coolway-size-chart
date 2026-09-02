# Recálculo masivo al cambiar una regla — `app/routes/webhooks.metaobjects.*`

**Tarea:** 2.4 — Recálculo masivo al cambiar una regla
**Estado:** ✅ Completada y verificada de extremo a extremo, incluida la corrección de un problema real de reintentos.
**Fecha:** 01-sept-2026

## El problema que resuelve

El webhook de producto (2.3) solo reacciona cuando **un producto** cambia. Pero si alguien edita una `size_guide_rule` (por ejemplo, cambia el tag de la condición), ningún producto ha cambiado — y sin embargo el resultado de `resolveSizeGuide` para muchos productos puede haber cambiado. Sin este mecanismo, esos productos se quedarían con la guía antigua "congelada" en su metafield, de forma silenciosa.

## Decisión de estrategia: recalcular todo el catálogo, no un subconjunto

Se consideró intentar acotar el recálculo solo a "los productos que coincidían con la condición antigua o la nueva" — pero el payload del webhook de metaobject **no incluye el valor anterior** de los campos, solo el estado actual tras el cambio. Sin el valor antiguo, no hay forma fiable de saber qué productos había que "soltar". **Por eso se recalcula el catálogo completo de la tienda** cada vez que cambia una `size_guide_rule` o una `size_guide` (por su `priority`, que participa en el desempate) — más caro computacionalmente, pero la única forma de garantizar corrección total.

## Piezas

| Archivo | Qué hace |
|---|---|
| `app/lib/size-guide-data.server.ts` (ampliado) | `fetchAllProductContexts` — pagina TODOS los productos de la tienda con su contexto completo en la misma llamada, sin N+1. |
| `app/lib/size-guide-orchestrator.server.ts` (ampliado) | `recalculateAllProducts` — carga reglas y guías **una sola vez**, no una vez por producto, y recorre todo el catálogo. Devuelve un resumen (`BulkRecalculateSummary`) para logging. |
| `app/routes/webhooks.metaobjects.update.tsx` / `.create.tsx` / `.delete.tsx` | Los 3 webhooks — ver "Hallazgo 2" abajo sobre por qué no esperan el resultado antes de responder. |
| `shopify.app.toml` | 6 suscripciones (2 por topic, una filtrada a `size_guide_rule` y otra a `size_guide`). |

## Hallazgo 1: Shopify exige un `filter` en las suscripciones de metaobjects

A diferencia de `products/update` (2.3), `shopify app deploy` rechazó la configuración inicial:
```
error: Version couldn't be created.
  • The webhook topic (metaobjects/create) requires a valid filter
  • The webhook topic (metaobjects/delete) requires a valid filter
  • The webhook topic (metaobjects/update) requires a valid filter
```
Esto confirmó que los 3 nombres de topic son correctos, y que hace falta `filter = "type:<tipo>"`. Como necesitábamos cubrir 2 tipos, se declararon 2 suscripciones por topic (6 en total). `npm run deploy` con esta corrección se ejecutó con éxito (`coolway-size-chart-2`) — la sintaxis `type:size_guide_rule` / `type:size_guide` es correcta a la primera.

De paso se detectó y corrigió: el campo `include_config_on_deploy` en `shopify.app.toml` ya no está soportado por la versión actual del CLI (aviso informativo del propio `deploy`) — eliminado del fichero.

**Forma real del payload, confirmada en la prueba:** el campo `type` viene en la raíz del payload (`{"type":"size_guide_rule", "fields": {...}, ...}`), tal como se había estimado.

## Hallazgo 2 (crítico): esperar el recálculo antes de responder provoca reintentos de Shopify

En la primera prueba real (editar la regla de prueba y guardar), el log mostró **dos recálculos completos de 728 productos** en vez de uno, con un segundo "Received METAOBJECTS_UPDATE webhook" llegando pocos segundos después del primero, sin que Juanmi hubiera vuelto a guardar nada.

**Causa:** el handler original hacía `await recalculateAllProducts(admin)` antes de devolver la respuesta. Con 728 productos (cada uno con al menos una llamada GraphQL para escribir/borrar su metafield), el recálculo completo tarda más de un minuto — muy por encima de lo que Shopify espera para considerar entregado un webhook. Shopify interpreta la tardanza como un fallo y **reintenta la entrega**, lo que dispara otro recálculo completo encima del que ya estaba en marcha.

**Corrección aplicada:** los 3 handlers ya **no esperan** (`await`) el resultado de `recalculateAllProducts` antes de responder — devuelven `200 OK` de inmediato, y el recálculo sigue corriendo en segundo plano en el mismo proceso de Node (la app no es serverless, así que el proceso sigue vivo y termina el trabajo con normalidad). El resultado se sigue registrando por consola (`.then()`/`.catch()`), solo que después de haber respondido a Shopify.

**Nota para vigilar en producción:** esto asume que el proceso de Node de la app no se reinicia ni se apaga entre medias del recálculo en segundo plano (cierto en un servidor persistente; **no sería cierto en un entorno serverless/con autoscaling agresivo**, donde el proceso podría matarse justo después de responder, cortando el recálculo a medias). Si en el futuro se despliega en una infraestructura serverless, este patrón "fire-and-forget" habría que sustituirlo por una cola de trabajos real.

## Resultado de la prueba final (tras la corrección)

Se repitió la prueba cambiando el tag de la regla de vuelta a `football`: **un solo** `Received METAOBJECTS_UPDATE webhook`, **un solo** recálculo masivo completo — sin reintentos ni repeticiones. Resultado: `728 productos (1 resuelto, 727 sin guía, 0 empates)` — el único producto con el tag `football` ("Goal Green Forest") resolvió correctamente a la guía de prueba, el resto quedó sin guía aplicable, tal como corresponde.

Después del recálculo masivo se ve, como es esperado, un `PRODUCTS_UPDATE` normal (2.3) para ese mismo producto — reacciona a que su propio metafield cambió, recalcula ese único producto, llega al mismo resultado, y no genera ningún recálculo masivo nuevo. No es un bucle: son dos mecanismos independientes (2.3 y 2.4) coexistiendo sin pisarse, confirmado en la práctica.

(Prueba anterior, antes de la corrección, con el tag puesto a `soccer` que ningún producto tiene: `728 productos, 0 resueltos, 728 sin guía, 0 empates` — el resultado en sí también fue correcto, solo se ejecutó varias veces de forma redundante por los reintentos de Shopify ya corregidos.)

## Manejo de errores

- Si falla el recálculo de un producto concreto dentro del bucle: se registra el error y se continúa con el resto.
- Los empates de prioridad (`status: "tie"`) se acumulan en el resumen final y se listan por consola como aviso — nunca se resuelven solos.

## Pendiente

Ninguno bloqueante. Como nota de rendimiento a futuro (no resuelta en esta tarea): si el catálogo de alguna tienda crece mucho, procesar los productos en lotes paralelos (con límite de concurrencia) sería más rápido que el bucle secuencial actual — no necesario con los volúmenes actuales del proyecto (documentados en la 0.1).

## Siguiente paso

2.6 — Webhooks obligatorios de cumplimiento (GDPR), o retomar la 2.9 (decisiones pendientes del diseño del panel) según se prefiera priorizar.
