## Implementación

- [x] Field definition `table_styles` (tipo `json`) añadida a
      `scripts/deploy-metaobject-definitions.js` (patrón idempotente
      existente — solo añade el campo que falta, no toca los demás).
      Pendiente de ejecutar contra cada tienda: `node
      scripts/deploy-metaobject-definitions.js
      --store=<tienda>.myshopify.com --token=$ADMIN_API_TOKEN` (el
      usuario ejecuta el script con su propio token — no se comparte
      el token en el chat). Empezar por `coolway-sandbox`.
- [x] `TableStylesEditor.tsx` (nuevo componente): estado interno +
      campo oculto `tableStyles` (JSON), mismo patrón que
      `TableGridEditor`. Controles: color fila par/impar, color y
      grosor de borde, color/tamaño/peso de texto de cabecera,
      color/tamaño de texto de celda, color/tamaño de texto de pie,
      fondo/color de texto/color de borde del botón de unidad.
- [x] `BlockFormFields.tsx`: `TableStylesEditor` insertado tras los
      campos de datos de la tabla; `tableStyles` añadido a
      `BlockFieldsValue` / `EMPTY_BLOCK_FIELDS`.
- [x] `app.size-guides.$id.tsx`: `tableStyles` leído en la query GraphQL
      (`tableStyles: field(key: "table_styles")`), mapeado en el
      loader, y guardado en `handleSaveBlock` (`table_styles`, con
      fallback a `"{}"` si viene vacío).
- [x] Theme App Extension (`extensions/size-guide-block/blocks/size_guide.liquid`):
      `block.table_styles.value` volcado como variables CSS
      (`--csg-*`) en el `<div class="…__table-outer">` de cada tabla;
      el CSS estático usa `var(--csg-x, <valor actual>)` en cada regla
      afectada (color de fila par/impar, color y grosor de borde,
      color/tamaño/peso de texto de cabecera, color/tamaño de texto de
      celda, color/tamaño de texto de pie) — un bloque sin
      `table_styles` (o creado antes de esta tarea) se ve exactamente
      igual que antes, sin cambios visuales de regresión.
- [x] Botón de cambio de unidad: tras confirmar que no existe ningún
      botón interactivo de cambio de unidad en el storefront (solo se
      marca en negrita la unidad por defecto, tarea 3.6), el usuario
      decidió QUITAR estos 3 campos del panel (fondo/color de texto/
      color de borde) en vez de dejarlos guardados sin efecto —
      eliminados de `TableStylesValue`, `DEFAULT_TABLE_STYLES` y de la
      UI en `TableStylesEditor.tsx`. Se podrán volver a añadir si algún
      día se construye ese botón real.

- [x] Ajuste visual (pedido por el usuario tras validar): separación de
      1rem entre el final de "Estilos de tabla" y el botón "Guardar
      bloque" (y el equivalente "Crear y añadir a la guía" en el flujo
      "+ Add Section") — antes quedaban pegados.

## Validación

- [x] `tsc --noEmit` sin errores nuevos (solo el TS7022 preexistente en
      otros archivos, ninguno en los ficheros tocados aquí).
- [x] El usuario ejecuta `deploy-metaobject-definitions.js` contra
      `coolway-sandbox` — campo `table_styles` creado correctamente
      (el fallo del metafield `resolved_size_guide` por falta del
      scope `write_products` en la custom app es un tema aparte, ya
      indicado al usuario cómo resolverlo, no bloquea esta tarea).
- [x] Validación manual del usuario en `coolway-sandbox`: el panel
      "Estilos de tabla" carga sin errores y se ve correctamente —
      confirmado ("Ok. Todo perfecto").
- [ ] Validación manual del usuario en el storefront de
      `coolway-sandbox`: abrir la guía de tallas de un producto con un
      bloque de tabla al que se le hayan cambiado estilos y comprobar
      que se reflejan (colores de fila/borde, texto de cabecera/celda/
      pie), y que un bloque de tabla SIN estilos personalizados se ve
      igual que antes de esta tarea (sin regresión).
