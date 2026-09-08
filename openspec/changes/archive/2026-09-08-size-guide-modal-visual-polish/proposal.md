# Pulido del modal/overlay (3.13)

## Why
La 3.10 documentó 6 gaps visuales concretos contra el widget real de
Kiwi. Se prioriza empezar por el modal (marco), antes que el contenido
que va dentro (tabla en 3.11, resto de bloques en 3.12): fondo plano sin
blur, botón de cierre suelto sin cabecera propia — el cambio con más
impacto visual y menos esfuerzo (CSS sobre elementos que ya existen
desde la 3.6-bis).

## What Changes
- Backdrop del modal: añadir `backdrop-filter: blur()` y oscurecer
  ligeramente, como en Kiwi.
- Cabecera propia del modal: barra con fondo oscuro, título (nombre del
  producto) + subtítulo (nombre del bloque traducido), con el botón de
  cierre integrado dentro de esa barra (ya no suelto/flotante).
- Esquinas más redondeadas y padding más generoso en el panel.
- Sin cambios de comportamiento: sigue siendo el mismo modal (abrir con
  clic, cerrar con botón/backdrop/Escape, foco gestionado igual).
- Fuera de alcance: estilos de la tabla (3.11) y del resto de bloques de
  contenido (3.12).

## Capabilities
- Modified: `size-guide-rendering` (añade el criterio de aceptación de
  cabecera propia + blur en el modal)

## Impact
- `extensions/size-guide-block/blocks/size_guide.liquid`: nueva
  estructura de cabecera dentro del panel del modal + CSS actualizado.
- Validación en `coolway-sandbox` únicamente.
