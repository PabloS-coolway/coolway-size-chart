# Tareas — 2.15 Editor de guía unificado

- [ ] Loader combinado en `app.size-guides.$id.tsx` (guía + bloques +
      regla en paralelo)
- [ ] Action con despacho por `intent` (save-guide, save-rule,
      save-block, add-block, move-block, remove-block)
- [ ] Sección "Datos básicos" igual que hoy, dentro de la pantalla
      unificada
- [ ] Lista de bloques con resumen colapsado + expandir inline para
      editar (reutilizando TableGridEditor / RichTextEditor / campos
      de imagen y vídeo ya existentes)
- [ ] "Añadir bloque nuevo" como formulario inline al final de la lista
- [ ] Sección "Regla de asignación" en la columna lateral, siempre
      visible
- [ ] Revalidación tras cada guardado (lista de bloques y regla no se
      quedan desincronizadas)
- [ ] Retirar los enlaces de navegación a `/blocks`, `/blocks/:type/:id`
      y `/rule` (las rutas quedan sin enlazar, no se borran todavía)
- [ ] Validar en `coolway-sandbox`: guardar datos básicos, editar un
      bloque existente, añadir un bloque nuevo, quitar un bloque,
      reordenar, guardar la regla — todo sin recargar la página
- [ ] Confirmar que el bloque real de "Calzado adulto" no sufre
      regresión (footer text / hide table de la 2.14 incluidos)
- [ ] Actualizar `docs/` con el resultado y las capturas de antes/después
- [ ] Cerrar en ClickUp y actualizar `Contexto_Proyecto_Kiwi_PROPIO.md`
