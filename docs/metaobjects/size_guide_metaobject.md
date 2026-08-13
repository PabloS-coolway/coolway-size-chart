# Metaobject `size_guide`

**Tarea:** 1.1 — Definición del metaobject `size_guide`
**Estado:** ✅ Completada — definición creada, revisada y validada con una entrada de prueba en `coolway-sandbox.myshopify.com`.
**Fecha:** 07-ago-2026 (revisión de campos el mismo día tras repaso conjunto; campo `Blocks` añadido el mismo día al completar la 1.2)

## Ubicación en Shopify Admin
`Configuración → Metacampos y metaobjetos → Definiciones de metaobjetos → Guía de tallas`
URL directa (sandbox): `https://admin.shopify.com/store/coolway-sandbox/settings/custom_data/metaobjects/size_guide`

## Definición

| Propiedad | Valor |
|---|---|
| Nombre | Guía de tallas |
| Tipo (handle) | `size_guide` |
| Estados activo/borrador | Habilitado (se usa el estado nativo de Shopify — no hay campo `status` propio) |
| Traducciones | Habilitado (Translate & Adapt, soporte de los 12+ idiomas del alcance v1) |
| Publicar entradas como páginas web | Deshabilitado |
| Acceso a la API de tiendas online (Storefront API) | Habilitado (necesario para el render SSR desde la Theme App Extension) |
| Acceso a la API de cuentas de cliente | Deshabilitado |

## Campos

| Etiqueta (Admin, ES) | Key interno | Tipo | Traducible | Obligatorio | Descripción |
|---|---|---|---|---|---|
| Título | `title` | Texto de una sola línea (máx. 70 caracteres) | Sí | Sí (por convención) | Título visible en el PDP/modal de la guía (ej. "Guía de tallas — Calzado adulto") |
| Descripción | `description` | Texto enriquecido | Sí | No | Texto introductorio antes de la tabla — equivalente al bloque "Texto" detectado en el 53% de las guías en la 0.1. Se eligió texto enriquecido (no texto plano) porque en la 0.1 se vieron frases con énfasis ("runs small") e instrucciones tipo "¿Cómo medir tu pie?" que pueden necesitar negrita/enlaces |
| Prioridad | `priority` | Entero | No | No (default `0`) | Desempate cuando varias guías podrían aplicar al mismo producto — lo usa el motor de reglas (1.3, ver `size_guide_rule.md`) |
| Legacy Kiwi ID | `legacy_kiwi_id` | Texto de una sola línea | No | No | Nombre exacto de la guía original en Kiwi — ver convención más abajo |
| Blocks | `blocks` | Lista de Referencia mixta → `size_guide_block_table`, `size_guide_block_text`, `size_guide_block_image`, `size_guide_block_video` | — | No | Bloques de contenido en orden — el orden de la lista es el orden de render. Añadido al completar la tarea 1.2 (ver `size_guide_blocks.md`) |

**Nota sobre las etiquetas:** las etiquetas visibles en el Admin están en español (para el equipo de Marketing, que es quien rellena el contenido según el README del repo del tema), pero las *keys* internas se mantuvieron en inglés (`title`, `description`, `priority`, `legacy_kiwi_id`, `blocks`) para que el código de la Theme App Extension y de la app use nombres consistentes con el resto del proyecto.

**Nota técnica sobre el cambio de `description`:** el tipo de un campo no se puede cambiar una vez guardado en Shopify. Para pasar de "Texto multilínea" a "Texto enriquecido" hubo que eliminar el campo original y crear uno nuevo con la misma key (`description`), en dos guardados separados (el borrado y la creación no pueden ir en el mismo guardado porque Shopify valida que la key no esté "en uso" en el momento de guardar). Como consecuencia, la entrada de prueba perdió el texto que tenía en `description` — se ha vuelto a rellenar.

**Nota técnica sobre `Blocks`:** confirmado en la práctica que Shopify permite un campo de tipo "Referencia mixta" que apunte a varios metaobjects distinto a la vez (con un selector de checkboxes por tipo destino), sin necesidad de campos de lista separados por tipo de bloque.

