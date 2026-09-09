# Design — 3.14 Validación visual final y responsive

## Context
El modal usa `max-width: 640px; width: 90%` y la tabla es un `<table>`
normal sin ningún tratamiento de scroll horizontal propio — en un
viewport estrecho (< 400px) con varias columnas, el contenido podría
desbordar sin poder verse completo. Ninguna de las 3 tareas de diseño
visual (3.11-3.13) probó esto explícitamente.

## Goals
- Confirmar (o corregir) que el modal, la tabla y el resto de bloques
  se ven y se usan correctamente en un viewport móvil real.
- Verificar que las 3 tareas de diseño visual conviven bien juntas
  (nada de solapamientos ni regresiones cruzadas).

## Non-Goals
- No se rediseña nada que ya funcione — solo se corrige lo que falle
  de verdad en la validación.
- No se prueba en dispositivos físicos ni en todos los navegadores —
  se usa el viewport móvil de Chrome DevTools, igual que el resto de
  validaciones de esta fase (ya se ha usado el mismo criterio pragmático
  en 3.6-3.13).

## Decisions
- Si la tabla desborda en móvil, la corrección esperable es envolverla
  en un contenedor con `overflow-x: auto` (scroll horizontal solo de la
  tabla, sin afectar al resto del modal) — patrón estándar, sin
  necesidad de rediseñar la tabla en sí.
- Si el modal en sí es demasiado ancho/alto en móvil, la corrección
  esperable es ajustar `width`/`max-height` con media queries, sin
  tocar la estructura HTML.
