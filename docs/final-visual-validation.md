# 3.14 — Validación visual final y responsive

Change OpenSpec: `size-guide-final-visual-validation` (archivada).

## Contexto
Última tarea de la fase de diseño visual (3.10-3.14). Cierra las 3
tareas anteriores (3.11 tabla, 3.12 fit note/tipografía, 3.13 modal)
comprobándolas juntas y, sobre todo, en **móvil** — ningún viewport
pequeño se había probado hasta ahora.

## Limitación de entorno
El redimensionado real de ventana (`resize_window` de Claude in Chrome)
no tuvo efecto en este entorno (la ventana permanece maximizada pese a
reportar éxito). Validación responsive hecha de forma pragmática:
forzando el ancho del panel del modal a ~340px (equivalente al ancho
real disponible en un viewport de ~375-414px, dado el `width: 90%` del
panel) e inyectando columnas extra en la tabla para simular una guía
real de muchas columnas (Dubai FEET/INCHES, India SIZE/LENGTH/WIDTH/
UK/JAP), en vez de una emulación real de dispositivo.

## Bug encontrado y corregido: tabla ancha se recortaba sin scroll
Con ese panel estrecho simulado y una tabla de 7 columnas (2 reales +
5 inyectadas), se confirmó que `.coolway-size-guide-block__table-wrap`
usaba `overflow: hidden` — el contenido que no cabía se recortaba
silenciosamente, sin ninguna forma de verlo (`scrollWidth` 548-570px
contra `clientWidth` 290px).

**Fix:** se introdujo un contenedor intermedio
`.coolway-size-guide-block__table-scroll` (solo alrededor de `<table>`,
no de la barra de grupo) con `overflow-x: auto` y la tabla con
`min-width: max-content` (para que las columnas no se compriman de
forma ilegible en vez de activar el scroll). El contenedor exterior
(`table-wrap`, bordes redondeados) se mantiene con `overflow: hidden`,
pero ya no necesita recortar nada porque el scroll ocurre dentro.

También se añadió una media query (`max-width: 480px`) para ajustar el
ancho del panel (95% en vez de 90%) y el padding del contenido en
móvil, ajuste menor de aprovechamiento de espacio.

## Validación realizada
`theme check` sin errores. Confirmado tras el fix: la tabla con 7
columnas ahora muestra una barra de scroll horizontal visible y
funcional dentro del panel estrecho, sin recortar ninguna columna, en
LTR y en RTL (scroll en espejo, orden de columnas invertido
correctamente). Sin errores de consola. Sin regresión en "Nilo Altitude
Hike" (sin guía). Repaso conjunto en desktop de las 3 tareas de diseño
visual (3.11/3.12/3.13) sin solapamientos ni regresiones cruzadas.

## Cierre de la fase de diseño visual
Con esto se cierran las 5 tareas 3.10-3.14. La Fase 3 (storefront)
queda completa, incluido el diseño visual. Siguiente: Fase 2 revisitada
(2.12, 2.13, 2.14 — paridad de configuración del panel admin con Kiwi).
