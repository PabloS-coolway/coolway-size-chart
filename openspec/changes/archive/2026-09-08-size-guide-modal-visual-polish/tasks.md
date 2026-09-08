## 1. Implementación (08-sept-2026)
- [x] 1.1 Cabecera propia dentro del panel del modal (`__modal-header`):
      fondo oscuro, título (`product.title`) + subtítulo
      (`general.block_name` traducido), botón de cierre integrado como
      hijo flex (ya no posicionado en absoluto).
- [x] 1.2 Backdrop con `backdrop-filter: blur(4px)` (+ prefijo
      `-webkit-`) y fondo algo más oscuro (`rgba(0,0,0,0.6)`).
- [x] 1.3 Panel con esquinas más redondeadas (8px) y el padding movido al
      contenedor `__content` interior.
- [x] 1.4 `theme check` sin errores (ejecutado desde el directorio de la
      extensión).

## 2. Validación en `coolway-sandbox` (08-sept-2026)
- [x] 2.1 "Goal Green Forest": clic real abre el modal con la nueva
      cabecera (título del producto + "Size guide"), fondo con blur
      visible sobre las imágenes de fondo, botón "×" blanco integrado.
- [x] 2.2 Cierre con Escape: modal vuelve a `hidden`, foco regresa al
      enlace disparador — sin regresión del comportamiento de 3.6-bis.
- [x] 2.3 Consola sin errores.
- [x] 2.4 "Nilo Altitude Hike" (sin guía): bloque sigue vacío, sin
      regresión.

## 3. Estado final
- [x] 3.1 Documentado. Sigue el orden sugerido por la 3.10: 3.13 antes
      que 3.11/3.12.
