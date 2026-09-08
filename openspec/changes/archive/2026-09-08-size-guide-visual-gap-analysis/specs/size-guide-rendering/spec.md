## ADDED Requirements

### Requirement: Inventario de gaps visuales previo al rediseño
Antes de aplicar cualquier cambio de estilo visual al bloque (3.11-3.13),
SHALL existir un inventario documentado de diferencias concretas contra
el widget real de Kiwi en producción.

#### Scenario: Inventario documentado
- **WHEN** se compara el modal actual del bloque contra el widget real
  de Kiwi visto en una tienda de producción
- **THEN** SHALL existir un documento (`docs/visual-design-gap-analysis.md`)
  con la lista de diferencias concretas y una prioridad sugerida, sin
  ningún cambio de código en esta tarea
