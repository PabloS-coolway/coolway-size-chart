# 3.10 — Inventario y comparativa visual con Kiwi

Change OpenSpec: `size-guide-visual-gap-analysis`.

## Referencia real
Widget de Kiwi visto en vivo en producción, `coolway.com/products/2003-dbr-men`
(08-sept-2026) — no capturas antiguas de la 2.9, sino el widget real
actual, con datos reales. Comparado contra el modal actual de nuestro
bloque (`extensions/size-guide-block/blocks/size_guide.liquid`, tal como
quedó tras la 3.6-bis/3.7/3.8) sobre "Goal Green Forest" en
`coolway-sandbox`.

## Gaps detectados

1. **Fondo del modal.** Kiwi: overlay oscuro semitransparente con
   desenfoque (blur) del contenido de fondo. Nuestro modal: overlay negro
   plano al 50% de opacidad, sin blur.
2. **Cabecera del modal.** Kiwi: barra de cabecera con fondo oscuro
   degradado, título del producto + subtítulo "Guía de tallas" en dos
   líneas, botón "×" blanco alineado a la derecha dentro de esa barra.
   Nuestro modal: sin cabecera diferenciada, el botón "×" flota suelto
   arriba a la derecha del panel, sin fondo ni contraste propio.
3. **Aviso de ajuste ("fit note").** Kiwi: caja gris clara con borde de
   acento a la izquierda, encima de la tabla ("Small fit, we recommend
   one size up"). Nosotros: no existe ningún elemento equivalente — el
   bloque de texto (si lo hay) se renderiza suelto, sin ese tratamiento
   visual de aviso destacado.
4. **Tabla.** Kiwi: fila de cabecera de grupo oscura ("MEN") que ocupa
   todo el ancho, debajo cabeceras de columna en gris/mayúsculas
   (EU/US/UK/CM), filas con alternancia sutil de color (zebra), primera
   columna en negrita. Nosotros: tabla con `<caption>`/`<th>` planos, sin
   fila de grupo, sin zebra, sin la jerarquía tipográfica cabecera/celda
   de Kiwi.
5. **Espaciado y bordes.** Kiwi: modal centrado con esquinas redondeadas,
   padding generoso, ancho fijo cómodo en desktop. Nosotros: panel más
   estrecho, esquinas ligeramente redondeadas (4px), padding menor.
6. **Tipografía.** Kiwi usa una jerarquía tipográfica más marcada (título
   más grande, cabeceras de tabla en mayúsculas con tracking). Nosotros
   heredamos la tipografía base del tema sin ningún ajuste propio.

## Qué NO se toca en este inventario
Ningún cambio de código en esta tarea — es solo el listado de diferencias
que alimenta directamente las tareas 3.11 (tabla), 3.12 (resto de
bloques) y 3.13 (modal/overlay).

## Prioridad sugerida para 3.11-3.13
Por impacto visual y esfuerzo, el orden más rentable es: cabecera del
modal + overlay con blur (3.13, cambio pequeño y muy visible) → estilos
de tabla con zebra y fila de grupo (3.11, es el bloque presente en el
100% de las guías) → aviso de ajuste como variante de bloque texto y
tipografía general (3.12).
