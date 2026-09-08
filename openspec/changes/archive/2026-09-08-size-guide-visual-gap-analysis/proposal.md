# Inventario y comparativa visual con Kiwi (3.10)

## Why
El bloque funcional ya está completo (Fase 3, 3.1-3.9), pero se
construyó sin ningún ajuste visual propio — hereda solo la tipografía
base del tema. Antes de tocar CSS (3.11-3.13) hace falta un inventario
concreto de diferencias contra el widget real de Kiwi, no solo la
impresión general de que "se ve en bruto".

## What Changes
- Ningún cambio de código: esta tarea es un inventario/documento, no una
  implementación (mismo patrón que 3.5/3.9, tareas de verificación sin
  código).
- Se visita el widget real de Kiwi en producción (`coolway.com`, no
  `coolway-sandbox`, solo para OBSERVAR — sin tocar ninguna
  configuración) y se compara contra el modal actual del bloque en
  `coolway-sandbox`.
- Entregable: `docs/visual-design-gap-analysis.md`, con la lista de
  diferencias concretas que alimentan directamente 3.11/3.12/3.13.

## Capabilities
- Modified: `size-guide-rendering` (añade el criterio de aceptación de
  que exista un inventario de gaps visuales documentado antes de 3.11)

## Impact
- Ningún archivo de código modificado.
- Visita de solo lectura a una tienda real de producción
  (`coolway.com`), sin iniciar sesión en su Admin ni cambiar nada.
