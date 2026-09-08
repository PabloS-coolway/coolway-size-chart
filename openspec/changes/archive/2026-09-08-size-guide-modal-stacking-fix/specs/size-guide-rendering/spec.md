## MODIFIED Requirements

### Requirement: Cabecera visual propia del modal
El modal de la guía de tallas SHALL mostrar una cabecera propia con
fondo oscuro, el nombre del producto como título y el nombre del bloque
traducido como subtítulo, con el botón de cierre integrado en esa
cabecera, y el fondo del overlay SHALL aplicar desenfoque (blur) sobre
TODA la página, incluido cualquier header/menú del tema —
independientemente de en qué contenedor del tema quede insertado el
bloque en el DOM.

#### Scenario: Apertura del modal con cabecera y blur
- **WHEN** un visitante abre el modal de la guía de tallas
- **THEN** el panel SHALL mostrar una cabecera con fondo oscuro
  conteniendo el título (nombre del producto), el subtítulo (nombre del
  bloque traducido) y el botón de cierre, y el fondo detrás del modal
  SHALL aparecer desenfocado, sin alterar el resto del comportamiento ya
  validado (apertura, cierre por 3 vías, gestión de foco)

#### Scenario: El overlay cubre el header del tema
- **WHEN** el bloque está insertado dentro de un contenedor del tema que
  crea su propio contexto de apilamiento CSS (position + z-index propio)
- **THEN** el modal SHALL seguir cubriendo visualmente toda la página,
  incluido el header/menú, moviéndose fuera de ese contexto si hace
  falta
