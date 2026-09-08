# Caso "sin guía asignada" — cierre de verificación (3.5)

## Why
La 3.2 ya implementó el comportamiento base para productos sin
`resolved_size_guide` (no renderizar nada, sin hueco vacío en el layout).
La 3.5 pide confirmar explícitamente que ese comportamiento se mantiene
ahora que la 3.3/3.4 añadieron lectura y renderizado real de contenido —
un cambio en esas tareas podría haber introducido una regresión (por
ejemplo, un `<div>` o `<table>` que se renderice incluso sin guía).

## What Changes
- Ningún cambio de código: esta tarea es una verificación explícita, no
  una nueva funcionalidad.
- Se documenta formalmente el resultado de repetir la comprobación con
  "Nilo Altitude Hike" (producto sin `resolved_size_guide`) tras los
  cambios de 3.3 y 3.4, y se deja constancia explícita en la spec de que
  el comportamiento sigue siendo el mismo.
- Fuera de alcance: cualquier cambio de UX para este caso (ya decidido:
  no renderizar nada) — eso pertenece a la 3.1, ya cerrada.

## Capabilities
- Modified: `size-guide-rendering` (formaliza como requisito explícito lo
  que hasta ahora era un efecto colateral verificado informalmente en cada
  tarea anterior)

## Impact
- Ningún archivo de código modificado.
- Repetir manualmente la comprobación visual en `coolway-sandbox` con
  "Nilo Altitude Hike" tras los cambios de 3.3/3.4.
