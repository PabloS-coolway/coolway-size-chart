# Panel de administración — Implementación (tarea 2.10)

Documento acumulativo: cada pieza del desglose de la 2.10 se añade aquí a medida que se completa.

**Estado global: las 6 piezas funcionales (A, B, C, D, E, F) y la Pieza G (pulido visual completo) están cerradas y verificadas. Tarea 2.10 al 100%.**

---

## Pieza A — Dashboard (listado de guías)

**Estado:** ✅ Completada y verificada visualmente en `coolway-sandbox`.
**Fecha:** 01-sept-2026

### Qué hace

`app/routes/app.size-guides._index.tsx` — nueva pantalla dentro de la propia app, accesible desde el enlace "Guías de tallas" en la navegación (`app.tsx`). Lista todas las entradas `size_guide` de la tienda: título (en negrita, línea propia), y en una segunda línea: estado (Activa/Borrador), prioridad, Legacy Kiwi ID y el enlace "Editar".

### Decisiones de alcance (para no disparar el coste de esta pieza)

- **No muestra la regla de asignación de cada guía** en la primera versión (esto se añadió después, en la Pieza G2).
- **Sin paginación.** Se cargan hasta 50 guías de una sola vez (el inventario de la 0.1 confirma que ninguna tienda se acerca a ese límite).
- **El enlace "Editar" apunta a una ruta que todavía no existe** (`/app/size-guides/:id`) — se construye en la Pieza B. Da 404 esperado hasta entonces, confirmado al probarlo.

### Dos correcciones visuales tras la prueba real

1. **Estado pegado al título** ("...adultoActiva"): las cajas (`s-box`) con `minInlineSize` no reservaban separación visual real. Corregido con un separador de texto explícito (` · `) en vez de depender de esa propiedad de layout sin verificar.
2. **`fontWeight="bold"` en `<s-text>` no pone nada en negrita** en la práctica. Corregido usando la etiqueta HTML nativa `<strong>` en su lugar.

**Lección aplicada a las siguientes piezas:** para negrita/énfasis, usar HTML nativo (`<strong>`, `<em>`); para separación visual entre elementos en línea, usar separadores de texto explícitos, no props de layout sin verificar.

### Componentes usados (verificados por uso real)

`s-page`, `s-section`, `s-box`, `s-stack`, `s-text`, `s-link`, `s-paragraph` (del scaffold original) + `<strong>` (HTML nativo). Evitadas deliberadamente etiquetas sin confirmar como `s-table` o `s-badge`.

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

---

## Pieza C — Gestión de bloques de contenido

**Estado:** ✅ Completada y verificada — las 3 operaciones (editar, crear+enlazar, quitar) confirmadas correctas.
**Fecha:** 01-sept-2026

### Qué hace

Dos rutas nuevas:
- `app/routes/app.size-guides.$id_.blocks.tsx` — lista los bloques de una guía (tipo + resumen), con enlaces para editar cada uno, quitarlo de la guía, y añadir uno nuevo de cada uno de los 4 tipos.
- `app/routes/app.size-guides.$id_.blocks_.$type.$blockId.tsx` — un único editor que gestiona los 4 tipos de bloque (table/text/image/video) con campos condicionales según `:type`. `:blockId = "new"` crea un bloque nuevo y lo añade a la lista `blocks` de la guía; cualquier otro valor edita ese bloque existente.

### Decisiones de alcance (coste alto de la pieza, acotado deliberadamente)

1. **Sin selector visual de imágenes en la primera versión** (esto se resolvió después, en la Pieza G6).
2. **Tabla: `headers`/`rows` como JSON en un textarea**, no un editor visual de filas/columnas — mismo patrón ya usado en las condiciones de la regla (Pieza D).
3. **Sin reordenar bloques en la primera versión** (esto se añadió después, en la Pieza G5).
4. **"Quitar de la guía" no borra el bloque en sí** — solo lo desvincula del campo `blocks` de la guía. Más seguro: evita perder contenido por error.

### Aplicando la lección de la Pieza D desde el principio

Ambos archivos usan el sufijo de escape (`$id_`, y también `blocks_` en el editor de bloque) desde su creación — sin esperar a descubrir el mismo bug de "no navega al hacer clic" que ya nos costó una ronda de depuración en la Pieza D. Funcionó a la primera gracias a esto.

### Puntos que estaban sin verificar, confirmados correctos tras la prueba real

- `field(key:"blocks") { references(first: N) { nodes {...} } }` para leer una lista de referencia mixta — **confirmado correcto**: el bloque de tabla existente cargó bien en la lista y en el editor.
- Reescribir la lista completa de `blocks` (`metaobjectUpdate` con el array de IDs restante) para "quitar" o "añadir" un bloque — **confirmado correcto** tanto al crear un bloque nuevo como al quitarlo.

### Validación realizada (completa)

1. **Lista de bloques:** el bloque de tabla existente ("Calzado adulto") apareció correctamente.
2. **Edición de bloque existente:** se editó el `label` de la tabla, se guardó, y el cambio persistió al volver a entrar — confirma `metaobjectUpdate` sobre entradas de `size_guide_block_table`.
3. **Creación de bloque nuevo:** se creó un bloque de texto de prueba ("Bloque de prueba") — se guardó con éxito y quedó añadido a la lista `blocks` de la guía.
4. **Quitar bloque de la guía:** se quitó el bloque de texto de prueba — desapareció correctamente de la lista de la guía (la entrada en sí sigue existiendo, solo se desvinculó, tal como estaba diseñado).

