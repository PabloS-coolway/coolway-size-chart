# Tasks — Campos nuevos en bloque tabla (2.14)

## Modelo de datos

- [x] Añadir `footer_text` (`multi_line_text_field`) y `hide_table`
      (`boolean`) a `size_guide_block_table` en
      `scripts/deploy-metaobject-definitions.js`
- [x] Ejecutar `npm run deploy:metaobjects` contra `coolway-sandbox` y
      confirmar que los 2 campos se añaden sin duplicar ni tocar los
      6 campos existentes

## Panel de administración

- [x] Query `GET_BLOCK_QUERY`: añadir alias `footerText`/`hideTable`
- [x] `loader`: mapear `footerText`/`hideTable` a `fields`
- [x] `action`: leer `footerText` (textarea) y `hideTable` (checkbox)
      y enviarlos como `footer_text`/`hide_table`
- [x] Formulario: textarea "Footer text" y checkbox "Hide table" en
      la sección `type === "table"`
- [x] Comprobación de build TypeScript sin errores nuevos

## Storefront

- [x] `size_guide.liquid`: si `block.hide_table` es true, no
      renderizar el `table-wrap` completo de ese bloque
- [x] `size_guide.liquid`: si `block.footer_text` tiene valor y la
      tabla no está oculta, renderizarlo como nota bajo la tabla

## Validación (coolway-sandbox)

- [x] Abrir el bloque de tabla real de la guía "Calzado adulto" y
      confirmar que carga sin footer text y con "Hide table" desactivado
      (compatibilidad hacia atrás, campos nuevos vacíos por defecto)
- [x] Crear un bloque de prueba, añadir un footer text y guardarlo —
      confirmar que aparece bajo la tabla en el storefront
- [x] Activar "Hide table" en ese bloque de prueba y guardar —
      confirmar que la tabla (y su footer) desaparecen del storefront
      sin romper el resto de la guía, y que los datos (`headers`/`rows`)
      se conservan al reabrir el editor
- [x] Desactivar "Hide table" de nuevo — confirmar que la tabla vuelve
      a aparecer con los mismos datos
- [ ] Eliminar el bloque de prueba tras la validación, sin dejar rastro

