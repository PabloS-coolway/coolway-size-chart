# Diseño — Panel lateral de edición de bloque

## Decisión 1 — Estado del panel a nivel de pantalla

`SizeGuideUnifiedEditor` guarda `openBlockId: string | null` (más el
caso especial de "sin selección"). Solo un `BlockRow` puede estar
"abierto" a la vez. Se pasa `isOpen` + `onOpen`/`onClose` como props a
cada `BlockRow` en vez de que cada fila gestione su propio estado de
apertura — necesario para que abrir uno cierre automáticamente
cualquier otro.

## Decisión 2 — Drawer con `position: fixed`, sin portal ni App Bridge Modal

Se descarta el Modal nativo de App Bridge (`Modal` de
`@shopify/app-bridge-react` o `<s-modal>`): añade una capa de API
adicional (title bar propio, eventos de apertura/cierre asíncronos)
para un caso que no la necesita. En su lugar, un `<div>` con
`position: fixed; inset: 0` para el backdrop y otro `position: fixed;
top:0; right:0; height:100dvh` para el panel en sí, ambos renderizados
directamente en el árbol de React (sin `createPortal`) — el iframe
embebido de la app es el propio viewport de la página, así que
`position: fixed` ya se comporta como overlay de pantalla completa
dentro de ese iframe, sin el problema de contexto de apilamiento visto
en el modal del storefront (3.13), porque aquí no hay ningún ancestro
con `position: sticky`/`z-index` propio de por medio.

## Decisión 3 — El formulario del bloque no cambia

El panel es un contenedor visual nuevo; el `<fetcher.Form>` con
`BlockFormFields` que ya existe se mueve dentro de él tal cual, sin
tocar campos ni el intent `save-block`. Al guardar con éxito
(`fetcher.data.ok`), además de mostrar el toast ya existente, se cierra
el panel automáticamente (`onClose()`).

## Decisión 4 — Cierre: botón, backdrop, Escape

Mismo patrón ya usado en el modal del storefront (3.6-bis): botón "×"
con `aria-label="Cerrar"`, clic en el backdrop, y un listener de
`keydown` para Escape mientras el panel está abierto. No se gestiona
foco de forma tan elaborada como en el storefront (no hay lectores de
pantalla de clientes finales en juego aquí, es panel de administración
interno) pero se devuelve el foco al botón "Editar" del bloque
correspondiente al cerrar, por accesibilidad básica.

## Decisión 5 — `AddBlockSection` no se toca

Fuera de alcance de esta parte (ver proposal.md). Sigue expandiéndose
inline al pulsar un tipo de bloque nuevo.

## Fuera de alcance

- Estilos de tabla editables (parte 2 de la 2.16).
- Animación de deslizamiento (transform/transition) — se añade un
  `transition: transform` simple pero no es requisito duro; si no
  queda bien a la primera, se ajusta en la validación visual.
