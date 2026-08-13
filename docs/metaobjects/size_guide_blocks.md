# Metaobjects de bloques de contenido — `size_guide_block_*`

**Tarea:** 1.2 — Definición de bloques de contenido
**Estado:** ✅ Completada — 4 metaobjects creados y validados con una entrada de prueba en `coolway-sandbox.myshopify.com`, enlazada desde la guía de prueba de la 1.1.
**Fecha:** 10-ago-2026

## Arquitectura elegida

Un metaobject independiente por tipo de bloque (en vez de uno único con campos opcionales para todo), para no mezclar datos de tabla con datos de imagen en la misma entrada. Los 4 tipos cubren lo detectado en la 0.1: Tabla (100% de las guías), Texto (53%), Imagen (43%) y Vídeo (0% visto hasta ahora, pero en alcance v1).

El campo `Blocks` de `size_guide` (definido en la 1.1) es una **lista de Referencia mixta** que apunta a los 4 tipos a la vez — Shopify lo soporta de forma nativa (tipo de campo "Referencia mixta", con selector de checkboxes por tipo de metaobject destino). El orden en que se añaden las entradas en esa lista es el orden de render.

## `size_guide_block_table` (Tabla — 100% de las guías en la 0.1)

| Campo | Key | Tipo | Notas |
|---|---|---|---|
| Label | `label` | Texto de una sola línea | Ej. "Mujer" / "Hombre" — para los casos Tabla(M)+Tabla(H) vistos en Chile/Perú/Colombia en la 0.1 |
| Headers | `headers` | JSON | Cabeceras de columna, ej. `["Talla EU","CM"]`. Se eligió JSON (no una lista de texto) porque en la 0.1 se detectaron 7 sistemas de tallas distintos y orden de columnas variable entre tiendas (ej. CM/US/UK/EU en Australia vs CM/EU/US/UK en Escandinavia) |
| Rows | `rows` | JSON | Filas de datos, alineadas posicionalmente con `headers`. Ej. `[["38","24.0"],["39","24.7"]]` |
| Unit primary | `unit_primary` | Texto de una sola línea | Ej. "CM" |
| Unit secondary | `unit_secondary` | Texto de una sola línea | Opcional — ej. "INCHES" o "FEET", solo si la tabla tiene selector de doble unidad |
| Has dual unit selector | `has_dual_unit_selector` | Verdadero o falso | Marca el patrón de riesgo detectado en la 0.1 (7 de 123 guías, 5,7%) — el mismo tipo de selector que causó la incidencia crítica "Hoodie Roomy SYA" (conversión ×2.54 aplicada a valores ya en cm). Relevante para que el motor de reglas o una validación futura pueda señalar estos bloques para revisión manual |

**Nota técnica sobre JSON:** al seleccionar el tipo "JSON" en el Admin, Shopify muestra un aviso ("Necesitas ayuda de alguien con experiencia en desarrollo para usar este tipo en tu tienda online") — es esperado, este campo no está pensado para que Marketing lo edite a mano en el Admin durante la operación normal, sino para que la app lo rellene o lo edite mediante un editor de tabla propio (fuera de alcance de la 1.2; UI de edición pendiente para una fase de desarrollo de la app).

## `size_guide_block_text` (Texto — 53% de las guías en la 0.1)

| Campo | Key | Tipo | Traducible |
|---|---|---|---|
| Content | `content` | Texto enriquecido | Sí |

Cubre las frases de ajuste ("runs small", "recomendamos elegir una talla más") e instrucciones tipo "¿Cómo medir tu pie?" detectadas en la 0.1, incluido el contenido regional/localizado por país (Uruguay, Argentina, Costa Rica).

## `size_guide_block_image` (Imagen — 43% de las guías en la 0.1)

| Campo | Key | Tipo | Traducible |
|---|---|---|---|
| Image | `image` | Imagen (Archivo) | — |
| Alt text | `alt_text` | Texto de una sola línea | Sí |
| Caption | `caption` | Texto de una sola línea | Sí |

Cubre las ilustraciones técnicas de prenda y diagramas de medición del pie detectados en la 0.1.

## `size_guide_block_video` (Vídeo — 0% detectado en la 0.1, en alcance v1)

| Campo | Key | Tipo | Traducible |
|---|---|---|---|
| Video URL | `video_url` | URL | — |
| Caption | `caption` | Texto de una sola línea | Sí |

Aunque el inventario real de la 0.1 no encontró ningún caso de vídeo en las 123 guías analizadas, el alcance v1 del proyecto sí lo contempla, así que se modela igualmente.

## Cambio en `size_guide` (1.1)

Se añadió un quinto campo a la definición de `size_guide`:

| Campo | Key | Tipo |
|---|---|---|
| Blocks | `blocks` | Lista de Referencia mixta → `size_guide_block_table`, `size_guide_block_text`, `size_guide_block_image`, `size_guide_block_video` |

## Validación realizada

1. Se creó una entrada de prueba en `size_guide_block_table`:
   - **Label:** "Calzado adulto"
   - **Headers:** `["Talla EU","CM"]`
   - **Rows:** `[["38","24.0"],["39","24.7"],["40","25.3"]]`
   - **Unit primary:** "CM"
   - **Has dual unit selector:** Falso
   - Guardado sin errores. Entry ID: `229339463785`.
2. Se enlazó esa entrada desde el campo `Blocks` de la entrada de prueba de `size_guide` ("Guía de tallas — Calzado adulto", creada en la 1.1) — aparece correctamente como referencia seleccionable, agrupada por tipo de metaobject en el selector. Guardado sin errores.

## Siguiente paso

1.3 — Definición del modelo de reglas de asignación (`size_guide_rule`). Cuando exista, se añadirá un sexto campo `assignment_rules` a `size_guide` (Referencia mixta o simple, a decidir en esa tarea).
