## Context
`resolved_guide.blocks` (3.3) es una lista de referencia mixta a 4 tipos de
metaobject. Se validó empíricamente en `coolway-sandbox` cómo acceder a
cada pieza — ver `docs/render-blocks.md` para el detalle completo de los
hallazgos.

## Goals / Non-Goals
- Goal: renderizar el contenido real de cada tipo de bloque con datos
  reales de `coolway-sandbox`.
- Goal: documentar la sintaxis Liquid exacta que funcionó para cada caso.
- Non-Goal: construir el modal/overlay interactivo — solo el HTML de
  contenido que iría dentro.
- Non-Goal: auto-selección de unidad (3.6), RTL (3.7), traducciones (3.8).

## Decisions
- **Iterar `resolved_guide.blocks.value`** (no `.blocks` directo) — el
  acceso directo da la lista cruda de GIDs sin resolver; `.value` da el
  `MetaobjectListDrop` con los metaobjects ya resueltos (y, de paso, solo
  los que están en estado Active — hallazgo real, ver docs).
- **Detectar el tipo de bloque por presencia de campo distintivo**
  (`headers`+`rows` → tabla, `content` → texto, `image` → imagen,
  `video_url` → vídeo), no por `block.type` — que en este contexto viene
  vacío, contra lo esperado inicialmente.
- **Campos JSON y de texto enriquecido necesitan `.value`** para dar la
  estructura Liquid nativa parseada; no existe el filtro `parse_json` en
  el Liquid de Shopify (se intentó primero y `theme check` lo rechazó).
- Texto enriquecido: snippet propio (`coolway-rich-text.liquid`) que
  recorre a mano la estructura `root.children[].type` — cobertura mínima
  (párrafos, listas), sin negrita/cursiva/enlaces.
- Bloques rotos, de tipo no reconocido, o en Draft: se omiten en silencio
  (el `{%- elsif -%}` en cadena ya lo cubre; un bloque Draft ni siquiera
  llega a la lista `.value`).

## Risks / Trade-offs
- Imagen y vídeo no se pudieron validar con datos reales Active en esta
  tarea (los bloques de ese tipo existentes estaban en Draft) — implementados
  por el mismo patrón ya confirmado para otros campos de referencia, pero
  marcados como pendientes de validación real en `docs/render-blocks.md`.
- El HTML no lleva estilos propios más allá de lo mínimo para ser legible
  — el pulido visual se deja para cuando se construya el modal real.
- Un bloque dejado en Draft por error queda oculto del storefront sin
  ningún aviso — riesgo operativo a comunicar al equipo de contenido, no a
  resolver en código en esta tarea.
