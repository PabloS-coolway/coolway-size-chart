# Panel de administración — Implementación (tarea 2.10)

Documento acumulativo: cada pieza del desglose de la 2.10 se añade aquí a medida que se completa.

---

## Pieza A — Dashboard (listado de guías)

**Estado:** ✅ Completada y verificada visualmente en `coolway-sandbox`.
**Fecha:** 01-sept-2026

### Qué hace

`app/routes/app.size-guides._index.tsx` — nueva pantalla dentro de la propia app, accesible desde el enlace "Guías de tallas" en la navegación (`app.tsx`). Lista todas las entradas `size_guide` de la tienda: título (en negrita, línea propia), y en una segunda línea: estado (Activa/Borrador), prioridad, Legacy Kiwi ID y el enlace "Editar".

### Decisiones de alcance (para no disparar el coste de esta pieza)

- **No muestra la regla de asignación de cada guía.** Cruzar cada guía con sus `size_guide_rule` correspondientes requeriría cargar todas las reglas y relacionarlas en memoria (como hace el motor de resolución de la 2.2) — no aporta valor imprescindible solo para un listado.
- **Sin paginación.** Se cargan hasta 50 guías de una sola vez (el inventario de la 0.1 confirma que ninguna tienda se acerca a ese límite).
- **El enlace "Editar" apunta a una ruta que todavía no existe** (`/app/size-guides/:id`) — se construye en la Pieza B. Da 404 esperado hasta entonces, confirmado al probarlo.

### Dos correcciones visuales tras la prueba real

1. **Estado pegado al título** ("...adultoActiva"): las cajas (`s-box`) con `minInlineSize` no reservaban separación visual real. Corregido con un separador de texto explícito (` · `) en vez de depender de esa propiedad de layout sin verificar.
2. **`fontWeight="bold"` en `<s-text>` no pone nada en negrita** en la práctica. Corregido usando la etiqueta HTML nativa `<strong>` en su lugar.

**Lección aplicada a las siguientes piezas:** para negrita/énfasis, usar HTML nativo (`<strong>`, `<em>`); para separación visual entre elementos en línea, usar separadores de texto explícitos, no props de layout sin verificar.

### Componentes usados (verificados por uso real)

`s-page`, `s-section`, `s-box`, `s-stack`, `s-text`, `s-link`, `s-paragraph` (del scaffold original) + `<strong>` (HTML nativo). Evitadas deliberadamente etiquetas sin confirmar como `s-table` o `s-badge`.

### Pendiente para la Pieza G (pulido visual, al final)

- Badges de color para el estado, chips de condiciones de la regla (requiere cargar y cruzar `size_guide_rule`), botones Duplicate/Delete (mutaciones nuevas), fecha relativa de actualización, barra de búsqueda/filtros. Coste estimado alto.

---

## Pieza E — Informe de productos sin guía

**Estado:** ✅ Completada y verificada en `coolway-sandbox` — 727 de 728 productos mostrados correctamente.
**Fecha:** 01-sept-2026

### Qué hace

`app/routes/app.products-without-guide.tsx` — nueva pantalla, enlace "Productos sin guía" en la navegación. Recorre todo el catálogo de la tienda (paginado) y lista los productos cuyo metafield `custom.resolved_size_guide` está vacío — equivalente a "View products without size charts" de Kiwi (decisión 6 de la 2.9).

### Por qué es más ligero que el recálculo de la 2.4

No reutiliza `fetchAllProductContexts` (que trae tags/colecciones/tipo/vendor — todo lo necesario para *resolver* una guía) ni llama al motor de resolución — aquí solo hace falta comprobar si el metafield ya está poblado o no. Consulta deliberadamente más ligera (`id`, `title`, y el metafield), sin recalcular nada.

### Sin acción de "recalcular" desde aquí

Es un informe de solo lectura. Si un producto aparece aquí por error, la forma de corregirlo es ajustar o crear una regla de asignación (1.3/2.2), no algo que se resuelva desde este informe.

### Validación realizada

Con el estado real de `coolway-sandbox` (1 producto con el tag `football` resuelto, 727 sin guía tras la última prueba de la 2.4): la pantalla mostró correctamente **727 de 728 productos** sin guía, con el listado completo.

### Pendiente para la Pieza G (pulido visual, al final)

