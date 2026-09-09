# Design — 2.12 Editor de tabla tipo hoja de cálculo

## Context
El bloque tabla guarda `headers` (array de strings) y `rows` (array de
arrays de strings) como JSON en el metaobject `size_guide_block_table`
— eso no cambia. Hoy el usuario edita ese JSON a mano en un
`<textarea>`. El editor de bloque es una ruta Remix (`action`/`loader`
+ formulario) sin JS de cliente más allá de React/Polaris estándar.

## Goals
- Editar la tabla como una rejilla (celdas, no JSON), con las acciones
  básicas de Kiwi: añadir/quitar filas y columnas, vaciar, copiar/pegar
  la tabla completa, importar desde texto tipo CSV/Excel.
- Cero cambios en el modelo de datos ni en el contrato del backend.

## Non-Goals
- No se replica el modo "Advanced" de Kiwi (unidades distintas por
  columna) — el modelo de datos actual no lo soporta y no hay una
  necesidad real confirmada (0 casos detectados en el inventario 0.1).
- No se replica "Swap" tal cual — su comportamiento exacto no se
  confirmó (pendiente en `docs/admin-panel-2.12-kiwi-reference.md`); se
  cubre parcialmente con insertar/eliminar fila y columna.
- No se implementan atajos de teclado más allá de navegación básica.

## Decisions
- **Estado en React, sin librería de grid externa.** Una tabla de
  guía de tallas tiene decenas de filas como mucho (nunca miles) — no
  hace falta virtualización ni una librería de spreadsheet completa
  (ej. Handsontable). Un componente propio con `useState` sobre
  `string[][]` es suficiente y evita añadir una dependencia nueva al
  proyecto.
- **Serialización solo al enviar el formulario.** La rejilla vive en
  estado de React; al hacer submit, se serializan `headers`/`rows` a
  JSON en inputs ocultos (`<input type="hidden">`) — la `action` del
  servidor no cambia en absoluto, sigue leyendo `formData.get("headers")`/
  `formData.get("rows")` igual que hoy.
- **Menú contextual propio, no el del navegador.** `onContextMenu` con
  `preventDefault()` y un menú posicionado en las coordenadas del
  clic — mismo patrón visual que el de Kiwi (aunque sin r{eplicar
  pixel a pixel su estilo).
- **Importar tabla = pegar texto, no subir archivo.** Kiwi no confirmó
  el formato de archivo exacto de "Import table" (pregunta abierta en
  la referencia). Se implementa la vía más simple y ya estándar
  (pegar contenido copiado de Excel/Sheets, separado por tabuladores,
  o CSV con comas) en vez de parsear un archivo subido — cubre el caso
  de uso real (migrar una tabla existente) sin necesidad de resolver
  la pregunta abierta primero.
- **Copiar/pegar tabla completa vía el portapapeles del sistema**
  (`navigator.clipboard`), en formato TSV — compatible de vuelta con
  Excel/Sheets si el usuario quiere sacar los datos fuera.

## Risks / Trade-offs
- Un componente de rejilla propio es más trabajo que un `<textarea>`,
  pero es exactamente el gap que la 2.9/2.11 identificó como
  bloqueante antes del rollout — Marketing no puede escribir JSON.
- Sin las respuestas a las preguntas abiertas de Kiwi (Advanced mode,
  Swap, Import table real), esta tarea cubre el 100% de las
  necesidades reales detectadas en el inventario (0.1: headers/rows
  simples, con o sin selector de doble unidad) sin bloquear el
  rollout esperando esas respuestas.
