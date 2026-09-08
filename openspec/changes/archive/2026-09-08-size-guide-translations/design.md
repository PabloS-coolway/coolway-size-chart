# Design — Traducciones del bloque (3.8)

## Mecanismo
Shopify Theme App Extensions soportan localización nativa vía
`locales/<locale>.json` dentro de la propia extensión, leídos con el
filtro Liquid `| t` (igual sintaxis que un tema normal). No requiere
Translate & Adapt (eso es para contenido de metaobjects, ya cubierto
desde la 1.1) — es un mecanismo aparte, propio de la extensión.

`en.default.json` es el fallback obligatorio (Shopify lo exige como
"default locale" de la extensión). `es.json` y `fr.json` cubren los otros
2 idiomas confirmados en la 2.9. Si una tienda tiene un idioma publicado
que no sea ninguno de los 3, Shopify usa el default (`en`) automáticamente
— comportamiento nativo, sin código adicional.

## Claves elegidas
```json
{
  "general": {
    "size_guide_link": "Size guide: {{ title }}",
    "close": "Close",
    "block_name": "Size guide"
  }
}
```
`size_guide_link` usa interpolación `{{ title }}` (sintaxis nativa del
filtro `t` de Shopify) para insertar el título real de la guía, que sigue
viniendo del metaobject (ya traducible por Translate & Adapt desde la
1.1) — las dos capas de traducción (textos fijos del bloque vs. contenido
de la guía) son independientes y se combinan en el mismo string.

## Decisión
Un único fichero de claves por idioma bajo el namespace `general` (no se
prevé necesitar más namespaces con solo 3 claves). `block_name` traduce el
nombre visible en el editor de temas (solo para Marketing/Dev, no
customer-facing) vía `"name": "t:general.block_name"` en el `{% schema %}`.

## Validación
`coolway-sandbox` solo tiene español publicado como idioma de tienda real
— igual que en la 3.7 con el árabe, no hay forma de generar tráfico real
en inglés/francés sin publicar esos idiomas (Fase 5). Se valida forzando
el locale de la visita (parámetro de URL `?locale=en`/`?locale=fr`, que
Shopify soporta de forma nativa incluso sin publicar el idioma en el
Admin, para previsualizar) y confirmando que los textos fijos cambian de
idioma sin afectar al contenido de la guía (que sigue en el idioma en que
esté escrito ese metaobject).
