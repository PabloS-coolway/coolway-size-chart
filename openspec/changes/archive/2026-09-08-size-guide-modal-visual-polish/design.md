## Context
El modal ya existe desde la 3.6-bis (backdrop + panel + botón de cierre
suelto). El RTL de la 3.7 ya usa propiedades lógicas para el botón de
cierre (`inset-inline-end`) — al moverlo dentro de una cabecera flex, esa
regla deja de hacer falta (el propio flujo flex ya respeta `dir`).

## Goals / Non-Goals
- Goal: cabecera del modal con más jerarquía visual (fondo oscuro,
  título + subtítulo, botón de cierre integrado) y fondo con blur, como
  en Kiwi.
- Goal: mantener intacto el comportamiento ya validado (3.6-bis): abrir,
  cerrar por 3 vías, gestión de foco, RTL, traducciones.
- Non-Goal: estilos de la tabla u otros bloques de contenido (3.11/3.12).

## Decisions
- **Título/subtítulo:** `product.title` como título principal (nombre
  real del producto, como en Kiwi) + `'general.block_name' | t` como
  subtítulo (ya existe en `locales/*.json`, usado también en el
  `{% schema %}` — reutilizado aquí sin añadir ninguna clave nueva).
- El botón de cierre pasa de posicionamiento absoluto a ser un hijo flex
  de la cabecera — se elimina el `inset-inline-end` (ya no aplica) y se
  ajusta su color a blanco para contrastar con el fondo oscuro de la
  cabecera.
- El padding del contenido se mueve del panel completo a un contenedor
  interior (`__content`), para que la cabecera pueda ocupar el ancho
  completo sin el padding general del panel.

## Risks / Trade-offs
- `backdrop-filter` no tiene soporte universal en navegadores muy
  antiguos — degradación aceptable: sin blur, el resto del overlay
  sigue funcionando igual (oscurecido, sin bloquear nada).
