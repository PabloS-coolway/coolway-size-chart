# 3.11 — Rediseño visual de la tabla de tallas

## Why
El inventario de gaps visuales (3.10, `docs/visual-design-gap-analysis.md`)
detectó que nuestra tabla de tallas es visualmente plana comparada con la
de Kiwi: sin fila de cabecera de grupo, sin distinción de las cabeceras de
columna, sin zebra striping ni primera columna en negrita. La tabla es el
único bloque presente en el 100% de las 123 guías migradas (0.1), así que
es el elemento con más impacto visual de los tres pendientes (3.11-3.12).

## What Changes
- La cabecera actual (`<caption>` con `block.label` + unidad) se sustituye
  por una barra de grupo con fondo oscuro, a todo el ancho de la tabla,
  que muestra la etiqueta del bloque y la unidad (igual que hoy, mismo
  dato, presentación distinta).
- Las cabeceras de columna (`<th>`) pasan a fondo gris claro, texto en
  mayúsculas con tracking, para diferenciarse claramente del resto.
- Las filas del cuerpo alternan color de fondo (zebra striping).
- La primera celda de cada fila (normalmente la talla) se muestra en
  negrita.
- Espaciado interno de celdas más generoso y bordes de tabla más
  redondeados, en línea con el resto del panel ya rediseñado en 3.13.
- Ningún cambio en el HTML semántico de la tabla más allá de mover el
  contenido del `<caption>` a un elemento visual equivalente — sigue
  siendo la misma estructura `<table>/<thead>/<tbody>`, mismos datos.
- Fuera de alcance: el aviso de ajuste ("fit note") y la tipografía
  general del resto de bloques — eso es 3.12.

## Capabilities
- Added: `size-guide-rendering` (nuevo requisito de estilo visual de la
  tabla, independiente del requisito funcional ya existente de
  "Renderizado de cada tipo de bloque de contenido")

## Impact
- Archivo modificado: `extensions/size-guide-block/blocks/size_guide.liquid`
  (marcado HTML de la cabecera de tabla + CSS).
- Validado exclusivamente en `coolway-sandbox`, nunca en tienda real.
