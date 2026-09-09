# 3.12 — Aviso de ajuste (fit note) y tipografía general del resto de bloques

## Why
El inventario de gaps visuales (3.10) detectó dos diferencias pendientes
frente a Kiwi, aparte de la tabla (3.11, ya cerrada): (1) el aviso de
ajuste ("fit note", ej. "Small fit, we recommend one size up") se
muestra en Kiwi en una caja destacada con acento de color, y en nuestro
bloque no existe ningún tratamiento equivalente; (2) el resto de
bloques de contenido (texto, imagen, vídeo) heredan la tipografía base
del tema sin ningún ajuste propio, mientras que Kiwi tiene una jerarquía
tipográfica más marcada.

## What Changes
- La **descripción de la guía** (`resolved_guide.description`, ya
  existente desde la 1.1, se renderiza siempre en primer lugar antes de
  los bloques) pasa a mostrarse como una caja tipo "fit note": fondo
  gris claro, borde de acento a la izquierda, esquinas redondeadas —
  sin introducir ningún campo nuevo en el modelo de datos. Es el lugar
  natural para este aviso: aparece siempre en la misma posición que en
  Kiwi (encima del resto del contenido).
- Espaciado consistente entre bloques (texto/imagen/vídeo/tabla): cada
  bloque renderizado dentro del bucle principal gana un margen inferior
  uniforme, en vez del espaciado implícito y desigual actual.
- Tipografía del contenido de texto enriquecido (`coolway-rich-text`):
  párrafos y listas con `line-height` más generoso y margen entre
  ellos; los "heading" (hoy renderizados como `<strong>` suelto) pasan a
  un tamaño de fuente mayor, en línea con la jerarquía de Kiwi.
- `<figcaption>` de imagen/vídeo con tratamiento tipográfico propio
  (tamaño reducido, color atenuado, cursiva) en vez de heredar el estilo
  de párrafo del tema.
- Fuera de alcance: cualquier campo nuevo en el modelo de datos (eso,
  si hiciera falta, sería trabajo de Fase 1/2, no de este rediseño
  visual de storefront); validación final completa y responsive
  (eso es 3.14).

## Capabilities
- Added: `size-guide-rendering` (nuevo requisito de estilo visual para
  la descripción/fit note y el resto de bloques de contenido)

## Impact
- Archivo modificado: `extensions/size-guide-block/blocks/size_guide.liquid`
  (CSS y clases; sin cambios de lógica de resolución de datos).
- Archivo modificado: `extensions/size-guide-block/snippets/coolway-rich-text.liquid`
  (solo si hace falta ajustar el marcado del heading — a confirmar en
  implementación; el CSS puede bastar sin tocar este snippet).
- Validado exclusivamente en `coolway-sandbox`, nunca en tienda real.
