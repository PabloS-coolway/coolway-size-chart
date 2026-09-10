# Design — 2.14 Campos nuevos en bloque tabla

## Context
El bloque tabla (`size_guide_block_table`) ya tiene 6 campos desde la
1.2 (`label`, `headers`, `rows`, `unit_primary`, `unit_secondary`,
`has_dual_unit_selector`), editados desde la 2.12 con `TableGridEditor`
para `headers`/`rows` y controles simples para el resto. Añadir 2
campos más sigue exactamente el mismo patrón que `has_dual_unit_selector`
(un booleano) más uno de texto nuevo.

## Goals
- `footer_text`: texto libre corto (una o dos líneas), opcional, que
  aparece bajo la tabla en el storefront — mismo caso de uso que el
  "fit note" ya cubierto por `description` de la guía (3.12), pero a
  nivel de bloque de tabla individual, no de guía completa.
- `hide_table`: permite desactivar visualmente una tabla sin borrar
  sus datos (`headers`/`rows` se conservan) — útil para desactivar
  temporalmente un bloque sin perder el trabajo de captura de datos.

## Non-Goals
- No se replica "Enable count..." (otro toggle visto en las capturas
  de Kiwi, gap descartado explícitamente en la ronda de la Fase 2
  revisitada por uso real desconocido, a confirmar con Marketing).
- `hide_table` no es lo mismo que el estado Draft/Active del propio
  metaobject bloque (ya existente, ver hallazgo de la 3.4) — Draft
  oculta el bloque entero de la guía; `hide_table` oculta solo la
  parte de tabla mientras el bloque sigue Active (por si en el futuro
  el bloque tabla acumula otros campos que sí deban seguir
  mostrándose, aunque hoy no es el caso).

## Decisions
- **`multi_line_text_field` para `footer_text`**, no
  `single_line_text_field` — es una nota de pie de tabla, con más
  margen de longitud que una etiqueta o unidad. Primer campo
  `multi_line_text_field` del proyecto (hasta ahora solo `single_line`,
  `rich_text`, `json`, `boolean`, `file_reference`, `url`).
- **`hide_table` por defecto `false`** ("Off" en Kiwi) — igual que
  `has_dual_unit_selector`, mismo patrón de checkbox con
  `defaultChecked`.
- **En el storefront, `hide_table` oculta todo el `<div class="...
  table-wrap">`** (cabecera de grupo + tabla + footer), no solo el
  `<table>` — si la tabla está oculta, su nota de pie tampoco tiene
  sentido mostrarla sola.
- **Sin cambios en `TableGridEditor.tsx`** — los 2 campos nuevos son
  independientes de la rejilla `headers`/`rows`, se añaden como
  controles simples en la misma ruta, igual que `unitPrimary`.

## Risks / Trade-offs
- Ninguno significativo: cambio aditivo puro sobre un modelo de datos
  y una ruta ya validados en 3 tareas anteriores (1.2, 2.12, 3.4).
