# 2.14 - Campos nuevos en bloque tabla: footer text + hide table
## Contexto
Comparativa con Kiwi (documentada en 08-sept-2026, ver
`docs/admin-panel-2.12-kiwi-reference.md`) detecto 2 campos del bloque de
tabla que Kiwi ofrece y que nuestro panel no tenia todavia: un texto de
pie de tabla ("Table footer text") y un interruptor para ocultar la tabla
sin perder sus datos ("Hide table"). Se trato como bloqueante antes del
rollout, junto con 2.12 y 2.13.
## Que se implemento
Modelo de datos (`scripts/deploy-metaobject-definitions.js`, definicion
`size_guide_block_table`): 2 campos nuevos.
- `footer_text` (`multi_line_text_field`, primer uso de este tipo en el
  proyecto).
- `hide_table` (`boolean`, por defecto false / ausente).
Desplegado de forma idempotente en `coolway-sandbox` (dry-run, run real,
y una tercera ejecucion de repeticion para confirmar que no duplica ni
falla).
Panel de administracion
(`app/routes/app.size-guides.$id_.blocks_.$type.$blockId.tsx`, rama
`type === "table"`): query, loader, action y formulario ampliados con un
`<textarea>` para "Footer text" y un checkbox para "Hide table", debajo
del checkbox ya existente "Has dual unit selector".
Storefront (`extensions/size-guide-block/blocks/size_guide.liquid`):
- La tabla completa deja de renderizarse cuando `hide_table` es `true`
  (condicion anadida al `if` que ya comprobaba `headers`/`rows`), sin
  tocar los datos guardados en el metaobject.
- El texto de pie se renderiza como una nota en cursiva bajo la tabla,
  solo si `footer_text` no esta vacio.
## Ajuste de posicion tras la primera validacion visual
En la primera pasada, el footer se renderizaba dentro de la caja con
borde de la tabla (`.coolway-size-guide-block__table-wrap`), en vez de
debajo y fuera de ella. Se corrigio moviendo el `<p>` del footer fuera del
`<div>` de `table-wrap`.
Con ese cambio, el espacio entre la tabla y el footer paso a ser el mismo
margen que separa el bloque del siguiente (1.5rem, ~24px) por colapso de
margenes CSS entre elementos hermanos. El usuario pidio que el footer
quedara "practicamente pegado" a la tabla (maximo ~5px). Se resolvio
introduciendo un contenedor `.coolway-size-guide-block__table-outer` que
envuelve tabla + footer y es quien ahora lleva el margen de separacion
hacia el siguiente bloque (1.5rem); `table-wrap` se quedo solo con su
estilo visual (borde/radio), sin margen propio, y el footer paso a
`margin-block-start: 5px`. Asi la separacion tabla-footer es de 5px
siempre, y la separacion hacia el siguiente bloque se mantiene igual
tanto si hay footer como si no.
## Validacion (coolway-sandbox)
Validado manualmente por el usuario en el panel de administracion y el
storefront de `coolway-sandbox` (la automatizacion de navegador no pudo
completar la comprobacion del storefront por el gate de contrasena de la
tienda; ver nota tecnica mas abajo):
1. Bloque de tabla real ("Calzado adulto") sigue funcionando igual con
   "Footer text" vacio y "Hide table" desactivado (compatibilidad hacia
   atras). OK.
2. Texto anadido al footer de un bloque de prueba, guardado, y confirmado
   visible como nota bajo la tabla en el storefront. OK (tras el ajuste de
   posicion y espaciado descrito arriba).
3. "Hide table" activado en ese bloque: la tabla y su footer dejan de
   verse en el storefront sin romper el resto de la guia, y `headers`/
   `rows` se conservan intactos al reabrir el editor. OK.
4. "Hide table" desactivado de nuevo: la tabla reaparece con los mismos
   datos. OK.
### Nota tecnica: bloqueo de validacion por API directa
`coolway-sandbox.myshopify.com` tiene activada la proteccion de
contrasena estandar de Shopify en su storefront publico; una peticion GET
directa (sin navegador autenticado) devuelve la pagina generica de
contrasena en vez de la pagina real, lo que impidio validar el
renderizado del storefront via API/curl. No se intento ni se considero
saltarse esa proteccion; se opto por revertir todo el estado de prueba
usado para investigarlo y pasar la validacion visual al usuario, que la
completo el mismo directamente en su navegador ya autenticado.
## Fuera de alcance (explicito, ver `design.md` del change OpenSpec)
- Un interruptor tipo "Enable count" (uso real desconocido, descartado en
  la comparativa con Kiwi de la 2.12/2.13).
- `hide_table` no tiene relacion con el estado Draft/Active del
  metaobject; son mecanismos independientes.
- No hubo cambios en el editor de tabla tipo hoja de calculo
  (`TableGridEditor.tsx`) de la 2.12.
