# webhook-configuration Specification

## Purpose

Configuración de la API version usada por los webhooks declarados en
`shopify.app.toml`, para que se mantenga siempre coherente con la API version
que usa el resto de la app (Admin GraphQL API en `app/shopify.server.ts`).

## Requirements

### Requirement: Coherencia de API version entre webhooks y la app
La `api_version` declarada en `[webhooks]` de `shopify.app.toml` SHALL
coincidir siempre con la `ApiVersion` usada en `app/shopify.server.ts`. Un
cambio en una de las dos SHALL ir acompañado del mismo cambio en la otra en el
mismo commit.

#### Scenario: Ambas versiones coinciden
- **WHEN** se revisa `shopify.app.toml` y `app/shopify.server.ts`
- **THEN** el valor de `[webhooks] api_version` y el de `ApiVersion.*` usado
  en `shopify.server.ts` SHALL representar la misma versión trimestral (ej.
  "2026-07" y `ApiVersion.July26`)

#### Scenario: Subir la versión de la app
- **WHEN** se actualiza `ApiVersion.*` en `app/shopify.server.ts` a una nueva
  versión trimestral
- **THEN** `[webhooks] api_version` en `shopify.app.toml` SHALL actualizarse
  al mismo valor como parte del mismo cambio
