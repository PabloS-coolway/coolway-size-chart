# 2.12 — Editor de tabla tipo hoja de cálculo

## Contexto

El editor de bloques de tabla (`app.size-guides.$id_.blocks_.$type.$blockId.tsx`)
usaba dos `<textarea>` en bruto para los campos `headers` y `rows` (JSON).
El usuario pidió un panel calcado a Kiwi Size Chart en la medida de lo
posible, aportando capturas del editor real de Kiwi (grid tipo hoja de
cálculo, botones "+row"/"+col"/"Import table", menú contextual de clic
derecho estilo Excel). Referencia completa de las capturas en
`docs/admin-panel-2.12-kiwi-reference.md`.

## Qué se implementó

Nuevo componente `app/components/TableGridEditor.tsx`, que sustituye los
dos textareas por una cuadrícula editable:

- Botones "+ Fila" y "+ Columna".
- Menú contextual (clic derecho) con: Eliminar fila, Eliminar columna,
  Insertar fila arriba/abajo, Insertar columna izquierda/derecha, Vaciar
  valores, Copiar tabla, Pegar tabla.
- Navegación por teclado básica: Tab / Shift+Tab / Enter.
- "Importar tabla": pegar texto TSV o CSV, con la primera línea como
  cabecera; valida que todas las filas tengan el mismo número de columnas.

## Lo que NO cambia

El contrato con el backend es idéntico: el componente serializa su estado
interno (`string[][]`) a los mismos `<input type="hidden">` `headers` y
`rows` que ya leía la `action` de la ruta. No se tocó el modelo de datos
del metaobject `size_guide_block_table` ni la lógica de guardado/creación
de bloques.

## Fuera de alcance (explícito)

- El "Advanced mode" de Kiwi (unidades por columna).
- Réplica exacta del comportamiento de "Swap" de Kiwi.
- Atajos de teclado extendidos más allá de Tab/Shift+Tab/Enter.

Estas quedaron fuera porque el propio equipo de Kiwi no documenta su
comportamiento exacto y el objetivo de 2.12 era cubrir el 100% del caso de
uso real (inventario de tallas simple, confirmado en la tarea 0.1), no
clonar Kiwi al 100%.

## Validación (coolway-sandbox)

Todo validado en vivo en el panel de administración de `coolway-sandbox`,
nunca en una tienda real:

- Editor carga correctamente los datos reales de un bloque de tabla
  existente (Talla EU / CM, tallas 38-40) en la nueva cuadrícula.
- "+ Fila" y "+ Columna" añaden fila/columna vacía correctamente.
- Menú contextual completo probado (aparecen las 9 opciones esperadas).
- Importación de tabla vía texto pegado (CSV) probada en un bloque nuevo
  de prueba: reemplaza la cuadrícula con el contenido parseado
  correctamente.
- Navegación por teclado (Tab) confirmada visualmente (el cursor avanza de
  una celda a la siguiente).
- Guardado y recarga (round-trip): se creó un bloque de prueba, se guardó,
  se volvió a abrir y los datos cargados coinciden exactamente con lo
  guardado — confirma que el contrato JSON con el backend sigue intacto.
- El bloque de prueba se eliminó de la guía tras la validación.
- El bloque de tabla real de la guía ("Calzado adulto") no se tocó: un
  error de coordenadas durante la prueba manual (clic en la celda
  incorrecta) borró accidentalmente la columna CM en el editor, pero el
  cambio nunca se guardó — se navegó fuera sin enviar el formulario y se
  confirmó que el bloque real seguía intacto (3 filas EU/CM sin cambios).

## Nota sobre validación de teclado

La confirmación visual de foco (Tab) se hizo por captura de pantalla del
cursor parpadeante en la celda de destino, no por inspección del DOM: el
iframe de la app corre en un origen distinto (túnel de Cloudflare) al de
`admin.shopify.com`, por lo que `document.activeElement` no es accesible
vía JavaScript inyectado desde el frame padre (`SecurityError` de origen
cruzado). Mismo tipo de limitación ya documentada para `resize_window` en
`docs/final-visual-validation.md`.
