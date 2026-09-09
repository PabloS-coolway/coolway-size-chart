# 3.12 — Aviso de ajuste (fit note) y tipografía general

Change OpenSpec: `size-guide-content-visual-polish` (archivada).

## Decisión (ver design.md)
Tercera y última de las tareas de diseño visual sobre contenido
(3.13 → 3.11 → 3.12). Se reutiliza `resolved_guide.description` (ya
existente) como el "fit note" de Kiwi, sin crear ningún campo nuevo en
el modelo de datos — ocupa exactamente la misma posición (encima del
resto del contenido).

## Implementación
- `.coolway-size-guide-block__description`: fondo gris claro, borde de
  acento a la izquierda (`#1a1a1a`, a juego con cabecera/tabla),
  padding, esquinas redondeadas.
- Margen inferior uniforme en los bloques de texto/imagen/vídeo (la
  tabla ya lo tenía desde la 3.11).
- Texto enriquecido (`coolway-rich-text`): `line-height` más generoso,
  margen entre párrafos/listas, tamaño mayor para el `<strong>` usado
  como heading (limitación conocida: un `<strong>` normal dentro del
  mismo bloque de texto también heredaría ese tamaño mayor — documentado
  en design.md, no bloqueante).
- `<figcaption>` de imagen/vídeo: tamaño reducido, cursiva, color
  atenuado.

## Bug encontrado validando esta tarea, y corregido (mismo 3.12)
Al probar RTL durante la validación se detectó que el modal, tras
moverse a `document.body` (fix de la 3.13), **perdía la herencia del
`dir` de su contenedor raíz** — `dir` no viaja con el nodo al moverlo,
se hereda del árbol donde queda insertado, y `body` es LTR por defecto.
Esto rompía silenciosamente el soporte RTL de la 3.7 en cualquier
escenario donde el bloque necesite el fix de apilamiento de la 3.13
(es decir, en la práctica, siempre que el tema envuelva el bloque en un
contenedor con su propio contexto de apilamiento).

**Fix:** antes de mover el modal a `document.body`, se copia
explícitamente el `dir` del contenedor raíz del bloque al propio nodo
del modal (`modal.setAttribute('dir', ...)`), para que conserve su
dirección real independientemente de dónde quede insertado en el DOM.

**Validado en `coolway-sandbox`:** confirmado con `elementFromPoint`/
`getComputedStyle` que, forzando `dir="rtl"` en el contenedor raíz, el
modal ya movido a `document.body` calcula `direction: rtl` correctamente
(antes del fix daba `ltr`); confirmado visualmente el layout completo en
espejo (cabecera, aviso, tabla). Añadido como nuevo escenario a la
capability ya existente "Cabecera visual propia del modal" (3.13) en
`openspec/specs/size-guide-rendering/spec.md`, en vez de como capability
nueva, porque es una corrección de ese mismo comportamiento.

## Validación general de la 3.12
`theme check` sin errores. Validado en vivo en `coolway-sandbox` sobre
"Goal Green Forest" (guía con descripción real): caja de aviso visible
con acento a la izquierda, espaciado uniforme entre bloques, sin
errores de consola. Sin regresión en "Nilo Altitude Hike" (sin guía).
Cierre/reapertura del modal sin duplicar el nodo.

## Pendiente
3.14 (validación visual final y responsive) — última de la Fase 3
visual, según el orden acordado.
