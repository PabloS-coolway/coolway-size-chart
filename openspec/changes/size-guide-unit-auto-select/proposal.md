# Auto-selección de unidad por geolocalización (3.6)

## Why
Decisión 4 de la 2.9 (confirmada como requisito real por el equipo): la
guía debe mostrar por defecto cm o pulgadas según la ubicación del
visitante, para tablas con `has_dual_unit_selector`. Mecanismo técnico
pendiente de decidir (geolocalización de navegador, mercado de Shopify,
cabecera de idioma...).

## What Changes
- **Decisión de mecanismo: usar el mercado/país de Shopify
  (`localization.country`), no geolocalización de navegador ni cabeceras.**
  Ver `design.md` para el porqué.
- En tablas con `has_dual_unit_selector`, calcular qué unidad es la
  "por defecto" para el visitante actual (imperial vs. métrico según su
  país) y marcarla visualmente (la unidad por defecto se muestra primero/
  resaltada); la tabla sigue mostrando AMBAS unidades — no se oculta
  ninguna (eso ya lo fijó la 3.4 y la 3.5 no permite tocarlo sin más).
- No se construye ningún selector interactivo (botón/toggle) que cambie de
  unidad en el cliente — eso requeriría JS y no está decidido como
  necesario; el visitante ya ve ambas columnas.
- Fuera de alcance: RTL (3.7), traducciones del bloque (3.8), cualquier
  cambio en tablas sin `has_dual_unit_selector` (no hay ambigüedad de
  unidad que resolver ahí).

## Capabilities
- Modified: `size-guide-rendering` (añade requisito de unidad por defecto
  según mercado)

## Impact
- Archivos: `extensions/size-guide-block/blocks/size_guide.liquid`
- Riesgo: `localization.country` depende de que la tienda tenga Markets
  configurado — en `coolway-sandbox` puede no reflejar geolocalización
  real del visitante sino el mercado activo/seleccionado; se documenta el
  comportamiento real encontrado en la validación.
