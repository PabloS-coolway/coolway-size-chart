# Modal/overlay interactivo de la guía de tallas (3.6-bis)

## Why
Desde la 3.2/3.4 el fichero `size_guide.liquid` deja documentado que genera
el HTML de contenido (enlace + tabla/texto/imagen/vídeo) pero el
modal/overlay que debía **ocultar ese contenido hasta el clic** en el
enlace (decisión UX 3.1: "Link modal") se dejó explícitamente fuera como
"trabajo aparte". Ese gap ha pasado desapercibido hasta ahora: Juanmi lo ha
detectado en vivo en `coolway-sandbox` — en "Goal Green Forest" se pinta
toda la tabla directamente en la ficha de producto, sin ningún enlace que
abra/cierre nada. No es una regresión de la 3.6, es la 3.1 aplicada solo a
medias hasta hoy.

## What Changes
- El contenido de la guía (`.coolway-size-guide-block__content`) pasa a
  estar **oculto por defecto** y solo se muestra al hacer clic en el
  enlace "Guía de tallas: ...".
- Se implementa como **modal real** (overlay con fondo semitransparente,
  cierre con botón "Cerrar", clic fuera, y tecla Escape) — no un simple
  `<details>`/acordeón inline, para ser fiel a la decisión de la 3.1 y al
  patrón real observado en Kiwi durante la 2.9.
- JavaScript mínimo, sin dependencias externas, embebido en el propio
  bloque (Theme App Extension no permite assets JS compartidos fácilmente
  fuera del bloque) — abrir/cerrar por click y por Escape, gestión básica
  de foco (mover el foco al modal al abrir, devolverlo al enlace al
  cerrar) por accesibilidad.
- No se modifica la lógica de lectura/renderizado de contenido (3.3/3.4) ni
  la de unidad por defecto (3.6) — solo se envuelve el resultado ya
  generado en un modal que se abre/cierra.

## Capabilities
- Modified: `size-guide-rendering` (añade requisito de visibilidad del
  contenido: oculto por defecto, visible solo tras interacción)

## Impact
- Archivos: `extensions/size-guide-block/blocks/size_guide.liquid`
- Riesgo: es la primera vez que el bloque incorpora JavaScript de cliente
  (hasta ahora era 100% SSR) — se valida que no rompe Core Web Vitals ni
  el criterio de aceptación global de "sin degradar Core Web Vitals del
  PDP" (documento de contexto del proyecto).
