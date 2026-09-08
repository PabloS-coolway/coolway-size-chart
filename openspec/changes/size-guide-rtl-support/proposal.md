# Soporte RTL (3.7)

## Why
La 0.6 detectó que Coolway Dubai corre en árabe (RTL) en producción, no en
inglés. El bloque de guía de tallas necesita renderizar correctamente en
esa dirección de texto — enlace, modal, tabla y botón de cierre no deben
"leerse al revés" ni quedar mal alineados. Esta tarea construye y prueba la
**capacidad genérica** de RTL en `coolway-sandbox` (simulando árabe); la
prueba con tráfico real de Dubai es rollout (Fase 5), fuera de alcance
aquí.

## What Changes
- El bloque detecta la dirección de texto real de la tienda/idioma
  (`localization.language.root_url`/`request.locale` — ver design.md para
  la fuente exacta elegida) y aplica `dir="rtl"` al contenedor raíz cuando
  corresponda.
- El CSS del bloque (posición del botón de cierre del modal, alineación de
  la tabla, márgenes) se reescribe con propiedades lógicas CSS
  (`inset-inline-end`, `margin-inline-start`, etc.) en vez de físicas
  (`right`, `margin-left`) para que se auto-adapten a la dirección sin
  duplicar reglas.
- Sin cambios en la lógica de lectura/renderizado de contenido (3.3/3.4),
  unidad por defecto (3.6) ni modal (3.6-bis) — solo en cómo se posicionan
  visualmente.

## Capabilities
- Modified: `size-guide-rendering` (añade requisito de dirección de texto)

## Impact
- Archivos: `extensions/size-guide-block/blocks/size_guide.liquid`
- Riesgo: `coolway-sandbox` no tiene árabe publicado como idioma de tienda
  — la validación real se hace forzando `dir="rtl"` visualmente (vía el
  propio mecanismo de detección, simulado) en vez de con tráfico árabe
  real; se documenta la limitación.
