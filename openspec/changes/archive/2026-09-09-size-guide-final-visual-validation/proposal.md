# 3.14 — Validación visual final y responsive

## Why
Las 3 tareas de diseño visual (3.13 modal/overlay, 3.11 tabla, 3.12
aviso de ajuste + tipografía) se validaron cada una por separado, sobre
todo en desktop. Falta una pasada final que las vea todas juntas y,
sobre todo, en **móvil** — ningún viewport pequeño se ha probado todavía
en ninguna de las 3 tareas anteriores. Cierra la fase de diseño visual
de contenido (3.10-3.14) antes de pasar a la Fase 2 revisitada
(2.12-2.14).

## What Changes
- Ningún cambio de código previsto de antemano: esta es una tarea de
  verificación (mismo patrón que la 3.9), no de funcionalidad nueva.
- Si la validación responsive encuentra un problema real, se corrige
  aquí mismo y se documenta como hallazgo (mismo patrón que el bug de
  la 3.13 y el de RTL encontrado en la 3.12).
- Alcance de la validación: viewport de escritorio (ya cubierto en
  3.10-3.13, se repite como control) y viewport móvil (nuevo), sobre
  al menos: una guía con tabla simple, una con selector de doble
  unidad, una con descripción (fit note), y el caso sin guía.

## Capabilities
- Modified: `size-guide-rendering` (formaliza el criterio de aceptación
  "validado visualmente en desktop y móvil" como cierre de las tareas
  de diseño visual 3.10-3.14)

## Impact
- Ningún archivo de código modificado de antemano; posible ajuste de
  CSS si el responsive revela un problema real.
- Validado exclusivamente en `coolway-sandbox`, nunca en tienda real.
