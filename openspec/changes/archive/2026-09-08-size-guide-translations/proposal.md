# Traducciones del bloque en sí (3.8)

## Why
El contenido de las guías ya es traducible nativamente desde la 1.1
(metaobjects + Translate & Adapt). Pero los textos fijos del propio bloque
— el prefijo "Guía de tallas: " del enlace/título del modal y el
`aria-label` "Cerrar" del botón — están hoy hardcodeados en español. La
2.9 confirmó 3 idiomas reales a soportar: English, Spanish, French. Sin
esto, una tienda con el idioma de tienda en inglés o francés seguiría
viendo "Guía de tallas: ..." en español.

## What Changes
- Se añaden ficheros de localización de la Theme App Extension
  (`locales/en.default.json`, `locales/es.json`, `locales/fr.json`) con
  las claves de los textos fijos del bloque.
- `size_guide.liquid` sustituye los literales hardcodeados por el filtro
  `| t` de Liquid, incluida interpolación del título real de la guía en el
  texto del enlace/aria-label del modal.
- El `name` del `{% schema %}` (visible solo en el editor de temas, para
  Marketing/Dev, no para el cliente final) también se traduce vía
  `"t:general.block_name"`.
- Entran en efecto por tienda solo cuando esa tienda instale la extensión
  — activación real por tienda es Fase 5, fuera de alcance aquí.

## Capabilities
- Modified: `size-guide-rendering` (añade requisito de traducción de los
  textos fijos del bloque)

## Impact
- Archivos nuevos: `extensions/size-guide-block/locales/en.default.json`,
  `es.json`, `fr.json`
- Archivos modificados: `extensions/size-guide-block/blocks/size_guide.liquid`
- Riesgo: `coolway-sandbox` solo tiene español publicado como idioma de
  tienda real — validar inglés/francés requiere forzar el idioma de la
  visita (parámetro `?locale=` o cambiar el idioma de la tienda de
  pruebas), documentado como limitación igual que en la 3.7.
