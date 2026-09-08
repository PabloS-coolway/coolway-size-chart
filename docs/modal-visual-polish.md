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

## Bug encontrado tras la primera validación y fix (mismo 3.13)
El usuario detectó que el fondo oscuro/blur no cubría el menú/header del
tema (visible por encima del overlay). Change OpenSpec adicional:
`size-guide-modal-stacking-fix`.

**Causa raíz:** el bloque vive dentro de `.product-details.sticky-content--desktop`
(`position: sticky`, `z-index: 1`), que crea su propio contexto de
apilamiento CSS. Cualquier `z-index` interno, por alto que sea, solo se
compara contra hermanos dentro de ese contexto; visto desde fuera, todo
el subárbol se compara usando el `z-index` del ancestro (1), que pierde
frente al header del tema (`z-index: 18`). Confirmado empíricamente con
`document.elementFromPoint(x, y)` en varios puntos de la cabecera.

**Fix:** al abrir el modal por primera vez, se mueve su nodo a
`document.body` (`document.body.appendChild(modal)`), con guarda
(`if (modal.parentElement !== document.body)`) para no duplicar en
aperturas siguientes. Z-index reforzado de `1000` a `999999` como
medida defensiva adicional.

**Validación:** en `coolway-sandbox` sobre "Goal Green Forest",
`elementFromPoint` sobre el header ahora devuelve el backdrop propio;
captura visual confirma el header atenuado/blureado igual que el resto
de la página; cierre con Escape y reapertura funcionan sin duplicar el
nodo del modal (`parentElement === document.body`, un único nodo en el
DOM); sin errores de consola; sin regresión en "Nilo Altitude Hike".

## Pendiente
Estilos de la tabla (3.11) y del resto de bloques de contenido (3.12) —
siguiente en el orden acordado.
