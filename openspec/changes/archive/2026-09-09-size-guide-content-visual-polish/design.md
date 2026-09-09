# Design — 3.12 Fit note y tipografía general

## Context
`resolved_guide.description` ya se renderiza incondicionalmente antes
del bucle de bloques (implementado desde la 1.1/3.4). No existe ningún
campo "fit note" separado en el modelo de metaobjects, y crear uno
nuevo sería trabajo de Fase 1/2 fuera de alcance de un rediseño visual
de storefront. La descripción ocupa exactamente la posición que Kiwi
usa para su aviso de ajuste — encima de toda la tabla/contenido.

## Goals
- Dar al aviso de ajuste el mismo tratamiento visual que Kiwi
  (caja destacada) reutilizando el campo ya existente, sin migración de
  contenido ni cambios de esquema.
- Homogeneizar el espaciado entre bloques y la tipografía del texto
  enriquecido y las leyendas de imagen/vídeo.

## Non-Goals
- No se añade ningún campo nuevo al modelo de datos.
- No se decide aquí si el contenido real de cada guía debe reescribirse
  para aprovechar la descripción como aviso de ajuste — eso es una
  decisión de contenido/negocio, no de este rediseño.

## Decisions
- **Reutilizar `description`, no crear un campo nuevo.** Alternativa
  descartada: añadir un campo `fit_note` al metaobject `size_guide`.
  Se descarta porque duplicaría la función de `description` (que ya
  se muestra siempre en la misma posición) y obligaría a migrar
  contenido real de las 123 guías existentes sin necesidad.
- **Espaciado uniforme vía una clase común.** En vez de margen
  específico por tipo de bloque, se añade `margin-block-end` uniforme
  a los contenedores ya existentes (`__text`, `__image`, `__video`,
  `__table-wrap`) — ya son selectores distintos, así que no hace falta
  una clase adicional envolvente.
- **Headings del rich-text:** se mantiene el `<strong>` ya usado (no se
  amplía a `<h3>`/`<h4>` reales para no reabrir el snippet innecesariamente)
  y se sube su tamaño vía CSS con un selector que apunte a ese `<strong>`
  dentro de `.coolway-size-guide-block__text` — riesgo aceptado: un
  `<strong>` normal dentro del mismo bloque de texto (no un heading)
  también heredaría el tamaño mayor. Documentado como limitación menor,
  ya que el snippet no distingue "strong dentro de párrafo" de "heading"
  en el HTML resultante (ambos son `<strong>`). Si esto resulta
  visible en contenido real, ampliar el snippet para usar `<h4>` real
  quedaría como mejora futura, no bloqueante para el rollout.

## Risks / Trade-offs
- El límite de "heading vs. strong normal" (ver arriba) es una
  limitación conocida y aceptada, no un bug oculto.
- El estilo de "fit note" se aplica siempre a `description`, aunque el
  contenido real de esa guía no sea un aviso de ajuste (podría ser una
  descripción genérica). Aceptado: Kiwi también usa una posición fija
  para este contenido, y el propio dato decide qué se lee ahí.
