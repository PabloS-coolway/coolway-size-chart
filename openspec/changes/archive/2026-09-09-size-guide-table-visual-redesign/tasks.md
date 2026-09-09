# Tasks — 3.11 Rediseño visual de la tabla de tallas

## Implementación
- [ ] Sustituir `<caption>` por un `<div class="coolway-size-guide-block__table-group">`
      justo antes de `<table>`, con la misma etiqueta + unidad que hoy.
- [ ] Estilo de la barra de grupo: fondo `#1a1a1a`, texto blanco, padding
      generoso, esquinas superiores redondeadas a juego con el panel.
- [ ] Estilo de `<th>`: fondo gris claro, `text-transform: uppercase`,
      `letter-spacing`, tamaño de fuente reducido.
- [ ] Zebra striping: `tbody tr:nth-child(even)` con fondo gris muy claro.
- [ ] Primera celda en negrita: `td:first-child` (y `th:first-child` ya
      es parte de la cabecera, sin cambio adicional).
- [ ] Padding de celdas más generoso, bordes de tabla redondeados en las
      esquinas exteriores.
- [ ] `theme check` desde `extensions/size-guide-block` sin errores.

## Validación en `coolway-sandbox` (nunca en tienda real)
- [ ] Validar visualmente sobre "Goal Green Forest" (tabla simple).
- [ ] Validar sobre una tabla con `has_dual_unit_selector` (confirmar que
      la barra de grupo sigue mostrando ambas unidades igual que hoy).
- [ ] Confirmar sin regresión en "Nilo Altitude Hike" (sin guía, bloque
      vacío).
- [ ] Confirmar sin regresión visual en RTL (forzando `dir="rtl"` como en
      la validación de 3.7).
- [ ] Sin errores de consola.