- **Cargar más / scroll infinito.** Con 727 productos en una sola carga, la lista actual es muy larga para desplazarse a mano — anotado por Juanmi tras la prueba real. La consulta ya está paginada internamente (100 por página, vía cursor) para traer los datos del servidor; falta la parte de UI: paginar también la *visualización* (botón "Cargar más" o scroll infinito), en vez de renderizar los 727 de golpe en el navegador.

---

## Pieza B — Editor de guía: datos básicos

**Estado:** ✅ Completada y verificada — guardado confirmado correcto, sin tocar campos que no debía.
**Fecha:** 01-sept-2026

### Qué hace

`app/routes/app.size-guides.$id.tsx` — ruta dinámica (`/app/size-guides/:id`), la que ya enlazaba el botón "Editar" de la Pieza A. Formulario para título, descripción, prioridad y estado (Activa/Borrador) de una guía, con guardado real vía mutación `metaobjectUpdate`.

### Validación realizada (01-sept-2026, contra la guía de prueba real)

Los 2 puntos que estaban marcados como "sin verificar" quedaron confirmados correctos:
1. **La forma de `MetaobjectUpdateInput`** (`fields` + `capabilities.publishable.status`) es correcta — el guardado funciona sin errores.
2. **Es un PATCH parcial, no un reemplazo completo.** Se cambió la prioridad varias veces (0→1→0) y se comprobó en el Admin nativo (Contenido → Metaobjetos) que tanto `legacy_kiwi_id` ("Football") como el campo `Blocks` (el bloque de tabla enlazado desde la 1.2) siguieron intactos tras cada guardado. Este era el riesgo más importante de esta pieza, y queda descartado.

### Corrección de UX tras la primera prueba: no se veía ningún mensaje de guardado

Con `<Form method="post">` de react-router, el guardado funcionaba (confirmado al volver a entrar en la guía, el valor nuevo ya estaba ahí) pero no aparecía ningún mensaje de "guardado correctamente" ni de error en pantalla. Se sustituyó por `useFetcher` + un aviso vía App Bridge (`shopify.toast.show(...)`) — el mismo patrón ya usado y probado en `app._index.tsx` (el ejemplo del propio scaffold), en vez de introducir un mecanismo nuevo sin confirmar.

### Limitación conocida y documentada: descripción como texto plano

`description` es un campo de texto enriquecido (`rich_text_field`), guardado como una estructura JSON. Esta pieza lo trata como texto plano en el formulario — al guardar, se reconstruye como un único párrafo sin formato. **Riesgo real:** si la guía tuviera negrita o enlaces en su descripción, se perderían al guardar desde este editor. Aceptable ahora porque la guía de prueba real no usa ningún formato enriquecido.

### Componentes de formulario: HTML nativo, no componentes de Shopify

`<input>`, `<textarea>`, `<select>`, `<button>` normales — mismo criterio que `<strong>` en la Pieza A.

---

## Pieza D — Editor de la regla de asignación

**Estado:** ✅ Completada y verificada — guardado confirmado correcto.
**Fecha:** 01-sept-2026

### Qué hace

`app/routes/app.size-guides.$id_.rule.tsx` — ruta anidada bajo la guía (`/app/size-guides/:id/rule`), enlazada desde el editor de la Pieza B ("Editar regla de asignación"). Formulario para el `root_operator` (ANY/ALL) y las condiciones de la regla asociada a esa guía.

### Decisiones de alcance (para no disparar el coste de esta pieza)

1. **Solo gestiona UNA regla por guía en esta primera versión.** El modelo de datos (1.3) permite varias reglas por guía combinadas como OR entre ellas, pero la guía de prueba real solo tiene 1 — cubre el caso actual. Gestionar varias reglas por guía (añadir/quitar reglas completas, no solo condiciones) queda como mejora futura explícita.
2. **Hasta 5 condiciones fijas por regla**, no una lista dinámica de "añadir fila" con JavaScript — las filas vacías se ignoran al guardar. Mantiene el formulario en HTML nativo puro, sin necesitar estado de cliente. Si algún día hace falta más de 5 condiciones en una regla real, es una ampliación pequeña (subir el número), no una reescritura.

### Cómo encuentra la regla de una guía

