# Design — Editor de texto enriquecido (2.13)

## Context

El campo `content` de `size_guide_block_text` usa el esquema nativo
`rich_text_field` de Shopify:

```json
{
  "type": "root",
  "children": [
    { "type": "paragraph", "children": [
      { "type": "text", "value": "texto normal " },
      { "type": "text", "value": "negrita", "bold": true },
      { "type": "text", "value": " y ", },
      { "type": "text", "value": "cursiva", "italic": true }
    ]},
    { "type": "list", "listType": "unordered", "children": [
      { "type": "list-item", "children": [
        { "type": "paragraph", "children": [{ "type": "text", "value": "punto 1" }] }
      ]}
    ]},
    { "type": "link", "url": "https://...", "children": [{ "type": "text", "value": "enlace" }] }
  ]
}
```

El storefront (3.4) ya sabe recorrer esta estructura (`coolway-rich-text.liquid`,
cobertura mínima: párrafos y listas) — este editor debe producir JSON
compatible con ese mismo esquema, sin inventar campos nuevos.

## Goals

- Editar párrafos múltiples, negrita, cursiva, listas (con/sin viñetas) y
  enlaces, con una barra de herramientas simple.
- Guardar y recargar el mismo contenido sin pérdida de formato
  (round-trip fiel), a diferencia del comportamiento actual.
- Cero cambios en el contrato del campo `content` hacia el backend — sigue
  siendo un string JSON en el mismo `<input type="hidden">`.

## Non-Goals

- Encabezados de varios niveles, tachado, color, código — fuera del
  inventario real (0.1).
- Undo/redo propio — se apoya en el del navegador sobre `contentEditable`.
- Limpieza exhaustiva de HTML pegado desde otras aplicaciones.

## Decisions

- **`contentEditable` + `document.execCommand`** para las acciones básicas
  de la barra (bold/italic/insertUnorderedList/insertOrderedList/
  createLink/removeFormat), en vez de una librería de edición de texto
  enriquecido de terceros (Slate, TipTap, Lexical). Motivo: el alcance
  real es muy acotado (5 tipos de nodo), añadir una dependencia grande
  para esto sería sobre-ingeniería, y `execCommand`, aunque formalmente
  deprecado, sigue soportado en todos los navegadores modernos y es
  exactamente el mecanismo que usan la mayoría de editores WYSIWYG
  simples de paneles de administración internos.
- **Serialización DOM → JSON** recorre el HTML resultante del
  `contentEditable` nodo a nodo: `<p>` → `paragraph`, `<ul>`/`<ol>` →
  `list` (con `listType`), `<li>` → `list-item` (envolviendo su contenido
  en un `paragraph`, igual que genera el propio editor nativo de Shopify),
  `<b>`/`<strong>` → marca `bold: true` en el nodo de texto, `<i>`/`<em>`
  → `italic: true`, `<a href>` → nodo `link` con `url` y sus hijos de
  texto. Texto suelto sin envolver en ningún bloque se envuelve en un
  `paragraph` implícito al serializar, para no romper el esquema (que
  exige que los hijos de `root` sean bloques, no texto suelto).
- **Deserialización JSON → HTML** hace el camino inverso al cargar el
  editor, para que el usuario vea el contenido real ya formateado la
  primera vez que abre un bloque de texto existente (aunque se haya
  creado antes por script, importación, o el editor nativo de Shopify).
- El campo oculto `content` se recalcula en cada `input` del área editable
  (con un pequeño `debounce`), igual que el resto de campos controlados
  del formulario — se sigue enviando como parte del mismo `<Form>`
  existente, sin tocar la `action`.

## Risks / Trade-offs

- `execCommand` está marcado como deprecado en la especificación web,
  pero no hay todavía una alternativa estándar equivalente amplaimente
  soportada para edición de texto enriquecido sin librería — riesgo
  aceptado, acotado a un panel de administración interno (no público),
  con bajo volumen de uso (65 guías con bloque de texto en el inventario
  real de 0.1).
- El pegado de HTML externo (Word, Google Docs) puede introducir
  etiquetas o estilos no contemplados por el serializador (p. ej.
  `<span style="...">`) — se documenta como limitación conocida; el
  serializador ignora atributos/estilos no reconocidos y conserva solo el
  texto y las marcas soportadas (bold/italic/link/lista), degradando con
  seguridad en vez de fallar o corromper el JSON.
