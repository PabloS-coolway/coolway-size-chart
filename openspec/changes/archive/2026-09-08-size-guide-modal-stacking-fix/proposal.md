# Fix: el fondo oscuro del modal no cubría el header (3.13, bug real)

## Why
Juanmi reportó en vivo que el fondo oscuro/blur del modal (recién cerrado
en la 3.13) no cubría el menú/header del tema — se quedaba brillante y
sin desenfocar mientras el resto de la página sí se oscurecía. Bug real
encontrado antes de dar la 3.13 por cerrada del todo.

## Why (causa raíz confirmada)
El bloque vive dentro de `.product-details.sticky-content--desktop`
(position: sticky, z-index: 1) del tema — ese contenedor crea su propio
contexto de apilamiento CSS. Nuestro modal, aunque tiene `z-index: 1000`
(ahora 999999), queda "atrapado" dentro de ese contexto: desde fuera,
todo el subárbol se compara al nivel del contenedor (z-index: 1), que
pierde contra el header del tema (z-index: 18) — confirmado con
`elementFromPoint` sobre la zona del header antes y después del fix.

## What Changes
- El script del bloque mueve el nodo del modal a `document.body` la
  primera vez que se abre (`document.body.appendChild(modal)`), para que
  quede fuera de cualquier contexto de apilamiento de contenedores del
  tema.
- `z-index` del modal subido de 1000 a 999999 como refuerzo defensivo.
- Sin cambios de comportamiento: mismo modal, misma apertura/cierre,
  mismo contenido — solo dónde vive el nodo en el DOM.

## Capabilities
- Modified: `size-guide-rendering` (refuerza el requisito de la 3.13:
  el modal SHALL cubrir toda la página, incluido el header del tema)

## Impact
- `extensions/size-guide-block/blocks/size_guide.liquid`.
- Validado en `coolway-sandbox` únicamente.