No existe forma de filtrar la consulta de `metaobjects` directamente por el valor de un campo de referencia — se recorren TODAS las `size_guide_rule` (paginado) y se busca la primera cuyo campo `size_guide` apunte a esta guía, igual que hace el motor de resolución (2.2). Volumen bajo, aceptable.

### Crear vs. actualizar

Si la guía no tiene ninguna regla todavía, el formulario aparece vacío y al guardar se **crea** una regla nueva (`metaobjectCreate`, con el campo `size_guide` apuntando a esta guía). Si ya existe una, el formulario se rellena con sus datos y al guardar se **actualiza** (`metaobjectUpdate`), reutilizando el mismo patrón de la Pieza B (`useFetcher` + toast de confirmación).

### Hallazgo real: nombre de archivo de la ruta — convención de escape `$id_`

El enlace inicial ("Editar regla de asignación") no navegaba a ningún sitio visible al hacer clic — la URL cambiaba pero la pantalla no cambiaba. Causa: en React Router (convención de rutas planas por nombre de archivo), un segmento fijo tras un parámetro dinámico en el mismo nombre de archivo (`app.size-guides.$id.rule.tsx`) se interpreta por defecto como **anidado dentro** de la ruta padre (`app.size-guides.$id.tsx`) — y como esa página padre es una hoja sin `<Outlet>` donde encajar la hija, la ruta hija nunca llegaba a renderizarse aunque la URL cambiara.

**Corrección:** renombrar el archivo con el sufijo de escape `$id_` (guion bajo tras el parámetro): `app.size-guides.$id_.rule.tsx` — le dice a React Router que esta ruta es independiente, no anidada. Tras el renombrado, hizo falta además **reiniciar `npm run dev`** (parar con `q` y volver a lanzar) porque el recargado en caliente no asimiló bien el cambio de estructura de rutas por sí solo — con el reinicio, funcionó a la primera.

### Validación realizada

Confirmado que tanto `metaobjectCreate` como `metaobjectUpdate` para entradas de `size_guide_rule` funcionan correctamente — se guardó una regla con éxito, con el aviso de confirmación mostrándose como se esperaba (mismo patrón `useFetcher` + toast que la Pieza B). Los 2 puntos que estaban marcados como "sin verificar" (nombres de las mutaciones para entradas, y que el guardado es un PATCH parcial) quedan confirmados correctos.

---

## Pieza F — Settings mínimo

**Estado:** ✅ Completada y verificada — guardado y persistencia confirmados.
**Fecha:** 01-sept-2026

### Qué hace

`app/routes/app.settings.tsx` — nueva pantalla "Configuración", enlace añadido en la navegación. Un único ajuste: casilla "Detectar automáticamente la unidad (cm/pulgadas) según la ubicación del comprador" — corresponde a la decisión 4 de la 2.9 (confirmada: "sí" hace falta).

### Deliberadamente NO implementa la detección real

Esta pieza solo guarda la preferencia (activado/desactivado) en un metafield de la tienda (`custom.auto_unit_detection`, tipo `boolean`, `ownerType: SHOP`). **La lógica real de detectar la ubicación del comprador y elegir la unidad correspondiente vive en la Fase 3** (Theme App Extension, todavía sin empezar) — activar esta casilla no tiene ningún efecto visible en la tienda todavía, solo deja la preferencia guardada para cuando se construya esa lógica.

### Decisión de alcance: sin definición formal de metafield

A diferencia de `resolved_size_guide` (2.3), que sí tiene una definición creada por el script de despliegue de la 1.4, este metafield se escribe **sin definición previa** — Shopify lo permite. Es menos "formal" (no aparecería con un nombre bonito en el Admin nativo si alguien lo mirara desde fuera de este panel), pero evita ampliar el script de despliegue solo para un ajuste de configuración interno. Se puede formalizar más adelante si hace falta.

### Validación realizada

Confirmado: al marcar la casilla y guardar, apareció el aviso "Configuración guardada correctamente"; al recargar la página, la casilla siguió marcada — confirma que el metafield se escribió y se está leyendo correctamente, con el mismo patrón (`useFetcher` + toast) ya probado en las Piezas B y D.

## Siguiente paso

Pieza C — Gestión de bloques de contenido (la más compleja del desglose, última pieza funcional antes de la G de pulido visual).
