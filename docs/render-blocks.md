# 3.4 — Renderizado de cada tipo de bloque

Change OpenSpec: `size-guide-render-blocks`.

## Hallazgos reales (validados con datos reales en coolway-sandbox)

1. **`resolved_guide.blocks` (sin `.value`) da la lista CRUDA de GIDs sin
   resolver.** Hay que acceder a `.value` — `resolved_guide.blocks.value`,
   un `MetaobjectListDrop` — para iterar los metaobjects ya resueltos.

2. **`.value` solo incluye bloques en estado Active.** Probado con la guía
   real "Size Guide #FOOTBALL" (5 bloques referenciados, 4 en Draft, 1
   Active): `resolved_guide.blocks.value` devolvió únicamente el bloque
   Active. Un bloque en Draft desaparece de la lista sin más — ni error, ni
   hueco. Esto ya estaba cubierto por el requisito de "bloque que no
   resuelve" de la capability, pero es una advertencia real a tener en
   cuenta: un editor de contenido que deje un bloque en borrador lo oculta
   de facto del storefront sin ningún aviso.

3. **`block.type` viene vacío** en este contexto — no sirve para el
   `{% case %}` que se intentó primero. El tipo de cada bloque se detecta
   por la presencia de su campo distintivo (`headers`/`content`/`image`/
   `video_url`).

4. **Campos JSON (`headers`, `rows`) y de texto enriquecido (`content`,
   `description`) necesitan `.value`** para obtener la estructura Liquid ya
   parseada (array/hash nativo). El acceso directo (sin `.value`) da el
   JSON en bruto sin parsear — y el filtro `parse_json` **no existe** en el
   Liquid de Shopify (`theme check` lo rechaza con "Unknown filter").

5. **Campos de texto plano (`label`, `unit_primary`) SÍ funcionan con
   acceso directo**, sin `.value` — igual que `title` en la 3.3.

6. **Texto enriquecido:** `.value` da una estructura navegable
   (`root.children[].type` = `paragraph`/`list`/`heading`, y dentro,
   `.children[].value` para el texto). Se implementó un snippet propio
   (`snippets/coolway-rich-text.liquid`) que recorre esta estructura a
   mano — cobertura deliberadamente mínima (párrafos y listas, sin negrita/
   cursiva/enlaces) por ser suficiente para el requisito de esta tarea.

## Validado con datos reales
"Goal Green Forest" (`goal-green-forest-mujer`): la descripción de la guía
y la tabla ("Calzado adulto (editado)", cabeceras Talla EU/CM, 3 filas)
renderizan correctamente en el storefront público. "Nilo Altitude Hike"
(sin guía) sigue sin mostrar nada, sin regresión.

## Pendiente de validar (no bloqueante)
Imagen (`image`) y vídeo (`video_url`) se implementaron siguiendo el mismo
patrón de `.value` para campos de referencia, pero **no se pudieron
validar con datos reales** en esta tarea: los únicos bloques de ese tipo
en la guía de prueba estaban en Draft (ver hallazgo 2), y no se creó
contenido Active nuevo para no alterar los datos de prueba existentes.
Queda como verificación pendiente para cuando exista una guía con un
bloque de imagen o vídeo en estado Active.

## Fuera de alcance de esta tarea
El modal/overlay interactivo (decisión UX 3.1) — aquí solo se genera el
HTML de contenido que iría dentro; abrir/cerrar el modal en sí es trabajo
aparte. Auto-selección de unidad (3.6), RTL (3.7), traducciones (3.8).
