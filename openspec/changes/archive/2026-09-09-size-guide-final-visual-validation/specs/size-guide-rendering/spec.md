## ADDED Requirements

### Requirement: Validación visual final en desktop y móvil
El conjunto de rediseños visuales (3.11 tabla, 3.12 aviso de ajuste y
tipografía, 3.13 modal/overlay) SHALL funcionar correctamente en
conjunto, tanto en un viewport de escritorio como en uno móvil, sin
regresión en el caso sin guía ni en la dirección RTL.

#### Scenario: Recorrido completo en desktop
- **WHEN** un visitante abre la guía de tallas en un viewport de
  escritorio
- **THEN** el modal, la tabla, el aviso de ajuste y el resto de
  bloques SHALL mostrarse correctamente, sin solapamientos ni
  regresiones entre las tareas 3.11/3.12/3.13

#### Scenario: Recorrido completo en móvil
- **WHEN** un visitante abre la guía de tallas en un viewport móvil
- **THEN** el modal SHALL seguir siendo usable (visible, con scroll si
  hace falta) y la tabla SHALL permanecer legible, con scroll
  horizontal propio si su contenido no cabe en el ancho disponible, sin
  que el modal completo requiera scroll horizontal

#### Scenario: Sin regresión en móvil para producto sin guía
- **GIVEN** un producto sin `resolved_size_guide`
- **WHEN** se visita en un viewport móvil
- **THEN** no SHALL mostrarse ningún enlace, modal ni contenido
  (comportamiento ya establecido, independiente del viewport)
