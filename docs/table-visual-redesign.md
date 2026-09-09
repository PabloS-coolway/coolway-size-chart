# 3.11 — Rediseño visual de la tabla de tallas

Change OpenSpec: `size-guide-table-visual-redesign`.

## Decisión (ver design.md)
Segunda de las 3 tareas de diseño visual, según el orden acordado con el
usuario: 3.13 (modal/overlay, ya cerrada) → 3.11 (tabla) → 3.12 (resto de
bloques + tipografía).

## Implementación
- El `<caption>` se sustituyó por un `<div class="...__table-group">`
  justo antes de la tabla: barra a todo el ancho, fondo `#1a1a1a` (mismo
  color que la cabecera del modal de la 3.13), texto blanco. Mismo dato
  que antes (etiqueta + unidad, incluida la variante de doble unidad).
- Cabeceras de columna (`<th>`): fondo gris claro, mayúsculas, tracking,
  tamaño reducido.
- Zebra striping vía `tbody tr:nth-child(even)` — sin cambios en el
  bucle Liquid.
- Primera celda en negrita vía `td:first-child` — sin marcar nada en el
  bucle.
- Tabla envuelta en `.coolway-size-guide-block__table-wrap` con bordes
  redondeados y `overflow: hidden`, para que la barra de grupo y la
  tabla compartan un contorno único.

## Validación realizada
`theme check` (desde el directorio de la extensión) sin errores.
Validado en vivo en `coolway-sandbox` sobre "Goal Green Forest": la
tabla muestra la barra de grupo oscura con "Calzado adulto (editado)
(CM)", cabeceras "TALLA EU"/"CM" en gris/mayúsculas, zebra visible entre
filas 38/39/40 y la columna de tallas en negrita — confirmado
visualmente. Sin errores de consola. Sin regresión en "Nilo Altitude
Hike" (producto sin guía, bloque sigue vacío y sin trigger).

## Pendiente
3.12 (aviso de ajuste + tipografía general del resto de bloques) y 3.14
(validación visual final y responsive) — siguientes en el orden
acordado.
