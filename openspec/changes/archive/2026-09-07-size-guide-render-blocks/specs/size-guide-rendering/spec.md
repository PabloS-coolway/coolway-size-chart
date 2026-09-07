## ADDED Requirements

### Requirement: Renderizado de cada tipo de bloque de contenido
Cuando el bloque resuelve un `resolved_guide` con `blocks` no vacío, el
sistema SHALL recorrer los metaobjects ya resueltos (`blocks.value`) y
renderizar cada entrada según el campo distintivo que tenga
(`headers`+`rows` para tabla, `content` para texto, `image` para imagen,
`video_url` para vídeo), respetando el orden en que aparecen. Un bloque en
estado Draft, de tipo no reconocido, o cuyos campos no resuelven SHALL
omitirse en silencio (sin romper el renderizado del resto de bloques ni de
la página).

#### Scenario: Guía con bloque de tabla
- **WHEN** un bloque resuelto tiene `headers` y `rows` con valor
- **THEN** el sistema SHALL renderizar una tabla HTML con esas cabeceras y
  filas (ya parseadas vía `.value`), en el mismo orden que los datos

#### Scenario: Tabla con selector de doble unidad
- **WHEN** un bloque de tabla tiene `has_dual_unit_selector` a `true`
- **THEN** el sistema SHALL mostrar de forma visible ambas unidades
  (`unit_primary` y `unit_secondary`), sin necesidad de que el bloque
  implemente él mismo la lógica de conversión entre unidades

#### Scenario: Guía con bloque de texto
- **WHEN** un bloque resuelto tiene `content` con valor
- **THEN** el sistema SHALL renderizar su contenido (texto enriquecido)
  recorriendo la estructura ya parseada de `.value`, sin necesidad de
  ningún filtro de parseo externo

#### Scenario: Guía con bloque de imagen
- **WHEN** un bloque resuelto tiene `image` con valor
- **THEN** el sistema SHALL renderizar una etiqueta de imagen con `image`,
  `alt_text` (como atributo alt) y `caption` (si tiene valor)

#### Scenario: Guía con bloque de vídeo
- **WHEN** un bloque resuelto tiene `video_url` con valor
- **THEN** el sistema SHALL renderizar un reproductor/embed con
  `video_url` y `caption` (si tiene valor)

#### Scenario: Bloque en estado Draft
- **WHEN** un bloque referenciado en `blocks` está en estado Draft
- **THEN** el sistema SHALL NOT mostrarlo (no aparece siquiera en
  `blocks.value`), sin lanzar ningún error de Liquid visible en la página

#### Scenario: Bloque con campos que no resuelven
- **WHEN** un bloque resuelto no tiene ninguno de los campos distintivos
  esperados, o un campo obligatorio está vacío
- **THEN** el sistema SHALL omitir ese bloque concreto sin lanzar ningún
  error de Liquid visible en la página, y sin afectar al renderizado del
  resto de bloques
