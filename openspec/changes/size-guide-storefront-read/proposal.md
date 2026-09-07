# Lectura de la guía resuelta vía Storefront API/Liquid (3.3)

## Why
El App Block (3.2) hoy solo comprueba si `product.metafields.custom.resolved_size_guide`
existe, sin leer su contenido real. Para renderizar la guía de verdad (3.4) hace
falta primero confirmar cómo se lee ese contenido desde el storefront, y
validar el punto crítico nunca probado hasta ahora: si
`access: { storefront: "PUBLIC_READ" }` (activado en las 6 definiciones de
metaobject desde la 1.4) realmente permite el acceso público necesario.

## What Changes
- Extender `extensions/size-guide-block/blocks/size_guide.liquid` para resolver
  el metaobject referenciado por `resolved_size_guide` (título, descripción,
  lista `blocks`) usando la resolución nativa de Liquid
  (`product.metafields.custom.resolved_size_guide.value.<campo>`), no una
  llamada GraphQL explícita — es la vía estándar de Shopify para leer
  metaobjects referenciados desde un App Block SSR.
- Validar contra `coolway-sandbox` que el acceso "Storefront: Public read"
  de las 6 definiciones (1.4) es en efecto lo que permite esta resolución en
  Liquid; si no lo fuera, documentar el hallazgo real y ajustar.
- Seguir sin renderizar el contenido visual de cada bloque (tabla/texto/
  imagen/vídeo) — eso es la 3.4. Aquí solo se trae y se deja disponible el
  dato (ej. mostrado de forma mínima/depuración para confirmar que llega).
- Fuera de alcance: parseo de `headers`/`rows` JSON de la tabla (3.4);
  cualquier llamada real a la Storefront GraphQL API desde JS de cliente
  (no se ha decidido que haga falta; Liquid ya resuelve el dato en SSR).

## Capabilities
- Modified: `size-guide-rendering` (añade requisito de lectura de contenido)

## Impact
- Archivos: `extensions/size-guide-block/blocks/size_guide.liquid`
- Riesgo principal: que el acceso Storefront público de los metaobjects no
  esté realmente resuelto pese al `access` declarado en el script de la 1.4
  — es la pregunta abierta central de esta tarea, nunca antes probada.
