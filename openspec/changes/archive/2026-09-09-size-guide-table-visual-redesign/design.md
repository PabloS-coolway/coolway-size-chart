# Design — 3.11 Rediseño visual de la tabla de tallas

## Context
La tabla renderiza hoy con un `<caption>` estándar (etiqueta + unidad),
`<th>` planos y filas sin ningún tratamiento visual. El widget real de
Kiwi (referencia visual de la 3.10) usa una fila de grupo oscura a todo
el ancho, cabeceras de columna en gris/mayúsculas, zebra striping y
primera columna en negrita.

## Goals
- Igualar la jerarquía visual de Kiwi sin tocar el modelo de datos
  (`headers`/`rows`/`label`/`unit_primary`/`unit_secondary`) ni el HTML
  semántico de la tabla (accesibilidad y `theme check` sin regresión).
- Reutilizar la paleta ya introducida en 3.13 (`#1a1a1a` de la cabecera
  del modal) para la barra de grupo, en vez de introducir un color nuevo.

## Non-Goals
- No se toca el "fit note" ni la tipografía del resto de bloques (3.12).
- No se cambia el dato mostrado (mismas cabeceras/filas/unidades), solo
  su presentación.

## Decisions
- **Barra de grupo en vez de `<caption>` con estilo.** Un `<caption>`
  tiene limitaciones de layout en algunos navegadores (no admite
  `display: flex` de forma fiable). Se sustituye por un `<div>` visual
  justo antes de la tabla, dentro del mismo contenedor `<figure>`
  implícito — el dato (`block.label` + unidad) es idéntico al de hoy,
  solo cambia el elemento contenedor.
- **Zebra vía `:nth-child(even)`** sobre `tbody tr`, sin clases
  adicionales en Liquid — evita iterar con un índice manual en el bucle
  `{%- for row in rows -%}` y mantiene el bucle igual de simple.
- **Primera celda en negrita vía `:first-child`** sobre `td`, mismo
  motivo — sin marcar nada especial en el bucle de celdas.
- **RTL:** la barra de grupo y las cabeceras usan `text-align: start`
  (ya en uso desde la 3.7), por lo que el rediseño no rompe el soporte
  RTL existente.

## Risks / Trade-offs
- Cambiar `<caption>` por un `<div>` reduce ligeramente la semántica
  nativa de "título de tabla" para lectores de pantalla. Mitigación:
  el `<div>` se asocia a la tabla con `aria-hidden="false"` implícito
  (no se oculta) y se mantiene como hermano inmediato de la tabla, en un
  contenedor común, preservando la relación visual y de lectura en
  orden de documento. No se introduce ningún `aria-labelledby` nuevo
  para no complicar el escenario de accesibilidad ya validado en tareas
  anteriores sin evidencia real de que haga falta.