---

## Pieza G — Pulido visual (completa)

**Estado:** ✅ Completada — las 6 sub-piezas (G1-G6) cerradas y verificadas con pruebas reales.
**Fecha:** 01-sept-2026

### G1 — Mejoras baratas (Piezas A y C)
- Resumen real de bloques de texto en el listado (antes decía siempre "(texto enriquecido)").
- Fecha relativa de actualización en el listado de guías ("hace 3 días").
- Buscador por título en el listado de guías, con "Limpiar búsqueda".
- **Hallazgo real:** un `<form>` HTML normal para el buscador rompía la navegación embebida (perdía parámetros de contexto de la app, pantalla en blanco) — corregido con el componente `<Form>` de react-router. Mismo motivo por el que "Limpiar búsqueda" usa `<s-link>` en vez de una `<a>` normal.
- El input de búsqueda no se vaciaba visualmente al limpiar (usa `defaultValue`, no controlado) — corregido con `key={query}` para forzar el remontaje del campo.

### G2 — Badges y chips de regla (Pieza A)
- Badge de color para el estado (verde "Activa" / ámbar "Borrador").
- Chips de la regla de asignación de cada guía (operador ANY/ALL + condiciones), cargando **todas** las `size_guide_rule` de una sola consulta y agrupándolas por guía en memoria — evita N+1.
- Badges implementados como `<span>` con estilo en línea, no un componente `<s-badge>` de Shopify sin verificar.

### G3 — Duplicar y Eliminar (Pieza A)
- **Duplicar copia la guía completa**: datos básicos + todos los bloques de contenido (incluida la referencia a la imagen, copiando su GID) + la regla de asignación, reapuntada a la guía nueva. La copia se crea siempre como Borrador.
- **Eliminar** borra solo la entrada de la guía (`metaobjectDelete`), no sus bloques ni su regla, que quedan sin usar pero no se pierden.
- **Hallazgo real:** `window.confirm()` en un contexto embebido muestra un texto añadido por el navegador ("Una página insertada en `<dominio del túnel>` dice...") — confuso y fuera de nuestro control. Sustituido por una ventana modal propia (HTML/CSS puro, fondo oscurecido + caja centrada), con el texto completamente bajo nuestro control.
- Botones con estilo propio tipo "botón de Shopify" (fondo claro, borde, esquinas redondeadas; rojo para Eliminar). "Editar" pasó de `<s-link>` a `<Link>` de react-router para poder aplicarle el mismo estilo.
- **Hallazgo real:** el botón "Duplicar" se veía más pequeño que los otros — el `<form>` que lo envolvía se convertía en el elemento flex en vez del propio botón. Corregido con `display: "contents"` en el form.

### G4 — Paginación (Pieza E)
- El informe de productos sin guía pasó de cargar los 727 productos de golpe a paginar de 100 en 100, con enlace "Cargar siguientes".
- Encabezado con rango real ("Productos 1-100 de 728"), calculado pasando contadores acumulados (`scanned`, `withoutGuide`) como parámetros en la URL entre páginas — sin necesitar estado de cliente ni base de datos propia para esto.
- Añadida una consulta de conteo total del catálogo (`productsCount`) para el denominador.

### G5 — Reordenar bloques (Pieza C)
- Botones "↑ Subir" / "↓ Bajar" por bloque (sin drag-and-drop, más caro de construir) — intercambian la posición del bloque con su vecino y reescriben la lista `blocks` completa, mismo patrón que "quitar".
- Confirmado funcionando con 3 bloques de prueba.

### G6 — Subida de imágenes (Pieza C, la de mayor incertidumbre de toda la Pieza G)
- **Primer intento (fallido, informativo):** `shopify.resourcePicker({ type: "file" })` — Shopify devolvió un error explícito: *"The 'type' option for resourcePicker must be one of product, variant, collection"*. Confirma que `resourcePicker` de App Bridge solo sirve para **elegir entre recursos ya existentes** (producto/variante/colección), nunca para subir un archivo nuevo — no es la herramienta correcta para "subir una imagen nuestra".
- **Segundo intento (correcto):** subida real de archivo vía la Admin API, con el mecanismo estándar de Shopify para que una app suba contenido nuevo:
  1. `stagedUploadsCreate` — pide una URL de subida temporal.
  2. `fetch POST` directo del archivo a esa URL (fuera de la Admin API).
  3. `fileCreate` — crea el archivo real en Shopify a partir de la URL subida, devuelve su GID.
  4. El GID se usa como valor del campo `image` (`file_reference`) del bloque.
- **Hallazgo real:** `fileCreate` falló con *"Access denied... Required access: write_files access scope..."* — el scope `write_files` no estaba declarado en `shopify.app.toml`. Añadido, y tras `npm run deploy` + desinstalar/reinstalar la app (necesario para que la tienda autorizara el scope nuevo), funcionó a la primera.
- Confirmado con una imagen real subida desde el propio panel: aparece la vista previa tanto dentro del editor del bloque como, tras un ajuste adicional, como miniatura en el listado de bloques de la guía.

### Componentes de formulario para subida de archivos
`<input type="file">` HTML nativo, con `encType="multipart/form-data"` en el `<fetcher.Form>` — sin ninguna librería de subida de terceros.

## Siguiente paso

Con la Pieza G completa, la tarea 2.10 (implementación del panel) queda **cerrada al 100%**, incluido el pulido visual. Queda la tarea 2.11 (qué hacer con el editor nativo de metaobjects) para cerrar la Fase 2 por completo.
