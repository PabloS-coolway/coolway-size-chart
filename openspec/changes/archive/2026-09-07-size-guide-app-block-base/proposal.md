## Why

El bloque de tema (`extensions/size-guide-block/blocks/size_guide.liquid`) sigue siendo, literalmente, el placeholder `star_rating` generado por el scaffold del CLI de Shopify: renombrado a "Guía de tallas" pero sin ninguna lógica real (renderiza estrellas y un `avg_rating` de ejemplo). El motor de resolución de reglas (Fase 2) ya escribe qué guía corresponde a cada producto en el metafield `product.metafields.custom.resolved_size_guide`, pero nada en el storefront lo lee todavía. Sin esta change, el App Block no puede ni siquiera colocarse correctamente en el PDP junto al selector de variantes (decisión de UX ya cerrada en la tarea 3.1 — modo "Link modal"), que es el primer paso obligatorio antes de renderizar contenido real (tareas 3.3/3.4).

## What Changes

- Sustituir el contenido de ejemplo de `size_guide.liquid` (estrellas, `avg_rating`, color) por un esqueleto real del bloque de guía de tallas: sin renderizado de bloques de contenido todavía (eso es 3.3/3.4), pero con la lectura de `product.metafields.custom.resolved_size_guide` y el manejo explícito de su ausencia.
- Corregir el `target` del schema del bloque: de `"section"` (heredado del ejemplo, pensado para insertarse como sección suelta) a un app block embebible en el bloque de variantes del PDP, coherente con la decisión "Link modal" de la 3.1 (enlace junto al selector de variantes, no una sección aparte).
- Placeholder visual mínimo (el texto "Guía de tallas" como enlace, sin modal ni JS todavía) que permita verificar en el editor de temas de `coolway-sandbox` que el bloque aparece y se coloca en el sitio correcto.
- Eliminar los restos del ejemplo `star_rating` que ya no aplican: `snippets/stars.liquid` y `assets/thumbs-up.png`.
- **Fuera de alcance de esta change** (explícitamente, para no solaparse con subtareas posteriores de la Fase 3): traer el contenido real de la guía vía Storefront API (3.3), renderizar cada tipo de bloque (3.4), el modal y su JS, soporte RTL (3.7), traducciones del bloque (3.8), auto-selección de unidad por geolocalización (3.6), y cualquier instalación o prueba contra una tienda real (Fase 5) — todo el trabajo y las pruebas de esta change ocurren únicamente en local y contra `coolway-sandbox` vía `shopify app dev`.

## Capabilities

### New Capabilities
- `size-guide-rendering`: estructura base del App Block de Theme App Extension que renderiza la guía de tallas en el PDP — en esta change, solo su esqueleto (colocación correcta + lectura de la señal de "producto con guía resuelta"), sin contenido todavía.

### Modified Capabilities
(ninguna — `size-guide-metaobjects` no cambia; esta capability nueva consume su modelo de datos sin alterarlo)

## Impact

- `extensions/size-guide-block/blocks/size_guide.liquid` — reescrito.
- `extensions/size-guide-block/snippets/stars.liquid` — eliminado (ya no se usa).
- `extensions/size-guide-block/assets/thumbs-up.png` — eliminado (ya no se usa).
- `extensions/size-guide-block/locales/en.default.json` — limpieza de las claves `ratings.*` del ejemplo (las claves reales del bloque llegan en la 3.8).
- Sin cambios en el backend (`app/lib/*`, webhooks, metaobjects) ni en la tienda `coolway-sandbox` fuera de instalar/probar la extensión vía `shopify app dev`.
- Nota aparte, no bloqueante para esta change: se detectó que `shopify.app.toml` tiene `api_version = "2026-10"` en `[webhooks]`, mientras que `app/shopify.server.ts` sigue pineado en `ApiVersion.July26` (2026-07) — el propio `CLAUDE.md` del repo documentaba esta discrepancia como ya corregida el 12-ago-2026. Parece haber vuelto a divergir; queda para que el equipo lo revise fuera de esta change, no se toca aquí.
