## Context
La estructura del bloque ya está diseñada para este caso desde la 3.2: todo
el contenido va dentro de `{%- if resolved_guide -%}`, y la 3.3/3.4 no han
tocado esa condición exterior — solo han añadido contenido DENTRO de ella.
Por diseño, si `resolved_guide` es `nil`, ninguna de las líneas añadidas en
3.3/3.4 llega a ejecutarse.

## Goals / Non-Goals
- Goal: verificar explícitamente (no solo por inspección de código) que no
  hay regresión, repitiendo la prueba visual real en `coolway-sandbox`.
- Non-Goal: cualquier cambio de comportamiento o de código.

## Decisions
- No se toca código. Se verifica y se formaliza como requisito explícito
  en la spec, para que quede como contrato exigible en futuras tareas
  (3.6, 3.7, 3.8) que también van a tocar este mismo fichero.

## Risks / Trade-offs
- Ninguno nuevo — es una tarea de verificación sobre una garantía de
  diseño ya existente desde la 3.2.
