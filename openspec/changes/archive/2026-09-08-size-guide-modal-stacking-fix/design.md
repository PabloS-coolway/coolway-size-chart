## Context
Regla CSS clave: el z-index solo se compara DENTRO del mismo contexto de
apilamiento. Un ancestro con `position` distinto de `static` y un
`z-index` explícito (aquí: `.product-details.sticky-content--desktop`,
sticky, z-index: 1) crea un nuevo contexto — cualquier z-index interno,
por alto que sea, queda comparado solo dentro de ese contexto, y el
contexto entero se compara hacia fuera usando el z-index DEL ANCESTRO
(1), no el del hijo.

## Goals / Non-Goals
- Goal: que el modal cubra siempre toda la página, header incluido,
  independientemente de en qué contenedor del tema quede insertado el
  bloque.
- Non-Goal: cambiar el marcado inicial del bloque en el DOM del PDP (el
  `<a>` disparador y el hueco del bloque siguen donde Shopify los coloca
  vía el editor de temas) — solo se mueve el modal en sí, por JS, al
  abrirse.

## Decisions
- **Mover el nodo a `document.body`** en vez de, por ejemplo, forzar
  `isolation: isolate` en todos los ancestros del tema (inviable — no
  controlamos el CSS del tema) o usar un `<dialog>` nativo (cambio de
  API mayor, fuera de alcance de un fix puntual). Mover el nodo es el
  patrón estándar para modales en apps que no controlan el árbol DOM
  completo del host.
- Guardia `if (modal.parentElement !== document.body)` para que
  reabrir el modal varias veces no lo mueva repetidamente ni cree
  duplicados.

## Risks / Trade-offs
- Mover el nodo cambia su posición en el DOM (deja de estar dentro de
  `.coolway-size-guide-block`) — sin impacto observado: el modal no
  depende de estilos heredados de ese contenedor (todo su CSS es
  autocontenido), y las referencias (`aria-controls`, `getElementById`)
  siguen funcionando por `id`, no por posición en el árbol.
