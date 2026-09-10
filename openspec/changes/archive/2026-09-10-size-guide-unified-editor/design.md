# Diseño — 2.15 Editor de guía unificado

## Contexto
Hoy `/app/size-guides/:id` (datos básicos), `/app/size-guides/:id/blocks`
(lista de bloques), `/app/size-guides/:id/blocks/:type/:blockId` (editor
de un bloque) y `/app/size-guides/:id/rule` (regla de asignación) son 4
rutas Remix independientes, cada una con su propio loader/action. Kiwi
resuelve todo en una sola pantalla. Se decide (10-sept-2026, confirmado
por Juanmi) ir a por la fusión completa en una sola pantalla, no una
fusión parcial.


## Decision 1 — Loader combinado
El loader de `app.size-guides.$id.tsx` pasa a hacer 3 llamadas GraphQL
en paralelo (`Promise.all`): la query de datos básicos (ya existente),
la de bloques (ya existente en `blocks.tsx`), y la búsqueda de regla
existente (ya existente en `rule.tsx`, recorre `size_guide_rule`
paginado). No se fusiona en una sola query GraphQL porque complicaría
el tipado y no hay problema real de rendimiento (3 llamadas en
paralelo, no en cadena).

## Decision 2 — Un fetcher por sección, no un solo formulario gigante
Para no perder el patrón ya probado (`useFetcher` + toast de App
Bridge) y para que guardar la regla no reenvíe también el título, se
mantienen 3 `fetcher` independientes en la misma página: uno para
datos básicos, uno para bloques (añadir/quitar/mover/editar), uno para
la regla. La `action` de la ruta despacha por un campo oculto
`intent` (mismo patrón ya usado en `blocks.tsx`: `intent=move` vs.
`intent=remove`), añadiendo `intent=save-guide`, `intent=save-rule`,
`intent=save-block`, `intent=add-block`.

## Decision 3 — Bloques inline como sección expandible
Cada bloque de la lista se renderiza colapsado (resumen: tipo + label,
igual que hoy) con un botón "Editar" que expande su formulario completo
en el mismo sitio (sin navegar), reutilizando los mismos campos que hoy
existen en `blocks_.$type.$blockId.tsx` por tipo (tabla con
`TableGridEditor`, texto con `RichTextEditor`, imagen, vídeo). Solo un
bloque puede estar expandido a la vez (estado local `expandedBlockId`),
para no sobrecargar la pantalla. "Añadir bloque nuevo" abre un formulario
vacío del tipo elegido en la misma posición, al final de la lista.

## Decision 4 — Migración de rutas
Las rutas `blocks.tsx`, `blocks_.$type.$blockId.tsx` y `rule.tsx` se
retiran como puntos de entrada de navegación (no se linkan desde
ningún sitio), pero sus ficheros no se borran todavía: sus loaders/
actions se extraen a funciones reutilizables en `app/lib/` cuando el
código se pueda compartir sin duplicar; si no compensa extraerlo, se
duplica el mínimo necesario dentro de `app.size-guides.$id.tsx` y las
rutas viejas quedan marcadas como obsoletas (comentario en cabecera)
hasta confirmar que nada externo las enlaza (p. ej. un enlace guardado
en favoritos del navegador de alguien del equipo).

## Fuera de alcance (explícito)
- Arrastrar y soltar para reordenar bloques (se mantienen los botones
  Subir/Bajar ya existentes).
- Cualquier cambio en el modelo de datos o en el storefront.
- Unificar también el listado de guías (`_index.tsx`) — sigue como
  pantalla propia, igual que en Kiwi.

## Riesgos
- Página con 3 fetchers y estado de expansión de bloques es más
  compleja que las 4 rutas simples actuales — más superficie para
  bugs de sincronización (p. ej. guardar un bloque y que la lista no
  se refresque). Mitigación: revalidar el loader completo tras
  cualquier guardado con éxito (patrón ya usado: `fetcher.load()` o
  dejar que Remix revalide automáticamente tras una action con
  `useFetcher`).
- Limitación ya conocida del entorno: el iframe de la app (túnel
  Cloudflare) no permite validar por inspección de DOM/foco desde
  fuera — la validación de esta tarea se hará por captura visual,
  igual que en la 2.12/2.13.
