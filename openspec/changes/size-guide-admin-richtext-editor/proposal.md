# Editor de texto enriquecido (WYSIWYG) para bloques de tipo texto

## Why

El campo `content` del metaobject `size_guide_block_text` ya es
`rich_text_field` (soporta párrafos, listas, negrita, cursiva, enlaces),
pero el editor actual del panel (`app.size-guides.$id_.blocks_.$type.$blockId.tsx`)
lo trata como texto plano: `extractPlainTextFromRichText` aplana todo el
árbol a una sola cadena de texto (concatenando el `value` de cada nodo),
y `buildRichTextFromPlainText` reconstruye siempre un único párrafo sin
formato al guardar. Cualquier formato o estructura existente (varios
párrafos, listas, negrita, enlaces) se pierde en el primer guardado desde
el panel.

Kiwi ofrece una barra de formato completa en su editor de texto (negrita,
cursiva, listas, enlaces, etc. — ver capturas ya recogidas, referenciadas
en `docs/admin-panel-2.12-kiwi-reference.md` y en la sección "Fase 2
revisitada" del contexto del proyecto). Esta tarea (2.13) es, junto con la
2.12 (ya completada), una de las dos consideradas bloqueantes antes del
rollout por decisión explícita del usuario (08-sept-2026).

## What Changes

- Nuevo componente `RichTextEditor.tsx`: editor WYSIWYG basado en un área
  editable (`contentEditable`) con barra de herramientas — Negrita,
  Cursiva, Lista con viñetas, Lista numerada, Enlace, Quitar formato.
- Serialización bidireccional entre el HTML editado y el esquema JSON de
  `rich_text_field` de Shopify (`root` → `children` de tipo `paragraph` /
  `heading` / `list` / `list-item` / `link`, con marcas `bold`/`italic` en
  nodos `text`).
- Sustituye el `<textarea>` de texto plano del bloque de tipo `text` en el
  editor de bloques. El campo oculto enviado al formulario sigue siendo
  `content`, con el JSON completo de `rich_text_field` — el backend ya lo
  guarda tal cual (`fields.content` en la `action`), sin cambios ahí.
- Se elimina el aplanado con pérdida de `extractPlainTextFromRichText` /
  `buildRichTextFromPlainText` para el tipo `text`, sustituido por
  deserialización/serialización fiel del árbol completo.

## Out of Scope

- Encabezados (`heading`) de más de un nivel, formato de código, tachado,
  colores de texto — Kiwi no los usa en las 65 guías con bloque de texto
  del inventario (0.1); se soporta solo lo presente en el inventario real
  más lo mínimo exigido por el esquema de Shopify (párrafo, lista, negrita,
  cursiva, enlace).
- Pegado enriquecido desde Word/Google Docs con limpieza automática de
  estilos — el editor no impide pegar, pero no se garantiza una limpieza
  exhaustiva del HTML pegado; se documenta como limitación conocida.

## Capabilities

- **Modified**: `size-guide-admin-panel` (añade el requisito de editor de
  texto enriquecido, sobre la misma capability creada en la 2.12).

## Impact

- Modifica `app/routes/app.size-guides.$id_.blocks_.$type.$blockId.tsx`
  (sustituye el bloque `type === "text"` del formulario).
- Añade `app/components/RichTextEditor.tsx`.
- No toca el modelo de datos (`content` sigue siendo `rich_text_field` en
  `size_guide_block_text`, sin cambios en
  `scripts/deploy-metaobject-definitions.js`).
- Validado únicamente en `coolway-sandbox`, nunca en tienda real.
