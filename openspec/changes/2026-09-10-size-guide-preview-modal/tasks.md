## Implementación

- [x] `richTextJsonToHtml` exportada desde `RichTextEditor.tsx`.
- [x] `SizeGuidePreviewModal.tsx`: modal que renderiza título,
      descripción (texto plano), y cada bloque (tabla con estilos,
      texto, imagen, vídeo) replicando el CSS del bloque del Theme App
      Extension.
- [x] Botón "👁 Preview" + estado `previewOpen` en
      `app.size-guides.$id.tsx`.

## Validación

- [x] `tsc --noEmit` sin errores nuevos (solo el TS7022 preexistente en
      otros archivos).
- [ ] Validación manual del usuario en `coolway-sandbox`: abrir el
      preview de una guía con bloques de tabla (con estilos), texto,
      imagen y vídeo, y comparar visualmente con el storefront real.
