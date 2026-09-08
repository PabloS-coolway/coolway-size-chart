## ADDED Requirements

### Requirement: Comportamiento sin regresión para productos sin guía
Los cambios en la lectura (3.3) y el renderizado (3.4) del contenido de la
guía SHALL NOT alterar el comportamiento ya establecido en la 3.2 para un
producto sin `resolved_size_guide`: ningún elemento visible ni espacio
reservado en el layout del PDP.

#### Scenario: Producto sin guía tras añadir lectura y renderizado real
- **WHEN** un producto no tiene `product.metafields.custom.resolved_size_guide`
- **THEN** el bloque SHALL NOT renderizar ningún enlace, tabla, texto,
  imagen ni vídeo, y el contenedor que Shopify añade al App Block SHALL
  seguir colapsándose (sin hueco vacío en el layout), exactamente igual
  que en la 3.2, independientemente de cuánto contenido real gestione
  ahora el bloque para productos que sí tienen guía
