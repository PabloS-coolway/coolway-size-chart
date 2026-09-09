# Tasks — 2.12 Editor de tabla tipo hoja de cálculo

## Implementación
- [ ] Componente `TableGridEditor` (React, cliente): estado
      `headers: string[]` + `rows: string[][]`, celdas editables.
- [ ] Botones "+ Fila" y "+ Columna".
- [ ] Menú contextual (clic derecho en celda): Eliminar fila, Eliminar
      columna, Insertar fila arriba/abajo, Insertar columna izq/der,
      Vaciar valores, Copiar tabla, Pegar tabla.
- [ ] Navegación por teclado: Tab/Shift+Tab, Enter.
- [ ] Cuadro "Importar tabla" (pegar texto TSV/CSV → rellena la
      rejilla, sustituyendo el contenido actual tras confirmación).
- [ ] Serialización a `headers`/`rows` JSON en inputs ocultos al enviar
      el formulario — sin tocar la `action` del servidor.
- [ ] Integrar el componente en
      `app.size-guides.$id_.blocks_.$type.$blockId.tsx` reemplazando
      los 2 `<textarea>` del bloque tabla.
- [ ] `npm run build` (o el chequeo de TypeScript equivalente) sin
      errores.

## Validación en el panel admin de `coolway-sandbox` (nunca en tienda real)
- [ ] Crear un bloque tabla nuevo desde cero con la rejilla (sin JSON).
- [ ] Editar un bloque tabla ya existente (con datos reales) y
      confirmar que la rejilla carga los datos correctamente.
- [ ] Añadir/quitar filas y columnas, confirmar que se guardan bien.
- [ ] Probar el menú contextual completo.
- [ ] Probar copiar/pegar tabla completa.
- [ ] Probar importar tabla desde texto pegado.
- [ ] Confirmar que el storefront (Fase 3) sigue renderizando
      correctamente un bloque editado con el nuevo editor — sin
      cambios en el bloque de storefront.
