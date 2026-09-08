# 3.6 — Auto-selección de unidad por geolocalización

Change OpenSpec: `size-guide-unit-auto-select`.

## Decisión (ver design.md)
Se usa `localization.country.iso_code` (mercado activo de Shopify) para
marcar visualmente la unidad por defecto (cm vs. pulgadas) en tablas con
`has_dual_unit_selector`, sin ocultar nunca ninguna de las dos unidades.
Lista cerrada de países de sistema imperial: US, LR, MM. Fallback a cm si
`localization.country` no resuelve un `iso_code`.

## Implementación
`size_guide.liquid`: se calcula `coolway_imperial_first` una vez al
principio del bloque y se usa dentro del `<caption>` de cada tabla con
`has_dual_unit_selector` para envolver en
`<span class="coolway-size-guide-block__unit--default">` la unidad que
corresponde por defecto (negrita vía CSS). Tablas sin ese flag no se ven
afectadas — comportamiento idéntico al de la 3.4.

## Validación realizada
- `theme check` (vía `shopify app dev`) arranca sin errores nuevos tras el
  cambio.
- Validado en `coolway-sandbox` sobre "Goal Green Forest"
  (`goal-green-forest-mujer`): su tabla real ("Calzado adulto (editado)")
  **no tiene activado `has_dual_unit_selector`** (solo muestra CM) — se
  confirma que el bloque de unidad-por-defecto no se activa y que no hay
  regresión en el caso de unidad única, que sigue mostrando
  "Calzado adulto (editado) (CM)" igual que en la 3.4/3.5.

## Pendiente de validar (no bloqueante)
No existe en los datos de prueba actuales de `coolway-sandbox` ninguna
tabla Active con `has_dual_unit_selector` activo, por lo que el marcado
visual de la unidad por defecto (y el comportamiento real de
`localization.country` como proxy de geolocalización en esta tienda) no
se ha podido validar todavía con datos reales — mismo tipo de gap ya
documentado en la 3.4 para imagen/vídeo. Queda pendiente de verificación
en cuanto exista contenido Active de ese tipo, sin bloquear el cierre de
esta tarea.

## Fuera de alcance
Selector interactivo cliente-servidor para cambiar de unidad manualmente,
RTL (3.7), traducciones del bloque (3.8).
