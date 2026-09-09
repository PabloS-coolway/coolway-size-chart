# Tasks — 3.14 Validación visual final y responsive

## Validación en `coolway-sandbox` (nunca en tienda real)
- [ ] Desktop: repaso conjunto de "Goal Green Forest" (tabla simple +
      descripción) — confirmar que 3.11/3.12/3.13 conviven bien.
- [ ] Desktop: guía con selector de doble unidad (si existe alguna en
      `coolway-sandbox`, si no, forzar visualmente).
- [ ] Móvil (viewport Chrome DevTools, ej. 375×812): mismo recorrido —
      enlace, apertura de modal, tabla, descripción, cierre.
- [ ] Confirmar scroll horizontal de la tabla si desborda en móvil, sin
      que el modal completo tenga que hacer scroll horizontal.
- [ ] Confirmar sin regresión en "Nilo Altitude Hike" (sin guía), en
      desktop y móvil.
- [ ] Confirmar RTL (forzado) también en móvil.
- [ ] Sin errores de consola en ningún caso.

## Corrección (solo si la validación encuentra un problema real)
- [ ] Documentar el hallazgo.
- [ ] Aplicar el fix mínimo necesario (ver design.md).
- [ ] Repetir la validación afectada tras el fix.
- [ ] `theme check` sin errores.
