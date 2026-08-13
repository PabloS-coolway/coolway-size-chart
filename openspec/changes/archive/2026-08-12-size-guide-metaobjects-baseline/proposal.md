## Why

Las tareas 1.1 a 1.4 de la Fase 1 (modelo de datos de metaobjects de la guía de tallas y script de despliegue idempotente) se completaron y validaron contra `coolway-sandbox` entre el 6 y el 12 de agosto de 2026, antes de que OpenSpec se inicializara en este repositorio. Esta change no introduce ningún cambio de comportamiento: establece la spec principal de esta capability para que las fases siguientes (2 en adelante) puedan generar deltas reales contra una base formal, en vez de contra los documentos sueltos de `docs/metaobjects/`.

## What Changes

- Se documenta como spec principal el modelo de datos ya desplegado: el metaobject `size_guide`, los 4 metaobjects de bloque de contenido (`size_guide_block_table`, `size_guide_block_text`, `size_guide_block_image`, `size_guide_block_video`), y el metaobject de reglas de asignación `size_guide_rule`.
- Se documenta el comportamiento ya validado del script idempotente de despliegue multi-tienda (`scripts/deploy-metaobject-definitions.js`).
- No se modifica ningún campo, tipo, validación ni comportamiento de código — es documentación retroactiva de trabajo ya completado y probado en `coolway-sandbox`.

## Capabilities

### New Capabilities
- `size-guide-metaobjects`: modelo de datos de metaobjects para la guía de tallas (guía + bloques de contenido + reglas de asignación) y el script idempotente que despliega sus definiciones contra cualquier tienda del grupo.

### Modified Capabilities
(ninguna — esta change no modifica ninguna capability existente)

## Impact

- Afecta a las definiciones de metaobject en el Admin de Shopify (ya creadas en `coolway-sandbox`), a `scripts/deploy-metaobject-definitions.js`, y a los scopes `write_metaobjects` / `write_metaobject_definitions` declarados en `shopify.app.toml`.
- No afecta a ninguna tienda de producción: la app `coolway-size-chart` todavía no está instalada en ninguna de las 14 tiendas reales (solo en `coolway-sandbox`), según lo verificado en la tarea 0.6 de Fase 0.