**Sobre las reglas de asignación (1.3):** `size_guide` **no tiene ni necesita** un campo de referencia a `size_guide_rule`. La relación va en la otra dirección: cada entrada de `size_guide_rule` referencia a la guía que activa (`size_guide_rule.size_guide` → `size_guide`), no al revés. Esto permite que una misma guía tenga varias reglas independientes combinadas como OR entre ellas. Ver `size_guide_rule.md` para el detalle completo.

### Convención para `legacy_kiwi_id`

Para que este campo sirva de verdad como trazabilidad de QA contra el inventario de la 0.1, su valor debe ser **el nombre exacto de la guía tal como aparece en el panel de Kiwi de esa tienda**, idéntico al recogido en las pestañas "0.1.1" a "0.1.13" del Excel — sin normalizar mayúsculas, sin traducir, sin recortar espacios.

- Ejemplo correcto: `Camisetas Lavada US` (tal cual aparece en Coolway US).
- Ejemplo incorrecto: `camisetas-lavada-us` o `Camisetas lavada (US)` — no coincide literalmente con el inventario y rompe la trazabilidad.
- **Guías duplicadas dentro de la misma tienda** (ej. "2003 men" en Coolway US, detectado en la 0.1 como duplicado exacto candidato a fusionar): si al migrar no se ha fusionado todavía, añadir un sufijo secuencial según el orden en que aparecen en el panel de Kiwi: `2003 men (1)`, `2003 men (2)`.
- Como cada tienda tiene su propio conjunto de entradas de metaobject (los metaobjects son datos por tienda), no es necesario prefijar con el nombre de la tienda dentro del propio valor. El mismo criterio aplica al `legacy_kiwi_id` de `size_guide_rule`.

## Decisiones de diseño

- **No hay campo `status` propio**: se usa el estado nativo Active/Draft de Shopify para entradas de metaobject, evitando duplicar lógica de publicación.
- **`priority` es un entero simple**, no una enumeración.
- **`assignment_rules` nunca se añadió como campo** (ver nota más arriba) — decisión tomada al completar la 1.3, no un pendiente.

## Validación realizada

### 1.1 — Entrada de prueba inicial
Se creó una entrada de prueba en `coolway-sandbox` para confirmar el flujo completo:

- **Título:** "Guía de tallas — Calzado adulto"
- **Descripción:** "Consulta tu talla habitual y compárala con la tabla de equivalencias en cm."
- **Prioridad:** 0
- **Legacy Kiwi ID:** `Football` — actualizado tras fijar la convención (guía nativa real de Coolway EU, documentada en la 0.1). El valor de ejemplo inicial (`kiwi-eu-calzado-adulto-35-46`) se usó antes de definir la convención y ya no está en la entrada.
- **Estado:** Active
- **Identificador autogenerado:** `guia-de-tallas-calzado-adulto`
- **Resultado:** "Entrada agregada" — guardado sin errores. Entry ID: `229329305705`.

### 1.2 — Enlace de bloques (ver `size_guide_blocks.md`)
Se enlazó desde `Blocks` una entrada de `size_guide_block_table` ("Calzado adulto") a esta misma entrada de prueba — guardado sin errores.

### 1.3 — Enlace de regla de asignación (ver `size_guide_rule.md`)
Se creó una entrada de `size_guide_rule` que referencia a esta misma entrada de prueba — guardado sin errores.

## Revisión posterior a la 1.1 (mismo día)

Tras un repaso conjunto, se aplicaron 4 ajustes sobre la definición inicial:

1. Etiquetas visibles renombradas a español (Título/Descripción/Prioridad), manteniendo las keys en inglés.
2. `description` cambiado de texto plano a texto enriquecido.
3. `title` limitado a 70 caracteres máximo.
4. Definida la convención de `legacy_kiwi_id` (ver arriba) antes de crear entradas reales.

Se decidió mantener `priority` tal cual, sin cambios.

## Siguiente paso

1.4 — Estrategia de despliegue de definiciones multi-tienda: script idempotente contra la Admin GraphQL API para crear/actualizar `size_guide`, los 4 `size_guide_block_*` y `size_guide_rule` en las 14 tiendas reales (por ahora solo existen en `coolway-sandbox`).
