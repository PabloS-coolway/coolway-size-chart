# Design — Soporte RTL (3.7)

## Fuente de la dirección de texto

Shopify no expone en Liquid un booleano directo de "esta tienda/idioma es
RTL" utilizable desde un App Block (el `dir` del `<html>` lo decide el
tema, no la extensión). Igual que en la 3.6 con el país, se usa **una
lista cerrada de códigos de idioma RTL** contra `request.locale.iso_code`
(el idioma real de la visita, no el mercado): `ar` (árabe), `he` (hebreo),
`fa` (persa/farsi), `ur` (urdu). Cualquier otro idioma es LTR (fallback
seguro).

Se descarta inferir la dirección desde `localization.country` (mercado):
un mismo mercado puede tener varios idiomas publicados con distinta
dirección (aunque hoy no sea el caso de Dubai), y la dirección de texto es
una propiedad del idioma, no del país — mismo tipo de razonamiento que
llevó a separar unidad (país) de idioma en la 3.6.

## Alternativas de implementación CSS

1. **Duplicar reglas LTR/RTL** con selectores `[dir="rtl"] .clase {...}`
   — funciona, pero duplica cada regla de posicionamiento y es fácil que
   se desincronicen con el tiempo.
2. **Propiedades lógicas CSS** (`inset-inline-end`, `margin-inline-start`,
   `text-align: start`) — una sola regla se adapta sola a la dirección
   heredada del atributo `dir`. **Elegida**: menos código, sin
   duplicación, soporte de navegador ya maduro (Coolway no tiene un
   baseline de navegadores antiguos declarado en el proyecto).

## Decisión
- `coolway_is_rtl` calculado una vez a partir de `request.locale.iso_code`
  contra la lista cerrada `ar,he,fa,ur`.
- `dir="{{ 'rtl' if coolway_is_rtl else 'ltr' }}"` en el `<div
  class="coolway-size-guide-block">` raíz — el navegador hereda esa
  dirección para todo lo de dentro (enlace, modal, tabla) salvo que se
  sobreescriba.
- CSS reescrito con propiedades lógicas donde antes había físicas: el
  botón de cierre pasa de `right` a `inset-inline-end`.

## Validación
`coolway-sandbox` no tiene árabe publicado como idioma de tienda real —no
hay forma de generar tráfico real en `ar` sin publicarlo, que es trabajo
de rollout (Fase 5, fuera de alcance). La validación de esta tarea fuerza
`dir="rtl"` en el propio bloque vía DevTools/JS (simulando el resultado
que produciría un visitante árabe real) y confirma visualmente que el
enlace, el modal y la tabla se leen y alinean correctamente de derecha a
izquierda, sin romper el layout.

## Impacto en el código
- `size_guide.liquid`: nuevo cálculo `coolway_is_rtl`, atributo `dir` en el
  contenedor raíz, CSS con propiedades lógicas en vez de físicas.
- Sin nuevas dependencias.
