# 2.12 — Editor de tabla tipo hoja de cálculo

## Why
El editor actual del bloque tabla (`app.size-guides.$id_.blocks_.$type.$blockId.tsx`,
tarea 2.10) son dos `<textarea>` con el JSON en bruto de `headers` y
`rows`. Nadie en Marketing sabe escribir JSON a mano — es la razón por
la que se decidió construir un panel propio en la 2.8. Kiwi resuelve
esto con una rejilla tipo hoja de cálculo (capturas del usuario,
09-sept-2026, documentadas en `docs/admin-panel-2.12-kiwi-reference.md`):
botones "+row"/"+col", menú contextual (clic derecho) con
insertar/eliminar fila o columna, vaciar valores y copiar/pegar la
tabla completa, más "Import table" y "Settings".

## What Changes
- El editor de tabla pasa de 2 `<textarea>` de JSON a una rejilla
  editable (componente React nuevo, cliente): cabeceras editables en la
  fila superior, celdas editables por fila/columna.
- Botones de acción: "+ Fila", "+ Columna".
- Menú contextual (clic derecho sobre una celda): Eliminar fila,
  Eliminar columna, Insertar fila (arriba/abajo), Insertar columna
  (izquierda/derecha), Vaciar valores, Copiar tabla, Pegar tabla.
- Navegación por teclado básica entre celdas: Tab/Shift+Tab (siguiente/
  anterior celda), Enter (baja a la misma columna de la fila siguiente).
- "Importar tabla": pegar contenido tipo Excel/CSV (separado por
  tabuladores o comas) en un cuadro de texto, que rellena la rejilla.
- El contrato con el backend NO cambia: al guardar, la rejilla se
  serializa a los mismos campos `headers`/`rows` (JSON) que ya espera
  la action existente — cero cambios en el modelo de datos ni en el
  bloque de storefront (Fase 3).
- Fuera de alcance (limitaciones conocidas, documentadas para
  cuando/si se necesiten): el modo "Advanced" de Kiwi (unidades por
  columna), "Swap" (comportamiento exacto no confirmado), y cualquier
  atajo de teclado más allá de Tab/Shift+Tab/Enter.

## Capabilities
- Added: `size-guide-admin-panel` (primera capability para el panel de
  administración propio — no existía ninguna hasta ahora; las tareas
  2.1-2.11 se documentaron solo en `docs/`, sin spec delta)

## Impact
- Archivo modificado: `app/routes/app.size-guides.$id_.blocks_.$type.$blockId.tsx`
  (sustituye los 2 `<textarea>` del bloque tabla por el nuevo
  componente de rejilla; el resto de tipos de bloque, sin cambios).
- Archivo nuevo: componente de rejilla editable (client-side, sin
  dependencias externas nuevas).
- Validado en el panel admin de `coolway-sandbox`, nunca en tienda
  real.
