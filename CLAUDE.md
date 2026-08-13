# CLAUDE.md — Reglas duras del proyecto

Repositorio: `coolway-size-chart` (app custom + Theme App Extension para la guía de tallas nativa de Coolway, sustituyendo Kiwi Size Chart).

Este archivo define las reglas que cualquier agente de IA (Claude Code u otro) debe respetar sin excepción en este repositorio, según el "Modelo de trabajo Shopify en Coolway" v1.0 (agosto 2026).

> ⚠️ Este archivo tiene dos secciones con **valores pendientes de confirmar por el equipo** (versión de API y dominios exactos de las 14 tiendas). Están marcadas con `[PENDIENTE]`. Rellénalas antes de darlo por definitivo — un `CLAUDE.md` con datos inventados es peor que no tenerlo.

## 1. Reglas de despliegue (no negociables)

- **El agente nunca despliega a una tienda de producción.** Ni temas, ni apps, ni metaobjects/metafields, ni ninguna configuración.
- El trabajo exploratorio y de desarrollo ocurre siempre en la **dev store** (`coolway-sandbox`, o la que corresponda). Nunca directamente en una tienda real.
- La validación de negocio sobre una tienda real se hace en **modo draft/preview de tema**, sin publicar, o en la **tienda piloto** ya validada — nunca saltando directamente a producción.
- El rollout a producción sigue siempre el orden: **piloto → 3 tiendas → resto**, con punto de control humano entre olas. Nunca un despliegue simultáneo a las 14 tiendas.
- **Nada se edita en producción a mano.** Ni el editor de código de temas del admin de Shopify, ni el admin de metaobjects/metafields, ni la configuración de la app instalada.

## 2. Código y despliegue

- **Temas:** solo vía la integración GitHub de Shopify. Todo cambio pasa por Pull Request con revisión humana obligatoria antes de mergear.
- **App:** repositorio propio (este), despliegue vía `shopify app deploy` ejecutado desde CI — nunca `shopify app deploy` manual contra producción desde una máquina local.
- **Metaobjects y metafields:** sus definiciones se crean y actualizan únicamente mediante el script idempotente del repo contra la Admin GraphQL API. Nunca se crean o editan a mano desde el admin de Shopify.
- **CI mínimo en cada PR:** `theme-check`, lint, y validación del schema GraphQL. Un PR no se mergea si estas comprobaciones no pasan.

## 3. Versión de la Admin API

- **Versión pineada: `2026-07`**, alineada en `shopify.app.toml` (`[webhooks] api_version`) y en `app/shopify.server.ts` (`ApiVersion.July26`).
- Nota de la revisión del 12 de agosto de 2026: se detectó que `shopify.app.toml` tenía `2026-10` mientras que `shopify.server.ts` seguía en `2026-07` (`ApiVersion.July26`), porque la versión instalada de `@shopify/shopify-api` (13.1.0) no incluye todavía el valor `October26` — solo llega hasta `July26`. Se corrigió `shopify.app.toml` a `2026-07` para que ambos archivos queden consistentes con lo que la librería instalada soporta realmente.
- **`2026-10` queda pendiente a propósito**, no por descuido: exige subir `@shopify/shopify-app-react-router` de `1.2.1` a `2.0.0` (salto de versión mayor, que a su vez arrastra `@shopify/shopify-api` a 14.x y una actualización del paquete de almacenamiento de sesión). Es un cambio con riesgo de romper cosas, así que se hace de forma deliberada — en su propia rama/PR, probado en dev store — no colado junto a este ajuste de versión.
- Shopify depreca versiones de API en ciclos de ~12 meses. Hay una tarea recurrente trimestral para revisar y, si toca, actualizar la versión pineada — no esperar a que se convierta en urgencia. La próxima revisión trimestral es el momento natural para abordar el upgrade a `2026-10` (y a `shopify-app-react-router@2.0.0`) con calma.
- El agente nunca debe generar código contra una versión de API distinta a la pineada aquí sin que sea una decisión explícita y documentada en una spec.

## 4. Tiendas de producción (14 tiendas del grupo)

Dominios confirmados por Juanmi (6 agosto 2026):

