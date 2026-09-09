# Tasks â€” Editor de texto enriquecido (2.13)

## ImplementaciÃ³n

- [x] Crear `app/components/RichTextEditor.tsx`
- [x] Barra de herramientas: Negrita, Cursiva, Lista con viÃ±etas, Lista
      numerada, Enlace, Quitar formato
- [x] FunciÃ³n `richTextJsonToHtml` (deserializaciÃ³n, para cargar contenido
      existente en el `contentEditable`)
- [x] FunciÃ³n `htmlToRichTextJson` (serializaciÃ³n, para el campo oculto
      `content` al guardar)
- [x] Envolver texto suelto en `paragraph` implÃ­cito al serializar
- [x] Integrar el componente en el bloque `type === "text"` de
      `app.size-guides.$id_.blocks_.$type.$blockId.tsx`, sustituyendo el
      `<textarea>` de texto plano
- [x] ComprobaciÃ³n de build TypeScript sin errores nuevos

## ValidaciÃ³n (coolway-sandbox)

- [x] Abrir un bloque de texto existente y confirmar que el contenido
      real se ve formateado (no como texto plano concatenado)
- [x] Aplicar negrita/cursiva a una selecciÃ³n y confirmar visualmente
- [x] Crear una lista con viÃ±etas y una numerada
- [x] Insertar un enlace
- [x] Guardar y volver a abrir el bloque â€” confirmar que el formato se
      mantiene igual (round-trip)
- [x] Confirmar en el storefront (`coolway-rich-text.liquid`, ya
      existente desde la 3.4) que el contenido guardado sigue
      renderizando correctamente, sin regresiÃ³n
- [x] Crear un bloque de texto nuevo desde cero con formato variado y
      confirmar guardado correcto

