## ADDED Requirements

### Requirement: Dirección de texto según idioma de la visita
El bloque SHALL renderizar con `dir="rtl"` cuando `request.locale.iso_code`
corresponda a un idioma de escritura de derecha a izquierda (árabe,
hebreo, persa/farsi, urdu), y con `dir="ltr"` en cualquier otro caso. El
posicionamiento visual del enlace, el modal y la tabla SHALL adaptarse a
esa dirección sin romper el layout ni el criterio de "sin regresión para
productos sin guía" (3.5).

#### Scenario: Visita en idioma RTL
- **GIVEN** `request.locale.iso_code` es un idioma RTL (ar, he, fa, ur)
- **WHEN** se renderiza el bloque
- **THEN** el contenedor raíz del bloque tiene `dir="rtl"`
- **AND** el botón de cierre del modal y el resto de elementos posicionados
  se adaptan a esa dirección (sin quedar fuera de la caja ni superpuestos)

#### Scenario: Visita en idioma LTR
- **GIVEN** `request.locale.iso_code` no es ninguno de los idiomas RTL
  soportados
- **WHEN** se renderiza el bloque
- **THEN** el contenedor raíz del bloque tiene `dir="ltr"` (comportamiento
  idéntico al de las tareas 3.2-3.6-bis)

#### Scenario: Producto sin guía en idioma RTL
- **GIVEN** un producto sin `resolved_size_guide`
- **AND** `request.locale.iso_code` es un idioma RTL
- **WHEN** se renderiza el bloque
- **THEN** no se muestra ningún enlace, modal ni contenido (comportamiento
  de 3.2/3.5, independiente de la dirección de texto)
