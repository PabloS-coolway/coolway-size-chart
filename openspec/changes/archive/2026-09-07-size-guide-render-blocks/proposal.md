# Renderizado de cada tipo de bloque de la guía (3.4)

## Why
La 3.3 ya trae el metaobject `size_guide` completo (título, descripción,
lista `blocks`), pero solo muestra el título como confirmación de depuración.
Falta recorrer `blocks` y renderizar cada tipo real con su propia plantilla:
tabla, texto, imagen, vídeo — el contenido que el cliente final necesita ver
de verdad en el modal "Guía de tallas" (decisión UX de la 3.1).

## What Changes
- Recorrer `resolved_guide.blocks` con un `{% for %}` y usar `{% case
  block.type %}` para despachar a la plantilla correcta de cada tipo:
  `size_guide_block_table`, `size_guide_block_text`,
  `size_guide_block_image`, `size_guide_block_video`.
- Tabla: parsear el JSON de `headers`/`rows` y renderizar una tabla HTML
  real. Soportar el caso "selector de doble unidad"
  (`has_dual_unit_selector`) mostrando ambas unidades disponibles (sin
  javascript de conversión — eso es fuera de alcance de esta tarea, ver
  3.6 para auto-selección de unidad).
- Texto: renderizar `content` (texto enriquecido) tal cual.
- Imagen: `<img>` con `image`, `alt_text`, `caption`.
- Vídeo: embed simple de `video_url` con `caption`.
- El contenido se sigue mostrando dentro del propio bloque (aún sin el
  modal real de la 3.1 — construir el modal/overlay en sí no es parte de
  esta tarea; aquí solo se genera el HTML del contenido que iría dentro).
- Fuera de alcance: el modal/overlay interactivo en sí (JS de apertura/
  cierre); auto-selección de unidad por geolocalización (3.6); soporte RTL
  (3.7); traducciones del bloque (3.8).

## Capabilities
- Modified: `size-guide-rendering` (añade requisito de renderizado por tipo
  de bloque)

## Impact
- Archivos: `extensions/size-guide-block/blocks/size_guide.liquid`
- Riesgo: la forma exacta de acceso a los campos JSON (`headers`/`rows`) y
  a los campos de referencia (`image`) de un metaobject anidado dentro de
  otro metaobject nunca se ha probado — se valida empíricamente en
  `coolway-sandbox` con datos reales, igual que se hizo con el acceso
  Storefront en la 3.3.
