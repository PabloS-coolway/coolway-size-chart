# 3.6-bis — Modal/overlay interactivo

Change OpenSpec: `size-guide-modal-overlay`.

## Motivo
Desde la 3.2/3.4 el bloque generaba el HTML de contenido de la guía pero
no lo ocultaba hasta el clic en el enlace — quedaba pintado directamente en
la ficha de producto. Detectado por Juanmi en vivo sobre "Goal Green
Forest". No era una regresión de ninguna tarea concreta: el modal se dejó
explícitamente como "trabajo aparte" desde la 3.4 y nunca se llegó a
construir.

## Implementación
`.coolway-size-guide-block__content` se envuelve en un modal propio
(`hidden` por defecto) con backdrop, panel y botón "Cerrar". JS mínimo
inline (primer JS de cliente del bloque, hasta ahora 100% SSR): abre al
clic en el enlace, cierra con el botón, con clic en el backdrop o con
Escape; mueve el foco al modal al abrir y lo devuelve al enlace al cerrar.

## Validado con datos reales
- `theme check` (vía `shopify app dev`) sin errores nuevos.
- "Goal Green Forest" (`goal-green-forest-mujer`): carga inicial solo
  muestra el enlace; clic abre el modal con la tabla real; los 3 métodos
  de cierre (botón, backdrop, Escape) funcionan y devuelven al estado
  oculto.
- "Nilo Altitude Hike" (`nilo-kak`, sin guía): sin trigger, sin contenido,
  bloque vacío — sin regresión respecto a 3.2/3.5.
- Sin errores de consola tras la carga de la página.

## Pendiente / fuera de alcance
Gestión de foco avanzada tipo "focus trap" completo (ciclar el tab dentro
del modal) no implementada — se priorizó abrir/cerrar/foco básico, que
cubre el criterio de accesibilidad mínimo. RTL (3.7) y traducciones del
texto "Cerrar" (3.8) quedan para sus tareas correspondientes.
