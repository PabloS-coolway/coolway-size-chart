# Tasks — 3.6 Auto-selección de unidad por geolocalización

- [x] 1. Definir lista cerrada de países de sistema imperial (ISO codes) en
      `size_guide.liquid`
- [x] 2. Calcular `imperial_first` a partir de
      `localization.country.iso_code` dentro del bloque de tabla con
      `has_dual_unit_selector`
- [x] 3. Marcar visualmente (clase CSS / orden) la unidad por defecto sin
      ocultar la otra
- [x] 4. Fallback seguro a cm cuando `localization.country` no resuelve
- [x] 5. Validar en vivo en `coolway-sandbox`: confirmado sin regresión en
      tabla de unidad única (no existe hoy tabla Active con
      `has_dual_unit_selector` — queda documentado como pendiente no
      bloqueante, igual que el gap de imagen/vídeo de la 3.4)
- [x] 6. Documentar en `docs/unit-auto-select.md` el comportamiento real
      observado en la tienda de pruebas
- [x] 7. Confirmar `theme check` sin errores nuevos
