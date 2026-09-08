## Context
Cada subtarea de la Fase 3 (3.1-3.8) se validó de forma aislada, contra
`theme check` y/o comprobaciones puntuales en `coolway-sandbox`. Nunca se
había repetido el recorrido completo tal como lo haría un cliente real:
entrar a la ficha de producto, ver el enlace, hacer clic, ver el
contenido — sin herramientas de desarrollador ni parámetros forzados.

## Goals / Non-Goals
- Goal: confirmar visualmente, en el storefront público (no en el editor
  de temas ni con JavaScript de test), que el flujo completo funciona de
  extremo a extremo sobre un producto real con guía asignada.
- Non-Goal: cualquier cambio de código o de diseño visual (eso es
  3.10-3.14, bloque aparte).

## Decisions
- No se toca código. Se verifica y se formaliza como criterio de
  aceptación explícito en la spec: "recorrido completo verificado de
  extremo a extremo, sin herramientas de desarrollador, sobre el
  storefront público real".

## Risks / Trade-offs
- Ninguno nuevo — es el cierre de verificación de un bloque de trabajo ya
  construido y validado pieza a pieza en 3.1-3.8.
