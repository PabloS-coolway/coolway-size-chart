## ADDED Requirements

### Requirement: Visibilidad del contenido de la guía como modal
El contenido de la guía (tabla/texto/imagen/vídeo generado por las tareas
3.3/3.4/3.6) SHALL permanecer oculto por defecto en la carga de la página,
y SHALL mostrarse únicamente como resultado de una interacción explícita
del visitante con el enlace "Guía de tallas: ...", en línea con la
decisión UX "Link modal" de la tarea 3.1.

#### Scenario: Carga inicial de un producto con guía
- **GIVEN** un producto con `resolved_size_guide` resuelto
- **WHEN** se carga la página de producto
- **THEN** el enlace "Guía de tallas: ..." es visible
- **AND** el contenido de la guía (tabla/texto/imagen/vídeo) NO es visible

#### Scenario: Clic en el enlace de la guía
- **WHEN** el visitante hace clic en el enlace "Guía de tallas: ..."
- **THEN** el contenido se muestra en un modal/overlay sobre la página

#### Scenario: Cierre del modal
- **GIVEN** el modal está abierto
- **WHEN** el visitante hace clic en el botón "Cerrar", hace clic fuera del
  modal (en el fondo), o pulsa la tecla Escape
- **THEN** el modal se cierra y el contenido vuelve a quedar oculto

#### Scenario: Producto sin guía
- **GIVEN** un producto sin `resolved_size_guide`
- **WHEN** se carga la página de producto
- **THEN** no existe ningún modal ni enlace de guía de tallas (comportamiento
  ya establecido en 3.2/3.5, sin cambios)
