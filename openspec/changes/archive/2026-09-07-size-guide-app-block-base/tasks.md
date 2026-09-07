## 1. Limpieza del ejemplo star_rating (3.2.1)

- [x] 1.1 Eliminar `extensions/size-guide-block/snippets/stars.liquid`
- [x] 1.2 Eliminar `extensions/size-guide-block/assets/thumbs-up.png`
- [x] 1.3 Quitar las claves `ratings.*` de `extensions/size-guide-block/locales/en.default.json` (el ejemplo `star_rating` ya no aplica; las claves reales del bloque se añaden en la 3.8)

## 2. Esqueleto del bloque (3.2.2)

- [x] 2.1 Reescribir el `{% schema %}` de `size_guide.liquid`: mantener `"target": "section"`, quitar el setting `product` (autofill) y `colour` heredados del ejemplo, dejar solo `"name": "Guía de tallas"`
- [x] 2.2 Añadir la comprobación `{% if product.metafields.custom.resolved_size_guide %}` alrededor de todo el contenido del bloque
- [x] 2.3 Dentro del `if`, renderizar un placeholder visual simple (texto/enlace "Guía de tallas", sin modal ni JS) que permita verificar visualmente que el bloque se coloca en el sitio correcto
- [x] 2.4 Fuera del `if` (rama "sin guía"), no renderizar nada — verificar que no queda ningún hueco ni error de Liquid visible

## 3. Validación en coolway-sandbox (3.2.3)

- [x] 3.1 `shopify app dev` contra `coolway-sandbox`, confirmar que el bloque sigue apareciendo en el editor de temas como "Guía de tallas" tras el cambio de schema
- [x] 3.2 Añadir el bloque dentro de la sección de producto, junto al selector de variantes, en un producto CON `resolved_size_guide` ("Goal Green Forest", tag `football`) — confirmado por Juanmi: aparece el enlace "Guía de tallas" (sin funcionalidad todavía, no da error al clicar — esperado)
- [x] 3.3 Repetir en un producto SIN `resolved_size_guide` ("Nilo Altitude Hike") — confirmado por Juanmi tras 2 iteraciones de fix: ya no aparece el enlace ni el hueco vacío
- [x] 3.4 Documentado el resultado en `docs/app-block-base.md`: qué se construyó, qué se validó, y los 3 hallazgos reales (contenedor `.shopify-block` de Shopify, `{% stylesheet %}` no permitido en app blocks, procesos huérfanos bloqueando el puerto/Prisma)

**Nota 1 (07-sept-2026):** antes de poder levantar `shopify app dev` limpio hubo que cerrar 4 procesos huérfanos en la máquina de Juanmi que bloqueaban el puerto 9293 y el motor de Prisma (`EPERM` al regenerar `query_engine-windows.dll.node`) — mismo patrón de incidente ya documentado en `openspec/changes/archive/2026-08-12-size-guide-metaobjects-baseline/`.

**Nota 2 — primer intento de fix del hueco vacío (insuficiente):** en un producto sin `resolved_size_guide`, el bloque no renderizaba el enlace pero SÍ dejaba un hueco vacío en el PDP. Primer intento: emitir siempre `<div class="coolway-size-guide-block">` como raíz y colapsarlo con CSS `:empty { display: none; }`. Insuficiente — ver nota 3.

**Nota 3 — causa real y fix definitivo (07-sept-2026), confirmado con el DOM real y validado visualmente por Juanmi:** Shopify envuelve SIEMPRE este bloque en un contenedor propio, `<div class="shopify-block shopify-app-block" ...>`, independiente de lo que `size_guide.liquid` renderice dentro — ese contenedor es el que reservaba el hueco. Corregido con `.shopify-block:has(> .coolway-size-guide-block:empty) { display: none; }`. Confirmado: el hueco ya no aparece.

**Nota aparte:** el intento inicial de usar `{% stylesheet %}` (como en secciones de tema) falló — `theme check`/`shopify app dev` lo rechaza en blocks de Theme App Extension con "Theme app extension blocks cannot contain 'stylesheet' tags". Corregido usando `<style>` inline normal.

## 4. Estado final

Todas las tareas de la 3.2 completadas y validadas en `coolway-sandbox`. Change lista para archivar en OpenSpec.
