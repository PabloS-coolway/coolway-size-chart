# 2.14 — Campos nuevos en bloque tabla: footer text + hide table

## Why
La comparativa de campos con Kiwi (08-sept-2026, ver Fase 2 revisitada
en el contexto del proyecto) detectó 2 campos de configuración del
bloque "Size table" que Kiwi ofrece y nuestro modelo no tiene todavía:
un texto de pie de tabla ("Table footer text") y un interruptor para
ocultar la tabla sin borrar sus datos ("Hide table"), visible en las
capturas de `docs/admin-panel-2.12-kiwi-reference.md` (sección
"Controles bajo la rejilla (toggles)"). Se marcaron como bloqueantes
antes del rollout (Fase 5), junto con la 2.12 y la 2.13 ya cerradas.

## What Changes
- Nuevos campos en el metaobject `size_guide_block_table`:
  `footer_text` (`multi_line_text_field`, opcional) y `hide_table`
  (`boolean`, por defecto false/"off" como en Kiwi).
- Editor del panel de administración (bloque de tipo tabla): nuevo
  textarea "Footer text" y nuevo checkbox "Hide table", junto a los
  campos ya existentes (`unitPrimary`, `unitSecondary`,
  `hasDualUnitSelector`).
- Storefront (`extensions/size-guide-block/blocks/size_guide.liquid`):
  cuando `hide_table` es true, la tabla completa (cabecera de grupo +
  `<table>`) no se renderiza; cuando `footer_text` tiene contenido, se
  muestra como una línea de nota bajo la tabla (solo si la tabla no
  está oculta).
- Contrato existente sin cambios: `headers`/`rows`/`unit_primary`/
  `unit_secondary`/`has_dual_unit_selector` se comportan exactamente
  igual que hoy.

## Capabilities
- Modified: `size-guide-admin-panel` (añade 2 campos nuevos al
  Requirement de edición del bloque tabla ya existente desde la 2.12)

## Impact
- `scripts/deploy-metaobject-definitions.js` (añade los 2 campos
  nuevos a la definición `size_guide_block_table` — el script es
  idempotente y solo añade campos, nunca borra).
- `app/routes/app.size-guides.$id_.blocks_.$type.$blockId.tsx` (query,
  loader, action y formulario del bloque tabla).
- `extensions/size-guide-block/blocks/size_guide.liquid` (renderizado
  storefront).
- Validado en `coolway-sandbox`, nunca en tienda real.
