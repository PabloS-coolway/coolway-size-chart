# 3.13 — Pulido del modal/overlay

Change OpenSpec: `size-guide-modal-visual-polish`.

## Decisión (ver design.md)
Primera de las 3 tareas de diseño visual (3.11-3.13), hecha primero según
la prioridad sugerida en la 3.10 (más impacto visual, menos esfuerzo).

## Implementación
- Cabecera propia dentro del panel: fondo oscuro (`#1a1a1a`), título con
  `product.title`, subtítulo con `'general.block_name' | t` (clave ya
  existente, reutilizada sin añadir nada nuevo a los locales).
- Botón de cierre integrado como hijo flex de la cabecera (antes,
  posicionamiento absoluto suelto sobre el panel).
- Backdrop con `backdrop-filter: blur(4px)` y fondo algo más oscuro.
- Esquinas del panel más redondeadas (8px) y padding movido al
  contenedor interior de contenido.

## Validación realizada
`theme check` sin errores (ejecutado desde el directorio de la
extensión). Validado en vivo en `coolway-sandbox` sobre "Goal Green
Forest": modal abre con la nueva cabecera y blur visible; cierre con
Escape funciona igual que antes (foco vuelve al enlace); sin errores de
consola. Sin regresión en "Nilo Altitude Hike" (sin guía, bloque vacío).

## Pendiente
Estilos de la tabla (3.11) y del resto de bloques de contenido (3.12) —
siguiente en el orden acordado.
