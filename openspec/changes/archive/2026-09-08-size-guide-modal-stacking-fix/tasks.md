## 1. Diagnóstico (08-sept-2026)
- [x] 1.1 Confirmado con `elementFromPoint` que el header del tema
      (`header__columns`, z-index: 18) se pintaba por encima del
      backdrop en la zona del menú, pese a que el modal declara
      `z-index: 1000`.
- [x] 1.2 Causa raíz confirmada: el bloque vive dentro de
      `.product-details.sticky-content--desktop` (sticky, z-index: 1),
      que crea su propio contexto de apilamiento y atrapa el z-index
      interno del modal.

## 2. Fix
- [x] 2.1 El script mueve el modal a `document.body` la primera vez que
      se abre, con guardia para no moverlo dos veces.
- [x] 2.2 `z-index` del modal subido a 999999 (refuerzo).
- [x] 2.3 `theme check` sin errores.

## 3. Validación en `coolway-sandbox` (08-sept-2026)
- [x] 3.1 "Goal Green Forest": `elementFromPoint` sobre la zona del
      header ahora devuelve el propio backdrop — header oscurecido y
      desenfocado igual que el resto de la página, confirmado también
      visualmente.
- [x] 3.2 Cierre con Escape y reapertura funcionan igual, sin
      duplicados (`modal.parentElement === document.body`,
      `querySelectorAll(...).length === 1`).
- [x] 3.3 Sin errores de consola.
- [x] 3.4 "Nilo Altitude Hike" (sin guía): sin regresión.
