# Límite del export de Kiwi y trabajo manual pendiente por guía

**Confirmado por escrito por atención al cliente de Kiwi (22-sept-2026).**

Kiwi **solo puede exportar los bloques de tipo tabla** de cada guía. Los
bloques de texto, los bloques de imagen y la configuración de la regla de
asignación (las colecciones/productos que disparan cada guía) **no son
exportables bajo ninguna forma** — la única manera de consultarlos es
entrando al panel de Kiwi guía por guía y mirándolos a mano.

Esto se comprobó primero por inspección directa de un export real de
atención al cliente (`Coolway Charts/<Tienda>/Currently Published/*.csv`,
formato `_source_file, tables, title` con `tables` como JSON de `{id, data}`
por bloque de tabla — sin ningún campo de texto/imagen/regla) y después se
confirmó explícitamente por escrito con Kiwi.

## Tooling construido a partir de ese límite

Con el límite ya cerrado, se automatizó todo lo que si es exportable:

- [`scripts/build-guide-manifest-from-kiwi-export.js`](../../scripts/build-guide-manifest-from-kiwi-export.js) —
  convierte el CSV de export de Kiwi de una tienda en un manifiesto JSON
  válido para el migrador, con los bloques de tabla ya completos. Los
  bloques de texto/imagen y las condiciones de la regla quedan marcados
  explícitamente como `"TODO"` en el JSON generado — es lo único que Kiwi
  no exporta y que hay que rellenar a mano.
- [`scripts/migrate-store-guides.js`](../../scripts/migrate-store-guides.js) —
  migrador genérico e idempotente: lee un manifiesto JSON por tienda y
  crea/actualiza los metaobjects (`size_guide` + bloques) y la regla
  (`size_guide_rule`) vía Admin GraphQL API, usando `legacy_kiwi_id` como
  clave de idempotencia (nunca sobreescribe una guía ya migrada).

Con el generador ya se han producido manifiestos en `data/migration/` para
las 13 tiendas con guías Kiwi reales (Chile ya venía afinado a mano desde
antes; Argentina, Australia, Colombia, Costa Rica, Dubai, Escandinavia, EU,
India, Perú, Sudáfrica, Uruguay y US generados automáticamente).

## Trabajo manual que queda, por guía

Ya no hace falta transcribir ninguna tabla a mano — solo esto, por cada
guía de cada manifiesto:

1. Confirmar en el panel de Kiwi si la guía lleva bloques de texto/imagen
   (antes o después de las tablas) y, si los lleva, transcribirlos al
   manifiesto (sustituyendo el `"TODO"` generado).
2. Identificar en el panel de Kiwi las colecciones/productos reales de la
   regla de asignación de cada guía (no vienen en ningún export). Las
   condiciones referenciadas solo por ID numérico de colección se ignoran
   directamente al migrar — ver la Fase 5.0 del proyecto: esos IDs no
   conectan con ninguna colección real.

Este trabajo se hace **tienda por tienda, en el orden de las olas de
rollout** (piloto → 3 tiendas → resto — ver Fase 5.1/5.2 del proyecto), no
de golpe para las 14 tiendas.

## Pendiente aparte, específico de US y EU

Sus manifiestos generados (42 guías cada uno) todavía no incorporan las
decisiones de saneamiento de la Fase 5.0.4 (fusionar el duplicado
"2003 men", descartar las 3 guías huérfanas de US) — hay que aplicarlas a
mano sobre `data/migration/coolway-us.json` antes de usarlo en una
migración real.

## Estado de Chile (tienda piloto)

`data/migration/coolway-chile.json` ya no tiene ningún `"TODO"` de
contenido — se verificó directamente en el panel real de Kiwi (Admin de
`coolway-chile`) para las guías KIZUNA y GOAL. El único pendiente que queda
ahí es puramente técnico: subir la imagen del diagrama a Shopify Files
(`uploadImageFile`) y fijar el GID real en el momento de ejecutar la
migración real (Fase 5.3), no antes.
