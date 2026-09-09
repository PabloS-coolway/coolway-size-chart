## ADDED Requirements

### Requirement: Estilo visual de la tabla de tallas
La tabla de tallas SHALL mostrar una barra de grupo con fondo oscuro (a
todo el ancho) con la etiqueta del bloque y la unidad, cabeceras de
columna visualmente diferenciadas (fondo distinto, mayúsculas), filas
del cuerpo con alternancia de color (zebra striping) y la primera celda
de cada fila en negrita, sin alterar los datos mostrados (mismas
cabeceras, filas y unidades ya cubiertos por el requisito de
"Renderizado de cada tipo de bloque de contenido").

#### Scenario: Tabla simple
- **WHEN** se renderiza un bloque de tabla sin selector de doble unidad
- **THEN** la tabla SHALL mostrar la barra de grupo con la etiqueta y
  unidad, cabeceras de columna diferenciadas visualmente, zebra
  striping en las filas del cuerpo y la primera celda de cada fila en
  negrita

#### Scenario: Tabla con selector de doble unidad
- **WHEN** se renderiza un bloque de tabla con `has_dual_unit_selector`
- **THEN** la barra de grupo SHALL seguir mostrando ambas unidades
  (comportamiento ya establecido en 3.6), con el mismo tratamiento
  visual que el resto de tablas

#### Scenario: Tabla en dirección RTL
- **GIVEN** el bloque se renderiza con `dir="rtl"` (3.7)
- **WHEN** se muestra una tabla de tallas
- **THEN** la barra de grupo y las cabeceras de columna SHALL adaptarse
  a esa dirección sin romper el layout ni perder el tratamiento visual
