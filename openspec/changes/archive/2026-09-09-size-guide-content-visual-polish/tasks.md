# Tasks — 3.12 Fit note y tipografía general

## Implementación
- [ ] Estilo "fit note" en `.coolway-size-guide-block__description`:
      fondo gris claro, borde de acento a la izquierda (color oscuro a
      juego con la cabecera/tabla), padding, esquinas redondeadas.
- [ ] Margen inferior uniforme en `__text`, `__image`, `__video`,
      `__table-wrap` para espaciado consistente entre bloques.
- [ ] `coolway-rich-text`: `line-height` y margen entre `<p>`/`<ul>`.
- [ ] Tamaño de fuente mayor para el `<strong>` usado como heading
      (documentar la limitación de la 3.12 sobre strong vs. heading).
- [ ] `<figcaption>` de imagen/vídeo: tamaño reducido, color atenuado,
      cursiva.
- [ ] `theme check` desde `extensions/size-guide-block` sin errores.

## Validación en `coolway-sandbox` (nunca en tienda real)
- [ ] Validar visualmente sobre un producto con descripción de guía
      rellena (confirmar el tratamiento de caja).
- [ ] Validar espaciado entre bloques sobre una guía con varios tipos
      de bloque (tabla + texto, al menos).
- [ ] Confirmar sin regresión en "Nilo Altitude Hike" (sin guía).
- [ ] Confirmar sin regresión visual en RTL (forzando `dir="rtl"`).
- [ ] Sin errores de consola.
