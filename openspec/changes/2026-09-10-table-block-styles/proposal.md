# Propuesta — Estilos de tabla editables (tarea 2.16, parte 2)

## Por qué

Kiwi permite personalizar el aspecto visual de cada tabla de tallas
(colores de fila, bordes, tipografía de cabecera/celda/pie, estilo del
botón de cambio de unidad). Para tener paridad funcional, cada bloque
de tipo tabla necesita su propio panel de "Estilos de tabla" editable,
independiente de los demás bloques de tabla de la misma guía (decisión
del usuario: por bloque, no global).

## Qué cambia

- Cada bloque de tipo tabla guarda su propio `table_styles` (JSON) con:
  color de fila par, color de fila impar, color y grosor de borde,
  estilo de texto de cabecera (color, tamaño, peso), estilo de texto de
  celda, estilo de texto de pie, y estilo del botón de cambio de unidad
  (fondo, color de texto, borde).
- Dentro del panel lateral de edición de un bloque de tabla (ya
  existente, tarea 2.16 parte 1), se añade una segunda sección
  "Estilos de tabla" con los controles anteriores, debajo de los campos
  de datos existentes.
- El Theme App Extension (storefront) lee `table_styles` y aplica los
  valores como estilos inline / variables CSS al renderizar la tabla,
  con un fallback a los valores por defecto actuales si el bloque no
  tiene `table_styles` guardado (compatibilidad con bloques existentes).

## Fuera de alcance

- No se toca el panel de "Editar" para tipos texto/imagen/vídeo.
- No se añade un estilo global de guía; queda explícitamente por bloque
  según la decisión del usuario.

## Impacto

- Definición del metaobject de bloque tipo tabla: nuevo field
  definition `table_styles` (single line text field / JSON). **Cambio
  de esquema compartido por las 14 tiendas** — requiere confirmación
  explícita del usuario antes de crearlo vía Admin GraphQL API, o
  creación manual por el usuario en el Admin de Shopify.
- `app/components/BlockFormFields.tsx`: nueva sección de estilos para
  `type === "table"`.
- `app/routes/app.size-guides.$id.tsx`: leer/guardar el campo
  `table_styles` junto con el resto de campos del bloque tabla.
- Theme App Extension (bloque de tabla en el storefront): aplicar los
  estilos guardados al renderizar.
