## ADDED Requirements

### Requirement: Cabecera visual propia del modal
El modal de la guía de tallas SHALL mostrar una cabecera propia con
fondo oscuro, el nombre del producto como título y el nombre del bloque
traducido como subtítulo, con el botón de cierre integrado en esa
cabecera, y el fondo del overlay SHALL aplicar desenfoque (blur) sobre
el contenido de la página.

#### Scenario: Apertura del modal con cabecera y blur
- **WHEN** un visitante abre el modal de la guía de tallas
- **THEN** el panel SHALL mostrar una cabecera con fondo oscuro
  conteniendo el título (nombre del producto), el subtítulo (nombre del
  bloque traducido) y el botón de cierre, y el fondo detrás del modal
  SHALL aparecer desenfocado, sin alterar el resto del comportamiento ya
  validado (apertura, cierre por 3 vías, gestión de foco)
