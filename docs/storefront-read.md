# 3.3 — Lectura de la guía resuelta vía Storefront (Liquid)

Change OpenSpec: `size-guide-storefront-read`.

## Pregunta crítica de la tarea
¿Funciona de verdad `access: { storefront: "PUBLIC_READ" }`, activado en las 6
definiciones de metaobject desde la 1.4, para que el App Block pueda leer el
contenido del metaobject `size_guide` referenciado por
`resolved_size_guide`?

**Respuesta: sí, funciona sin ningún ajuste adicional.**

## Qué se hizo
`size_guide.liquid` ahora resuelve el metaobject con la sintaxis nativa de
Liquid:

```liquid
{%- assign resolved_guide = product.metafields.custom.resolved_size_guide.value -%}
```

`resolved_guide` es directamente el metaobject `size_guide` referenciado (no
un ID ni un GID) — se puede acceder a `resolved_guide.title`,
`resolved_guide.description`, `resolved_guide.blocks`, etc. como si fueran
propiedades normales de Liquid. No hace falta ninguna llamada explícita a la
Storefront GraphQL API: la resolución ocurre en el propio render SSR del
tema.

## Validación real en coolway-sandbox

- **"Goal Green Forest"** (`goal-green-forest-mujer`, tiene `resolved_size_guide`
  desde la Fase 2): el storefront público muestra
  `Guía de tallas: Guía de tallas - Calzado adulto` — el título real de la
  guía referenciada, leído en vivo.
- **"Nilo Altitude Hike"** (`nilo-kak`, sin `resolved_size_guide`): sigue sin
  mostrar nada, igual que en la 3.2 — ni enlace ni hueco vacío.

Verificado directamente sobre el storefront público de `coolway-sandbox`
(no solo el editor de temas), con `shopify app dev` activo.

## Hallazgo operativo aparte (no de producto)
Al levantar `shopify app dev` para esta validación, el puerto 9293 volvía a
estar ocupado por un proceso `node.exe` huérfano de una sesión de trabajo
anterior (mismo patrón que en la 3.2) — cerrado con permiso explícito antes
de continuar. Terminado ese proceso, el dev server levantó sin problema.

## Pendiente para la 3.4
Renderizar visualmente cada tipo de bloque (`size_guide_block_table`,
`_text`, `_image`, `_video`) de la lista `resolved_guide.blocks` — aquí solo
se confirmó que el título llega; el resto de campos (`description`, y sobre
todo el JSON `headers`/`rows` de las tablas) no se ha tocado todavía.
