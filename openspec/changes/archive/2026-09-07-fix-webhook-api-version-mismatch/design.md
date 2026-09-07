## Context
`shopify.app.toml` y `app/shopify.server.ts` declaran cada uno su propia API
version, sin ninguna validación cruzada. Se han desincronizado en algún punto
anterior de Fase 2/3 sin que nada lo detectara.

## Goals / Non-Goals
- Goal: dejar ambos valores coherentes hoy, con "2026-07" (la versión
  estable y ya en uso por el resto de la app).
- Non-Goal: automatizar la validación cruzada entre ambos ficheros (fuera de
  alcance de este fix puntual; se podría abordar más adelante con un check
  en CI si el equipo lo considera necesario).
- Non-Goal: limpiar el scaffold `[metaobjects.app.example]` residual.

## Decisions
- Bajar `[webhooks] api_version` de "2026-10" a "2026-07" (en vez de subir
  `ApiVersion.July26` a una versión más nueva), porque "2026-10" no está
  confirmada como estable a día de hoy (2026-09-07) y no hay ninguna razón
  funcional documentada para necesitar una versión más nueva que la que ya
  usa el resto de la Admin API.

## Risks / Trade-offs
- Riesgo: si alguna suscripción de webhook actual dependiera de un campo o
  topic solo disponible en 2026-10, bajar la versión podría romperla. No hay
  evidencia de eso en las suscripciones actuales (todas usan topics estables
  desde hace varias versiones); se verificará con `shopify app deploy` en
  `coolway-sandbox` como parte de las tareas.
