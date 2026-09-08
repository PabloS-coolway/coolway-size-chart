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

## Validación visual adicional (08-sept-2026): español publicado en `coolway-sandbox`
A petición del usuario se publicó español en `coolway-sandbox` (Admin →
Configuración → Idiomas → Agregar idioma → asignar al dominio/market
"United States" → Publicar), con permiso explícito del usuario para este
cambio de configuración de cuenta. Validado en vivo sobre "Goal Green
Forest" cambiando el idioma real de la tienda mediante el selector nativo
del tema (formulario `#LocalizationForm` → `/localization`, no el
parámetro `?locale=`, que en este tema no cambia el idioma activo por sí
solo):

- **Español** (`document.documentElement.lang = "es"`, navegación a
  `/es/products/...`): enlace del bloque "Guía de tallas: Guía de tallas -
  Calzado adulto", modal con cabeceras de tabla "Talla EU"/"CM" y botón de
  cierre con `aria-label="Cerrar"` — confirmado también visualmente
  (captura de pantalla del modal abierto).
- **Inglés** (vuelta atrás con el mismo selector, `lang = "en"`): enlace
  "Size guide: Guía de tallas - Calzado adulto", botón de cierre con
  `aria-label="Close"` — sin regresión.

Confirma que las traducciones fijas del bloque (3.8) funcionan en las dos
capas: idioma de tienda real (no solo simulado) y datos del metaobject
(que permanecen en español porque así está escrito, independientemente
del idioma de la tienda).

## Pendiente / fuera de alcance
Francés no se ha publicado ni validado visualmente en `coolway-sandbox`
(el usuario pidió validar únicamente español e inglés) — el fichero
`fr.json`/`fr.schema.json` está escrito y se activará en cuanto se
publique ese idioma (aquí o en cualquier tienda real de Fase 5).
