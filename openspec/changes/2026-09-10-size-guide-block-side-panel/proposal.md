# Propuesta — Panel lateral de edición de bloque (tarea 2.16, parte 1)

## Por qué

La 2.15 dejó los bloques de una guía con su formulario siempre visible
inline en la lista (sin "Editar"/expandir). Tras validarlo, el usuario
pidió acercar aún más la experiencia a Kiwi: en Kiwi, hacer clic en un
bloque abre un panel deslizante desde la derecha con el formulario
completo, y la lista de bloques queda como un resumen compacto.

Esto sustituye por completo el modelo "siempre visible" de la 2.15
(confirmado explícitamente por el usuario), no convive con él.

## Qué cambia

- La lista de bloques de una guía vuelve a mostrar solo un resumen
  compacto por bloque (badge de tipo + resumen + acciones subir/bajar/
  quitar), como antes de la 2.15, más un botón "Editar".
- Al pulsar "Editar" en un bloque, se abre un panel lateral (drawer)
  desde la derecha con el formulario completo de ese bloque — mismo
  formulario que ya existe (`BlockFormFields`), sin cambios en los
  campos ni en el contrato de guardado (`useFetcher` + intent
  `save-block`, sin cambios).
- El panel se cierra al pulsar "Cerrar", al hacer clic en el fondo
  oscurecido, o con la tecla Escape — y también automáticamente al
  guardar el bloque con éxito.
- Solo un bloque puede estar abierto en el panel a la vez.

## Fuera de alcance de esta parte

- Los estilos de tabla editables (segunda parte de la 2.16, se hace
  después).
- El flujo de "añadir bloque nuevo" (`AddBlockSection`) no cambia —
  sigue expandiéndose inline al elegir un tipo. Se revisará solo si el
  usuario lo pide explícitamente al validar esta parte.

## Impacto

- `app/routes/app.size-guides.$id.tsx`: estado de "bloque abierto en el
  panel" a nivel de la pantalla; `BlockRow` pasa a renderizar solo el
  resumen + botón "Editar"; nuevo componente de panel lateral
  (backdrop + drawer) que envuelve el formulario del bloque abierto.
- `app/components/BlockFormFields.tsx`: sin cambios de campos, se
  reutiliza tal cual dentro del panel.
