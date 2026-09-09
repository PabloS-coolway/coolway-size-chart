# 2.12 — Referencia visual del editor de tabla de Kiwi (capturas 09-sept-2026)

Este documento NO es un OpenSpec change — es una nota de referencia para
cuando arranque la tarea 2.12 (Editor de tabla tipo hoja de cálculo del
panel admin propio), guardada para no perder el contexto de las capturas
que Juanmi compartió el 09-sept-2026 mientras seguíamos con la 3.x.

## Origen
Capturas de pantalla del editor "Size table" de Kiwi (right-click
context menu abierto), compartidas directamente en el chat — no
navegación en vivo. Complementan la exploración ya documentada en la
2.9 (`docs/admin-panel-design.md`).

## Elementos observados

**Cabecera del editor:**
- Título "Size table" con icono de ayuda (tooltip "?").
- Subtítulo "Setup the sizing measurements and units."
- Selector "Simple mode ↕" arriba a la derecha (sugiere que existe un
  modo "Advanced" alternable — no confirmado en captura, pendiente de
  verificar en vivo).

**Barra de configuración de unidades (fila superior de la rejilla):**
- Botón "No units" (primera columna) — sugiere que cada columna puede
  tener su propia unidad configurable por separado, pulsando ese botón.
- Botón "Size ranges in first column" (resto de columnas) — la primera
  columna se trata como identificador de fila (la talla), no como una
  medida más.
- Texto de ayuda: "To use different unit types in the same table, use
  the advanced mode." (enlace "advanced mode").

**Rejilla de datos:**
- Filas numeradas visualmente en negrita en la primera columna (5, 6,
  7... en la captura — probablemente el número de fila, no un dato de
  usuario, aunque en este caso coincide con la talla 36/37/38...).
- Celdas editables tipo hoja de cálculo, con scroll vertical (barra de
  scroll visible a la derecha de la rejilla).
- Al hacer clic en una celda vacía (última fila visible), aparece un
  cuadro de edición con borde azul — foco de celda tipo Excel.

**Barra de acciones bajo la rejilla:**
- "+ row" (botón visible completo).
- Un segundo botón cortado en la captura junto a "+ row" — presumible
  "+ col" (columna), a confirmar en vivo.
- "...ttings" (cortado) — presumible "Settings".
- "↓ Import table" — icono de descarga/importación, sugiere importar
  desde CSV/Excel u otro formato, a confirmar en vivo.
- Texto de ayuda en verde: "Right click t[o]...ions. Just like Excel!"
  — confirma que el menú contextual (ver abajo) es la vía principal
  para gestionar filas/columnas, presentado explícitamente como
  "igual que Excel".

**Menú contextual (botón derecho sobre una celda):**
- Delete Row
- Delete Column
- Insert Row → (submenú, probablemente "arriba/abajo")
- Insert Column → (submenú, probablemente "izquierda/derecha")
- Swap → (submenú — intercambiar filas/columnas, comportamiento exacto
  a confirmar en vivo)
- Copy & Paste entire table → (submenú — exportar/pegar la tabla
  completa, relacionado posiblemente con "Import table")
- Clear Values → (submenú)

**Controles bajo la rejilla (toggles):**
- "Enable count..." (cortado) — toggle "Off" — posible contador de
  filas/tallas, a confirmar en vivo.
- "Hide table" — toggle "Off" — ya identificado como gap en la
  comparativa de campos (ver Fase 2 revisitada, gaps detectados).

**Pie del editor:**
- Botones "Enlarge editor" y "Close".

## Preguntas abiertas para cuando arranque la 2.12
1. ¿Qué hace exactamente "Import table" (formato de archivo aceptado)?
2. ¿Qué diferencia el modo "Advanced" del "Simple" más allá de permitir
   unidades distintas por columna?
3. ¿Qué hace "Swap" exactamente (filas↔columnas, o reordenar dos filas
   entre sí)?
4. ¿Qué cuenta "Enable count" (probablemente nº de tallas visibles)?
5. Confirmar el nombre exacto del botón cortado junto a "+ row"
   ("+ col" presumido).

## Regla de exploración en vivo (acordada 09-sept-2026)
Cuando arranque la 2.12, Juanmi autorizó navegar en modo **solo lectura**
por el Admin real de Coolway EU (tienda con plan Kiwi Ultimate) para
resolver estas preguntas abiertas — pero **limitado a las zonas,
apartados, botones y configuraciones que NO estén ya documentados** en
la exploración de la 2.9 o en estas capturas, para no repetir trabajo ya
hecho. No se toca ninguna configuración real de esa tienda.