| Tienda | Dominio .myshopify.com | Estado |
|---|---|---|
| Coolway EU | `coolway1.myshopify.com` | Producción |
| Coolway US | `coolway-us.myshopify.com` | Producción |
| Coolway Chile | `coolway-chile.myshopify.com` | Producción |
| Coolway Perú | `coolway-peru.myshopify.com` | Producción |
| Coolway Colombia | `coolway-colombia.myshopify.com` | Producción |
| Coolway Sudáfrica | `coolway-sudafrica.myshopify.com` | Producción |
| Coolway India | `coolway-india.myshopify.com` | Producción |
| Coolway Australia | `coolway-australia.myshopify.com` | Producción |
| Coolway Escandinavia | `coolway-escandinavia.myshopify.com` | Producción |
| Coolway Uruguay | `coolway-uruguay.myshopify.com` | Producción |
| Coolway Argentina | `coolway-argentina.myshopify.com` | Producción |
| Coolway Dubai | `coolway-dubai.myshopify.com` | Producción |
| Coolway Costa Rica | `coolway-costa-rica.myshopify.com` | Producción |
| Coolway México | `coolway-mexico.myshopify.com` | **No operativa** — sin app Kiwi instalada, sin guías. No hay nada que migrar; pendiente decidir si lanza ya con la solución nativa cuando salga a producción. |

**Nota importante:** esto resuelve un punto que estaba abierto desde la tarea 0.1 — `coolway1.myshopify.com` no era un origen de sincronización sin identificar, sino el dominio real de **Coolway EU**. Coolway EU es la única tienda del grupo cuyo dominio `.myshopify.com` no sigue el patrón `coolway-<país>` (probablemente por ser la tienda original/más antigua). Actualizar esta conclusión también en `Coolway_Fase0_Resumen_0.1.docx` si el equipo la da por buena.

Cualquier dominio que no esté en esta tabla (y confirmado como tal) se trata como entorno no-producción por defecto.

## 5. Convención de nombrado de metaobjects y metafields

**Propuesta a validar con el equipo — no dar por definitiva sin aprobación explícita:**

- Namespace de app: `coolway_size_guide` (o el que se fije al crear la app en la Partner organization).
- Tipo de metaobject: `snake_case`, en singular, prefijado por claridad: p. ej. `size_guide`, `size_guide_row`, `size_system`.
- Claves (keys) de metafield: `snake_case`, descriptivas, sin abreviaturas ambiguas: p. ej. `size_unit`, `min_measurement_cm`, no `sz_u` o `min_cm`.
- Todo nombre debe ser estable de por vida — no se renombran tipos ni claves una vez hay datos reales en producción; se crea una nueva versión si hace falta cambiar la forma.
- Los 7 sistemas/unidades detectados en el inventario (CM, US, UK, EU, IN, JAP, FEET) y el sistema local COL (Colombia) deben mapearse a un catálogo cerrado de valores, no a texto libre — pendiente decidir si es catálogo global o configuración por tienda (ver decisiones abiertas del SDD).

## 6. Desarrollo asistido por IA

- **Shopify Dev MCP** conectado y activo: todo GraphQL y Liquid generado se valida contra los schemas reales antes de que el código llegue al repositorio.
- **OpenSpec** inicializado en este repo (`openspec/`): ningún desarrollo relevante empieza sin una spec — se propone con `/opsx:propose "idea"` antes de escribir código, y cada cambio produce un delta de spec.
- El agente nunca despliega a tienda de producción (repetido aquí a propósito — es la regla más importante de este archivo).
- Todo cambio pasa por PR con revisión humana.
- El trabajo exploratorio ocurre siempre en dev store.

## 7. Entornos

- **Dev store:** `coolway-sandbox` (vía Partners) — catálogo representativo: multi-idioma, tallas reales, casos borde (incluye replicar los casos atípicos reales detectados en 0.1: selector de doble unidad, IDs numéricos sin nombre, etc.).
- **Draft/preview de tema:** en tiendas reales, para validar negocio sin publicar.
- **Tienda piloto:** `[PENDIENTE — decidir cuál de las 14 tiendas es la piloto]`.
- **Producción:** las 14 tiendas listadas en la sección 4 (13 operativas + México pendiente de lanzamiento).
