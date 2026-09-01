# Motor de resolución de reglas — `app/lib/size-guide-resolver.ts`

**Tarea:** 2.2 — Motor de resolución de reglas
**Estado:** ✅ Completada y verificada — función pura implementada, con 15 tests unitarios en Vitest, **ejecutados por Juanmi con resultado 15/15 en verde** (31-ago-2026).
**Fecha:** 31-ago-2026

## Qué hace

`resolveSizeGuide(product, rules, guides)` recibe:
- **`product`** — tags, colecciones, tipo, vendor y título del producto a evaluar (`ProductMatchContext`).
- **`rules`** — todas las entradas `size_guide_rule` ya cargadas, con su `conditions` (JSON) deserializado (`SizeGuideRule[]`).
- **`guides`** — el `id` y `priority` de cada `size_guide` existente, para el desempate (`SizeGuideSummary[]`).

Y devuelve uno de tres resultados:
- `{ status: "resolved", sizeGuideId, matchedRuleIds }` — una guía gana claramente.
- `{ status: "no_match" }` — ninguna regla coincide con el producto.
- `{ status: "tie", tiedSizeGuideIds, matchedRuleIds }` — dos o más guías coinciden con exactamente la misma prioridad. **Decisión explícita de la 2.2: esto no se resuelve de forma automática** — se trata como aviso a revisar manualmente. El llamador (2.3/2.4) decide qué hacer (por ejemplo: no escribir el metafield y registrar un aviso para el equipo, en vez de elegir una al azar).

## Por qué es una función pura, sin llamadas a Shopify

Deliberado: `resolveSizeGuide` no hace ninguna llamada a la Admin API ni sabe nada de metaobjects reales — solo opera sobre datos ya cargados. Esto la hace:
- **Testeable sin mocks** (ver `size-guide-resolver.test.ts` — 15 tests, cubriendo ANY/ALL, combinación OR entre reglas de una misma guía, desempate por prioridad, el caso de empate total, y varios casos de datos corruptos/límite).
- **Reutilizable** desde el webhook de producto (2.3) y desde el recálculo masivo por cambio de regla (2.4) sin duplicar lógica — ambos cargarán los datos reales vía Admin API y llamarán a esta misma función.

La carga real de datos desde Shopify (leer `size_guide_rule`, `size_guide`, y las tags/colecciones del producto vía Admin API) se implementará como una capa aparte cuando se aborde la 2.3, para no mezclar "cómo se obtienen los datos" con "cómo se decide la guía" en el mismo módulo.

## Campos y operadores soportados

| Campo (`ConditionField`) | Operadores soportados |
|---|---|
| `tag` | `equals`, `not_equals` |
| `collection` | `equals` / `in_collection` (alias, mismo comportamiento), `not_equals` |
| `product_type` | `equals`, `not_equals` |
| `vendor` | `equals`, `not_equals` |
| `title` | `equals`, `not_equals`, `contains` |

Un campo desconocido en una condición (dato corrupto o versión futura no soportada) no lanza excepción — simplemente esa condición se evalúa como "no cumple", para que una sola regla mal formada no tumbe el recálculo de todo el catálogo.

## Decisiones tomadas junto con Juanmi antes de implementar

1. **Empate total de prioridad → aviso manual, no resolución automática.** Se descartó "elegir la más reciente/antigua" porque enmascararía un problema de configuración real (dos guías con exactamente la misma prioridad compitiendo por el mismo producto) detrás de un criterio arbitrario e invisible para el equipo.
2. **Ubicación: TypeScript, dentro de `app/`**, junto al resto del backend Remix — se creó la carpeta `app/lib/` (no existía) como convención para lógica de negocio pura, separada de las rutas (`app/routes/`).

## Validación realizada

1. La lógica se probó primero de forma aislada (fuera del repo, en JavaScript plano) contra 8 casos basados en datos reales del proyecto (la regla "Football" de la 1.3, desempate por prioridad, combinación OR, regla sin condiciones) antes de escribir la versión TypeScript final — los 8 casos pasaron.
2. Esos mismos casos, y varios más (15 en total), se dejaron como tests permanentes del repo en `size-guide-resolver.test.ts`.
3. **`npm install` + `npm run test` ejecutados por Juanmi en local (12-ago-2026):**
   ```
   ✓ app/lib/size-guide-resolver.test.ts (15)
     ✓ resolveSizeGuide (15)
       ✓ operador ANY (3)
       ✓ operador ALL (2)
       ✓ combinación OR entre varias reglas de la misma guía (2)
       ✓ desempate por prioridad entre guías distintas (2)
       ✓ casos límite y datos corruptos (5)
       ✓ operador contains en title (1)

   Test Files  1 passed (1)
        Tests  15 passed (15)
   ```
   Sin ningún test fallido — Vitest v2.1.9.

## Siguiente paso

2.3 — Webhook de recálculo por cambio de producto: construir la capa que carga los datos reales desde la Admin API (tags/colecciones del producto, todas las `size_guide_rule` y `size_guide`), llama a `resolveSizeGuide`, y escribe el resultado en el metafield `resolved_size_guide` del producto.
