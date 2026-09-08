## 1. Editor de temas (08-sept-2026)
- [x] 1.1 Confirmado que el bloque "Guía de tallas" sigue instalado en el
      tema activo "Horizon" de `coolway-sandbox`, en la sección correcta
      del producto (preview del editor sobre "Goal Green Forest" muestra
      "Size guide: Guía de tallas - Calzado adulto" en la posición
      esperada, junto al selector de variantes).

## 2. Storefront público, como un cliente real (08-sept-2026)
- [x] 2.1 Navegación fresca a `/products/goal-green-forest-mujer`, sin
      parámetros de query ni JavaScript de test. Carga inicial: solo el
      enlace "Size guide: Guía de tallas - Calzado adulto" visible, sin
      contenido de la guía pintado en la página (confirma 3.6-bis).
- [x] 2.2 Clic real en el enlace: modal se abre con la tabla real (Talla
      EU/CM, filas 38/24.0, 39/24.7, 40/25.3) y botón de cierre "×".
- [x] 2.3 Cierre con tecla Escape: modal vuelve a `hidden`, el foco
      regresa al enlace (`document.activeElement === trigger`).
      Confirmado por JS de solo lectura, sin cambiar ningún estado.
- [x] 2.4 Consola sin errores tras la interacción completa (clic + cierre).
- [x] 2.5 Sin regresión respecto a las validaciones ya hechas en 3.6-3.8
      en esta misma sesión (unidad, RTL simulado, traducciones ES/EN
      reales).

## 3. Estado final
- [x] 3.1 Flujo completo verificado de extremo a extremo, sin
      herramientas de desarrollador, sobre el storefront público real de
      `coolway-sandbox`. Documentado en el documento de contexto del
      proyecto. Cierra la Fase 3 funcional (quedan 3.10-3.14 de diseño
      visual, bloque aparte).
