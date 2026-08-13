# Metaobject `size_guide_rule`

**Tarea:** 1.3 — Definición del modelo de reglas de asignación
**Estado:** ✅ Completada — metaobject creado y validado con una entrada de prueba en `coolway-sandbox.myshopify.com`, enlazada a la guía de prueba de la 1.1.
**Fecha:** 11-ago-2026

## Decisión de diseño: dirección de la referencia

La regla apunta a la guía (`size_guide_rule.size_guide` → `size_guide`), **no al revés**. Esto permite que una misma guía tenga varias reglas independientes que se combinan como OR entre ellas — reproduce el patrón real de Kiwi documentado en la 0.1, donde una guía se activa si se cumple la regla A **o** la regla B, y cada regla evalúa sus propias condiciones con un operador ANY/ALL interno.

**Consecuencia práctica:** `size_guide` (1.1) no necesita ningún campo nuevo para esto — a diferencia de `blocks` (1.2), que sí se añadió como campo de `size_guide` porque ahí la relación es "la guía contiene sus bloques". Aquí es al revés: "la regla decide a qué guía activa", así que el campo de referencia vive en `size_guide_rule`.

## Campos

| Etiqueta (Admin) | Key | Tipo | Notas |
|---|---|---|---|
| Size guide | `size_guide` | Metaobjeto (referencia simple) → `size_guide` | A qué guía activa esta regla si se cumple. Referencia simple (no mixta), ya que solo apunta a un tipo |
| Root operator | `root_operator` | Lista de opciones (Texto de una sola línea): `ANY`, `ALL` | Replica el operador raíz que ya se registró guía por guía en el inventario de la 0.1 |
| Conditions | `conditions` | JSON | Array de condiciones `{field, operator, value}`. Ej.: `[{"field":"tag","operator":"equals","value":"football"},{"field":"collection","operator":"in_collection","value":"calzado-hombre"}]` |
| Legacy Kiwi ID | `legacy_kiwi_id` | Texto de una sola línea | Trazabilidad contra el inventario de la 0.1, mismo criterio ya usado en `size_guide` y en los bloques |

**Sobre la prioridad:** no hay campo de prioridad en `size_guide_rule`. Ya vive en `size_guide.priority` (definido en la 1.1) — es donde tiene sentido el desempate ("prioridad entre guías", tal como lo pide el criterio de aceptación de la 1.3), no entre reglas individuales de una misma guía.

**Sobre los 9 casos de IDs numéricos sin nombre (hallazgo de la tarea 0.1 — "Inventario de guías publicadas y tipos de bloque", no de la 0.2):** el informe `Coolway_Fase0_Resumen_0.1.docx` documenta que 9 de las 13 tiendas con Kiwi (EU, US, Chile, Perú, Colombia, Escandinavia, Uruguay, Argentina) tienen colecciones o productos referenciados solo por ID numérico en las condiciones de match de Kiwi, sin nombre legible. El campo `value` dentro de `conditions` guarda ese ID como texto igual de bien que un handle legible — no bloquea este esquema. Queda como nota de seguimiento en el contexto del proyecto: conviene resolver ese saneamiento antes de la Fase 5 (migración real de reglas), para no arrastrar IDs opacos al sistema nuevo.

## Validación realizada

Se creó una entrada de prueba en `coolway-sandbox`:

- **Size guide:** "Guía de tallas — Calzado adulto" (la entrada de prueba de la 1.1)
- **Root operator:** `ANY`
- **Conditions:** `[{"field":"tag","operator":"equals","value":"football"},{"field":"collection","operator":"in_collection","value":"calzado-hombre"}]`
- **Legacy Kiwi ID:** `Football`
- **Estado:** Active
- **Resultado:** "Entrada agregada" — guardado sin errores. Entry ID: `229442093161`.

**Nota de UI:** el campo `Root operator` (Lista de opciones) se renderiza como un `<select>` HTML nativo en el formulario de entrada. Al automatizar la selección por navegador, el clic simulado directamente sobre la opción del desplegable no siempre registra el cambio — funcionó de forma fiable usando teclado (flecha abajo + Enter) en vez de clic. No afecta al uso manual normal en el Admin, solo es una nota para quien vuelva a automatizar esto.

## Siguiente paso

1.4 — Estrategia de despliegue de definiciones multi-tienda: script idempotente contra la Admin GraphQL API para crear/actualizar `size_guide`, los 4 `size_guide_block_*` y `size_guide_rule` en las 14 tiendas reales (por ahora solo existen en `coolway-sandbox`).
