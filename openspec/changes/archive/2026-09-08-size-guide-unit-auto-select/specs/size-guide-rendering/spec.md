## ADDED Requirements

### Requirement: Unidad por defecto según mercado en tablas de doble unidad
En tablas con `has_dual_unit_selector`, el bloque DEBE determinar cuál de
las dos unidades (métrica o imperial) se marca visualmente como la unidad
por defecto del visitante, a partir de `localization.country.iso_code`, sin
ocultar en ningún caso ninguna de las dos unidades ya renderizadas por la
tarea 3.4.

#### Scenario: Visitante en un país de sistema imperial
- **GIVEN** una tabla con `has_dual_unit_selector` activo
- **AND** `localization.country.iso_code` corresponde a un país de sistema
  imperial (EE.UU., Liberia, Myanmar)
- **WHEN** se renderiza el bloque
- **THEN** la columna/unidad en pulgadas se marca como la unidad por
  defecto
- **AND** la columna/unidad en cm se sigue mostrando igualmente

#### Scenario: Visitante en un país de sistema métrico
- **GIVEN** una tabla con `has_dual_unit_selector` activo
- **AND** `localization.country.iso_code` corresponde a un país de sistema
  métrico
- **WHEN** se renderiza el bloque
- **THEN** la columna/unidad en cm se marca como la unidad por defecto
- **AND** la columna/unidad en pulgadas se sigue mostrando igualmente

#### Scenario: Tabla sin selector de doble unidad
- **GIVEN** una tabla sin `has_dual_unit_selector`
- **WHEN** se renderiza el bloque
- **THEN** no se aplica ninguna lógica de unidad por defecto (el
  comportamiento es idéntico al de la 3.4)

#### Scenario: `localization.country` no disponible
- **GIVEN** una tabla con `has_dual_unit_selector` activo
- **AND** `localization.country` no resuelve un `iso_code` válido
- **WHEN** se renderiza el bloque
- **THEN** se aplica cm como unidad por defecto (fallback seguro, sin
  romper el renderizado)
