## Context
El bloque (3.2) solo comprueba existencia del metafield `resolved_size_guide`.
Hace falta leer su contenido real para poder renderizarlo en 3.4. El punto
crítico nunca probado: si `access: { storefront: "PUBLIC_READ" }` en las 6
definiciones de metaobject (1.4) permite de verdad que Liquid resuelva el
metaobject referenciado en un contexto storefront (no autenticado).

## Goals / Non-Goals
- Goal: confirmar con una prueba real en `coolway-sandbox` que
  `product.metafields.custom.resolved_size_guide.value.title` (y `.description`,
  `.blocks`) resuelve sin error.
- Goal: dejar documentado el hallazgo, sea cual sea el resultado.
- Non-Goal: renderizar visualmente cada tipo de bloque (3.4).
- Non-Goal: introducir una llamada explícita a la Storefront GraphQL API
  desde JS de cliente — se usa la resolución nativa de Liquid mientras
  funcione; si no funcionara, esa sería la alternativa a evaluar en un
  change posterior, no en este.

## Decisions
- Usar la resolución nativa de metaobjects en Liquid (acceso por punto sobre
  el metafield) en vez de una query GraphQL explícita, porque es el patrón
  estándar de Shopify para App Blocks SSR y evita añadir una dependencia de
  red en el render del PDP.
- Si la resolución en Liquid fallara por el acceso Storefront, no se
  intenta un workaround en este change — se documenta el hallazgo y se
  decide la vía alternativa (ej. revisar el acceso en las definiciones, o
  Storefront API vía JS) en un change dedicado.

## Risks / Trade-offs
- Riesgo principal (ya anotado en el proyecto): que el acceso Storefront no
  esté realmente resuelto pese a la configuración de la 1.4 — es la razón
  de ser de esta tarea.
- Riesgo menor: un producto con `resolved_size_guide` apuntando a un
  metaobject borrado (huérfano) — el bloque no debe romper, debe tratarse
  igual que "sin guía" (ver Scenario de acceso no resuelto en la spec).
