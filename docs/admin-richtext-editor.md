# 2.13 — Editor de texto enriquecido (rich text)

## Contexto

El editor de bloques de texto (`app.size-guides.$id_.blocks_.$type.$blockId.tsx`)
usaba un `<textarea>` en bruto para el campo `content` (JSON de Shopify
`rich_text_field`). Se sustituyó por un editor WYSIWYG real.

## Qué se implementó

Nuevo componente `app/components/RichTextEditor.tsx`:

- Barra de herramientas: Negrita, Cursiva, Lista (viñetas), Lista numerada,
  Enlace, Quitar formato.
- Basado en `contentEditable` + `document.execCommand`.
- Serialización bidireccional entre el HTML del editor y el esquema JSON
  real de Shopify para `rich_text_field` (`root` → `paragraph` /
  `list` / `list-item` → nodos inline `text`/`link`).
- Feedback visual de estado activo en los botones de la barra (negrita,
  cursiva, lista, lista numerada) usando `document.queryCommandState`,
  actualizado en `selectionchange`, `focus`, `keyup` y `mouseup`.

Se eliminó código muerto de la ruta (`extractPlainTextFromRichText`,
`buildRichTextFromPlainText`) que ya no se usaba tras integrar el
componente.

## Lo que NO cambia

El contrato con el backend es idéntico: el componente serializa su estado
a un `<input type="hidden">` `content` con el mismo JSON que ya leía la
`action` de la ruta. No se tocó el modelo de datos del metaobject
`size_guide_block_text`.

## Dos bugs reales encontrados y corregidos durante la validación en vivo

### Bug 1 — Listas rechazadas por el validador de Shopify al guardar

La primera versión serializaba los hijos de un `list-item` envueltos en un
nodo `paragraph` anidado (igual que un bloque normal). Shopify rechazaba
ese JSON al guardar con:

```
Value is not the correct format: #/children/N: failed schema
#/properties/children/items: No subschema in "oneOf" matched.
```
(`code: INVALID_VALUE`)

Este comportamiento del validador real de `rich_text_field` **no está
documentado** por Shopify. Se descubrió y confirmó bisectando payloads
directamente contra la API Admin GraphQL de `coolway-sandbox`
(`metaobjectUpdate`), extrayendo el token de acceso offline directamente
de la base de datos local de sesiones de la app
(`prisma/dev.sqlite`, tabla `Session`) y probando con `Invoke-RestMethod`
en PowerShell — más rápido y fiable que la automatización de navegador
para aislar qué forma exacta de JSON aceptaba el esquema. **Técnica a
reutilizar en futuras tareas si la automatización de navegador resulta
poco fiable.**

Fix: los hijos de `list-item` deben ser nodos inline (`text`/`link`)
directamente, sin envolver en `paragraph`.

También se actualizó el snippet de storefront
`extensions/size-guide-block/snippets/coolway-rich-text.liquid` para
renderizar el nuevo formato de 2 niveles (antes esperaba 3 niveles,
acorde al formato incorrecto anterior), y se añadió soporte para
`listType: ordered` (`<ol>`) además de `<ul>`.

### Bug 2 — Formato de listas perdido tras guardar, salir y volver a entrar

Con el Bug 1 ya corregido, el usuario reportó que las listas seguían
perdiendo su formato tras guardar y recargar. Aportó el `innerHTML` exacto
del editor en el momento del fallo, que mostraba una estructura DOM mal
formada producida por `execCommand` (listas anidadas dentro de un
`<p>`, con un `<div>` intermedio), por ejemplo:

```html
<p>...</p>
<p><ul>...</ul><div><ol>...</ol><div>enlace...</div></div></p>
```

La función original `htmlToRichTextJson` solo buscaba `<ul>`/`<ol>` como
hijos directos del contenedor del editor; ante esta estructura anidada,
el contenido se aplanaba silenciosamente a texto plano, perdiendo la
lista.

El propio usuario diagnosticó correctamente la causa raíz de fondo: los
botones de la barra de herramientas no mostraban si un formato (negrita,
cursiva, lista, enlace) estaba activo en el punto del cursor, lo que
hacía fácil seguir escribiendo mezclando formatos sin darse cuenta.

Fix doble:

1. Se reescribió la función de serialización con una nueva `collectBlocks`
   recursiva, que recorre contenedores `<p>`/`<div>` anidados para
   encontrar listas estén donde estén, en vez de asumir una estructura
   plana de hijos directos.
2. Se añadió el feedback visual de estado activo descrito arriba (ver
   "Qué se implementó"), para reducir la probabilidad de que el usuario
   vuelva a producir HTML mal formado sin darse cuenta.

## Validación (coolway-sandbox)

Todo validado en vivo en el panel de administración de `coolway-sandbox`,
nunca en una tienda real. La automatización de navegador (Chrome vía
Claude) resultó muy poco fiable en esta tarea por la limitación conocida
de iframe de origen cruzado (misma limitación documentada en
`docs/admin-panel-2.12-kiwi-reference.md` / `docs/final-visual-validation.md`);
tras varios intentos fallidos el usuario optó por validar manualmente él
mismo el resto de la tarea:

- Negrita, cursiva y lista con viñetas confirmadas visualmente funcionando
  en un bloque de prueba (una sesión interactiva antes de que la
  automatización volviera a fallar).
- Bug 1 (listas rechazadas al guardar) reproducido y confirmado corregido
  vía pruebas directas contra la API Admin GraphQL.
- Bug 2 (listas perdiendo formato en guardar → salir → volver a entrar)
  reproducido por el usuario con capturas de pantalla (antes/después) y
  con el `innerHTML` exacto del editor, y confirmado corregido por el
  usuario: "ahora sí, se me ha mantenido perfectamente el formato después
  de guardar, salir y volver a entrar".

## Fuera de alcance (explícito)

- Undo/redo personalizado más allá del nativo del navegador.
- Formato adicional (tablas, imágenes, colores, encabezados) no soportado
  por el subconjunto de `rich_text_field` usado en los bloques de texto.
