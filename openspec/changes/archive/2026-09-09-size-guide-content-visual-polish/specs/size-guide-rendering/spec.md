## ADDED Requirements

### Requirement: Estilo visual del aviso de ajuste y del resto de bloques
La descripción de la guía (`resolved_guide.description`) SHALL mostrarse
como una caja destacada tipo "aviso" (fondo diferenciado, borde de
acento), y los bloques de contenido (texto, imagen, vídeo, tabla) SHALL
mantener un espaciado uniforme entre sí. El texto enriquecido SHALL
tener un tratamiento tipográfico propio (interlineado, jerarquía de
encabezados), y las leyendas de imagen/vídeo SHALL distinguirse
visualmente del resto del texto.

#### Scenario: Guía con descripción
- **WHEN** una guía tiene `description` con valor
- **THEN** SHALL mostrarse en una caja destacada (fondo diferenciado y
  borde de acento) antes del resto del contenido

#### Scenario: Guía con varios bloques de contenido
- **WHEN** una guía resuelve varios bloques de distinto tipo
- **THEN** SHALL mantenerse un espaciado uniforme entre ellos,
  independientemente del tipo de bloque

#### Scenario: Bloque de imagen o vídeo con leyenda
- **WHEN** un bloque de imagen o vídeo tiene `caption` con valor
- **THEN** la leyenda SHALL mostrarse con un tratamiento tipográfico
  diferenciado del resto del texto (tamaño reducido, color atenuado)
