# Tasks — 3.7 Soporte RTL

- [x] 1. Definir lista cerrada de idiomas RTL (ar, he, fa, ur) en
      `size_guide.liquid`
- [x] 2. Calcular `coolway_is_rtl` a partir de `request.locale.iso_code` y
      aplicar `dir` en el contenedor raíz del bloque
- [x] 3. Reescribir el CSS de posicionamiento (botón de cierre del modal,
      etc.) con propiedades lógicas (`inset-inline-end`,
      `margin-inline-start`) en vez de físicas
- [x] 4. Confirmar `theme check` sin errores nuevos
- [x] 5. Validar en vivo en `coolway-sandbox` forzando `dir="rtl"`
      (simulado, ver design.md) sobre "Goal Green Forest": enlace, modal y
      tabla se leen y alinean correctamente
- [x] 6. Confirmar sin regresión en LTR y en producto sin guía
- [x] 7. Documentar en `docs/rtl-support.md`, incluida la limitación de
      validación (sin árabe real publicado en el sandbox)
