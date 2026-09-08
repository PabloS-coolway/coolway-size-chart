# 3.7 — Soporte RTL

Change OpenSpec: `size-guide-rtl-support`.

## Decisión (ver design.md)
La dirección de texto se calcula a partir de `request.locale.iso_code`
(el idioma real de la visita, no el mercado) contra una lista cerrada de
idiomas RTL: `ar`, `he`, `fa`, `ur`. Se descartó inferirla desde
`localization.country` porque un mismo mercado puede tener varios idiomas
publicados con distinta dirección.

## Implementación
`size_guide.liquid`: `coolway_text_dir` (`rtl`/`ltr`) se calcula una vez y
se aplica como atributo `dir` en el contenedor raíz
`.coolway-size-guide-block`. El CSS de posicionamiento (botón de cierre
del modal) pasa de `right` a `inset-inline-end`, y el panel del modal usa
`text-align: start` — ambos se adaptan solos a la dirección heredada, sin
duplicar reglas LTR/RTL.

## Validación realizada
- `theme check` sin errores nuevos.
- `coolway-sandbox` no tiene árabe publicado como idioma de tienda real
  (limitación conocida, documentada en el proposal) — se validó forzando
  `dir="rtl"` en el propio contenedor vía JavaScript (simulando el mismo
  resultado que produciría `request.locale.iso_code = "ar"`) sobre "Goal
  Green Forest": el `direction` computado pasa a `rtl` y el botón de
  cierre del modal se reposiciona correctamente al lado izquierdo del
  panel (antes a la derecha en LTR).
- Confirmado que por defecto (sin forzar nada) el bloque renderiza en
  `dir="ltr"`, igual que antes de esta tarea.
- "Nilo Altitude Hike" (`nilo-kak`, sin guía): bloque vacío, `dir="ltr"`
  por defecto, sin regresión.

## Pendiente / fuera de alcance
Prueba con tráfico árabe real y despliegue en Coolway Dubai: es rollout,
Fase 5. Traducciones de los textos fijos del bloque (3.8) quedan para su
propia tarea.
