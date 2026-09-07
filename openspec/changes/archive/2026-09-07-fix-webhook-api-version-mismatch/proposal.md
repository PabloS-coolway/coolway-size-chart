# Fix: discrepancia de API version entre webhooks y la app

## Why
`shopify.app.toml` declara `[webhooks] api_version = "2026-10"`, mientras que
`app/shopify.server.ts` usa `ApiVersion.July26` (2026-07) para toda la Admin
API de la app. Esta discrepancia se detectó durante la tarea 3.2 (revisión de
`shopify.app.toml`) y quedó anotada como hallazgo no bloqueante en
`docs/app-block-base.md`. A fecha de hoy (2026-09-07) la versión "2026-10" ni
siquiera está aún estabilizada (las versiones trimestrales de Shopify se
estabilizan en su mes de release), por lo que declarar webhooks contra ella es
un riesgo real, no solo una inconsistencia cosmética.

## What Changes
- Alinear `api_version` en `[webhooks]` de `shopify.app.toml` a `"2026-07"`,
  igual que `ApiVersion.July26` en `app/shopify.server.ts`.
- No se toca ninguna suscripción de webhook existente (topics, filtros, URIs).
- Fuera de alcance: limpiar el scaffold residual `[metaobjects.app.example]`
  de `shopify.app.toml` (hallazgo distinto, ya documentado, no relacionado con
  la versión de API).

## Capabilities
- Modified: `webhook-configuration` (nueva capability documentada; no existía
  spec previa para la configuración de webhooks de este proyecto)

## Impact
- Archivos: `shopify.app.toml`
- Requiere `shopify app deploy` (o `shopify app config push`) contra
  `coolway-sandbox` para que el cambio de `api_version` se aplique a las
  suscripciones de webhook ya registradas — anotado en tasks.md como paso de
  verificación, no de código.
