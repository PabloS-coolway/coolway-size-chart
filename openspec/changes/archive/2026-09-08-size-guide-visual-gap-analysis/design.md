## Context
Hasta ahora todas las validaciones de la Fase 3 se hicieron contra
`coolway-sandbox` (la nota de alcance de la Fase 3 lo exige para
cualquier cambio de código). Esta tarea es una excepción explícita y
acotada: es de solo lectura, no toca ninguna tienda, y su objetivo es
observar el widget real de Kiwi en producción (`coolway.com`) para tener
una referencia visual precisa — no para modificar nada allí.

## Goals / Non-Goals
- Goal: producir una lista concreta y accionable de diferencias visuales,
  no una impresión general.
- Non-Goal: cualquier cambio de CSS o de código (eso es 3.11-3.13).
- Non-Goal: tocar la configuración de `coolway.com` o su Admin.

## Decisions
- Se documenta como `docs/visual-design-gap-analysis.md`, con una
  sección de prioridad sugerida para ordenar 3.11-3.13 por impacto
  visual/esfuerzo.

## Risks / Trade-offs
- Ninguno — visita de solo lectura a una página pública.
