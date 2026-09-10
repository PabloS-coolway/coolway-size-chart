# Propuesta — Preview de guía antes de publicar

## Por qué

Al validar los estilos de tabla (2.16), el usuario pidió poder ver cómo
quedará una guía en el storefront antes de publicarla/activarla o de
asignarla a ningún producto — hoy solo se podía comprobar mirando el
producto real en la tienda, lo que exige la guía ya activa y asignada.

## Qué cambia

- Nuevo botón "👁 Preview" en la cabecera del editor de guía
  (`app.size-guides.$id.tsx`).
- Al pulsarlo se abre un modal (`SizeGuidePreviewModal.tsx`) que
  reconstruye en React el mismo marcado/CSS que genera
  `extensions/size-guide-block/blocks/size_guide.liquid` para el modal
  del storefront, usando los datos ya cargados en pantalla — sin
  llamada al servidor, sin necesitar que la guía esté Active ni
  asignada a un producto.
- Reutiliza `richTextJsonToHtml` (ya existente en `RichTextEditor.tsx`,
  ahora exportada) para los bloques de texto; los estilos de tabla
  (2.16 parte 2) se aplican igual que en el storefront real.

## Simplificaciones conscientes (documentadas, no bugs)

- No reproduce el auto-seleccionado de unidad según el país del
  visitante (tarea 3.6) — siempre marca "primary" como default.
- El estilo del botón de cambio de unidad no se renderiza como control
  interactivo, porque tampoco existe ese componente en el storefront
  real todavía.
- La descripción de la guía se muestra como texto plano (así es como
  ya llega del loader, `extractPlainTextFromRichText`), no como rich
  text con formato — a diferencia del contenido de bloques de texto,
  que sí conserva el JSON completo.

## Impacto

- `app/components/SizeGuidePreviewModal.tsx` (nuevo).
- `app/components/RichTextEditor.tsx`: `richTextJsonToHtml` exportada.
- `app/routes/app.size-guides.$id.tsx`: botón + estado `previewOpen`.
