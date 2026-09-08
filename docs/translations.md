# 3.8 — Traducciones del bloque en sí

Change OpenSpec: `size-guide-translations`.

## Decisión (ver design.md)
Mecanismo nativo de localización de Theme App Extensions:
`locales/en.default.json` (obligatorio, fallback), `es.json`, `fr.json`,
leídos con el filtro Liquid `| t`. El nombre del bloque en el editor de
temas usa un fichero aparte (`en.default.schema.json`, `es.schema.json`,
`fr.schema.json`) — **hallazgo real**: `theme check` rechazó
`"name": "t:general.block_name"` contra `locales/en.default.json` con el
error `ValidSchemaTranslations` porque las traducciones de `{% schema %}`
viven en un fichero de locale distinto (`*.schema.json`), no en el mismo
que usa el filtro `| t` del cuerpo Liquid — dos espacios de nombres
separados aunque compartan la misma estructura de claves.

## Implementación
- Enlace/título del modal: `{{ 'general.size_guide_link' | t: title:
  resolved_guide.title }}` — interpolación nativa del filtro `t` para
  insertar el título real de la guía (que sigue viniendo del metaobject,
  independiente de esta traducción).
- Botón de cierre: `aria-label="{{ 'general.close' | t }}"`.
- Nombre del bloque en el editor: `"name": "t:general.block_name"`.

## Validación realizada y hallazgo real sobre el idioma de `coolway-sandbox`
`theme check` sin errores tras añadir los ficheros `.schema.json`.
**Hallazgo real, corrige una asunción del proposal:** `coolway-sandbox`
solo tiene **inglés** publicado como idioma de tienda (no español, como se
había asumido) — confirmado con `document.documentElement.lang` = `"en"`
y probando `?locale=es`/`?locale=fr` explícitamente: ambos caen de vuelta
a inglés porque esos locales no están publicados en esta tienda (Shopify
solo honra `?locale=` para idiomas realmente publicados). Con el idioma
por defecto se confirma en vivo sobre "Goal Green Forest": el enlace
muestra "Size guide: Guía de tallas - Calzado adulto" y el botón de cierre
tiene `aria-label="Close"` — el texto fijo del bloque está en inglés, el
título de la guía sigue en español porque así está escrito ese metaobject
(confirma que las dos capas de traducción son independientes, como se
diseñó). Sin regresión en "Nilo Altitude Hike" (sin guía, bloque vacío).

## Pendiente / fuera de alcance
Validar visualmente español y francés reales requiere publicar esos
idiomas en `coolway-sandbox` (Admin → Configuración → Idiomas), que no se
ha hecho para no alterar la configuración de la tienda de pruebas fuera
del alcance de esta tarea — los ficheros `es.json`/`es.schema.json` y
`fr.json`/`fr.schema.json` están escritos y lo activarán en cuanto se
publiquen esos idiomas (aquí o en cualquier tienda real de Fase 5).
