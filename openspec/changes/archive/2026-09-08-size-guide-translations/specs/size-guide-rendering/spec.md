## ADDED Requirements

### Requirement: Traducción de los textos fijos del bloque
Los textos fijos del bloque (el prefijo del enlace/título del modal y el
`aria-label` del botón de cierre) SHALL leerse de los ficheros de
localización de la extensión (`locales/en.default.json`, `es.json`,
`fr.json`) en vez de estar hardcodeados, y SHALL mostrarse en el idioma
real de la visita cuando esté entre los soportados (English, Spanish,
French), cayendo al idioma por defecto (English) en cualquier otro caso.
Esto es independiente de la traducción del contenido de la guía en sí
(metaobjects, ya cubierta desde la 1.1).

#### Scenario: Visita en español
- **GIVEN** el idioma de la visita es español
- **WHEN** se renderiza el bloque
- **THEN** el enlace/título del modal usa el texto fijo en español y el
  botón de cierre tiene `aria-label` en español

#### Scenario: Visita en inglés
- **GIVEN** el idioma de la visita es inglés
- **WHEN** se renderiza el bloque
- **THEN** el enlace/título del modal usa el texto fijo en inglés y el
  botón de cierre tiene `aria-label` en inglés

#### Scenario: Visita en francés
- **GIVEN** el idioma de la visita es francés
- **WHEN** se renderiza el bloque
- **THEN** el enlace/título del modal usa el texto fijo en francés y el
  botón de cierre tiene `aria-label` en francés

#### Scenario: Idioma no soportado
- **GIVEN** el idioma de la visita no es ninguno de los 3 soportados
- **WHEN** se renderiza el bloque
- **THEN** los textos fijos se muestran en inglés (idioma por defecto de
  la extensión)

#### Scenario: Título de la guía en su propio idioma
- **GIVEN** un producto con `resolved_size_guide` cuyo título está escrito
  o traducido en un idioma concreto
- **WHEN** se renderiza el bloque en cualquiera de los 3 idiomas
  soportados
- **THEN** el título de la guía se muestra tal como está en el metaobject,
  combinado con el texto fijo ya traducido del bloque
