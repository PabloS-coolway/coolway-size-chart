# Tarea 3.2 — Estructura base del App Block (Liquid)

Change OpenSpec: `openspec/changes/size-guide-app-block-base/`

## Qué se construyó

`extensions/size-guide-block/blocks/size_guide.liquid` sustituye por completo
el placeholder de ejemplo (`star_rating`) heredado del scaffold. En esta
tarea el bloque:

- Comprueba `product.metafields.custom.resolved_size_guide` (escrito por el
  backend en la Fase 2 — el bloque nunca evalúa reglas de asignación).
- Si existe, renderiza un placeholder de texto ("Guía de tallas", sin modal
  ni JS todavía).
- Si no existe, no renderiza nada visible y no ocupa espacio en el layout.
- Mantiene `"target": "section"` en el schema — es el tipo correcto para
  insertarse dentro de la lista de bloques de `main-product.liquid`, junto
  al selector de variantes (confirmado con `"blocks": [{"type": "@app"}]`
  en las 14 tiendas desde la tarea 0.6). Se descartó un app embed block
  porque no permite reordenarlo junto al selector.
- Se eliminaron `snippets/stars.liquid`, `assets/thumbs-up.png` y las claves
  `ratings.*` del locale (restos del ejemplo).

## Qué se validó, y cómo

Validado en `coolway-sandbox` (tema `Horizon` por defecto) con
`shopify app dev`, en dos productos reales:

- **"Goal Green Forest"** (tag `football`, tiene `resolved_size_guide`
  desde las pruebas de la Fase 2): el enlace "Guía de tallas" aparece junto
  al selector de variantes. No hace nada al clicar todavía — esperado, el
  modal es una tarea posterior.
- **"Nilo Altitude Hike"** (sin `resolved_size_guide`): no aparece ningún
  enlace ni hueco vacío en el PDP.

## Hallazgos reales durante la validación

1. **Shopify envuelve cada App Block en un contenedor propio**, con clase
   fija `shopify-block shopify-app-block` (confirmado con el DOM real:
   `<div id="shopify-block-..." class="shopify-block shopify-app-block"
   data-block-handle="size_guide" ...>`), independientemente de lo que el
   `.liquid` del bloque renderice dentro. Al principio se colapsó solo el
   `<div>` interno propio con CSS `:empty { display: none; }`, lo cual era
   insuficiente: el contenedor de Shopify seguía reservando su espacio en
   la sección aunque quedara vacío por dentro — el bug se veía como "un
   hueco en blanco donde debería ir el bloque, en productos sin guía".
   **Fix definitivo:** usar el selector relacional CSS `:has()` para
   colapsar el propio contenedor de Shopify:
   ```css
   .shopify-block:has(> .coolway-size-guide-block:empty) {
     display: none;
   }
   ```
2. **`{% stylesheet %}` no está permitido dentro de blocks de Theme App
   Extension** — solo en secciones de tema. `shopify app dev`/`theme check`
   lo rechaza con `AppBlockValidTags: Theme app extension blocks cannot
   contain 'stylesheet' tags`. El CSS del bloque va en un `<style>` inline
   normal, único mecanismo válido aquí.
3. Antes de poder levantar `shopify app dev` limpio hubo que cerrar 4
   procesos huérfanos en la máquina de Juanmi (uno ocupando el puerto 9293,
   otros tres bloqueando el motor de Prisma con un `EPERM` al regenerar
   `query_engine-windows.dll.node`) — mismo patrón de incidente ya
   documentado en el archivo de la Fase 1
   (`openspec/changes/archive/2026-08-12-size-guide-metaobjects-baseline/`):
   un dev server o proceso Node abierto en otra terminal bloquea ficheros
   que el nuevo `npm run dev` necesita tocar.

## Fuera de alcance de esta tarea (queda para subtareas posteriores de la Fase 3)

Contenido real de la guía vía Storefront API (3.3), renderizado por tipo de
bloque (3.4), el modal y su JS, soporte RTL (3.7), traducciones del bloque
(3.8), auto-selección de unidad (3.6), y cualquier instalación o prueba
contra una tienda real (Fase 5).
