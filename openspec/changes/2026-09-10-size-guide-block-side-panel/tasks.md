## Implementación

- [x] `BlockRow`: quitar el formulario inline, dejar solo resumen +
      botón "Editar" en la cabecera de acciones.
- [x] `SizeGuideUnifiedEditor`: estado `openBlockId`; pasar `isOpen`/
      `onOpen`/`onClose` a cada `BlockRow`.
- [x] Panel lateral (backdrop + drawer) con el formulario del bloque
      abierto (mismo `BlockFormFields` + fetcher ya existentes).
- [x] Cierre por botón, backdrop y Escape; cierre automático al
      guardar con éxito.
- [x] Ampliación (pedida por el usuario tras validar la primera
      versión): `AddBlockSection` reutiliza el mismo panel lateral en
      vez de expandirse inline — botón único "+ Add Section" que abre
      el panel con una rejilla de tipos de bloque con icono (estilo
      Kiwi "Add new sections"); al elegir un tipo, el propio panel
      cambia a mostrar el formulario de creación de ese tipo, con
      botón "Volver a los tipos" para deshacer la selección.

## Validación

- [x] `tsc --noEmit` sin errores nuevos (mismo patrón TS7022
      preexistente).
- [x] Hot reload del dev server sin errores de compilación.
- [x] Captura visual: lista de bloques compacta, panel abre/cierra,
      formulario del bloque correcto en cada apertura. Validado por el
      usuario tras 3 rondas de ajuste (ancho del panel al 75% mínimo,
      y margen derecho de los textbox de la regla de asignación —
      la causa real era un `minWidth` que forzaba desbordamiento
      recortado por el contenedor, no una simple falta de margen).
- [x] Validación manual del usuario de guardar/mover/quitar un bloque
      existente desde el panel "Editar" — confirmado ("Perfecto. Lo
      todo bien").
- [x] Validación manual del usuario del flujo "+ Add Section": rejilla
      de tipos con icono, cambio a formulario al elegir tipo, "Volver
      a los tipos", y creación de bloque de principio a fin —
      confirmado en el mismo mensaje.
