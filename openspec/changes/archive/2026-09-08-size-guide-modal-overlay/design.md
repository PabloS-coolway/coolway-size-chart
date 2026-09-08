# Design — Modal/overlay interactivo (3.6-bis)

## Alternativas consideradas

1. **`<details>`/acordeón inline** (sin JS)
   - Más simple, cero JS, pero no es un modal — el contenido se expande en
     el flujo de la página, no coincide con la decisión UX de la 3.1
     ("Link modal", validada dos veces contra el ticket original y el
     comportamiento real de Kiwi en la 2.9).
   - Descartada por no cumplir la decisión ya tomada.

2. **`<dialog>` nativo de HTML**
   - Soporte nativo de overlay + cierre con Escape "gratis", pero el
     backdrop por defecto y el comportamiento de foco varían entre
     navegadores/versiones más antiguas — Coolway no ha fijado un baseline
     de navegadores soportados para este proyecto.
   - Se valora como opción de refinamiento futuro, no para esta primera
     versión: se prioriza un comportamiento predecible y probado en
     `coolway-sandbox` sobre la elegancia de la API nativa.

3. **Modal propio con `<div>` + CSS + JS mínimo** — **Elegida.**
   - Control total sobre apariencia (coherente con el resto del bloque,
     que ya usa CSS inline propio) y comportamiento, sin depender de
     soporte de navegador de `<dialog>`.
   - JS mínimo: abrir (click en enlace), cerrar (botón, click en backdrop,
     tecla Escape), gestión de foco básica.

## Decisión
Modal propio (`<div class="coolway-size-guide-block__modal">`), oculto por
defecto (`hidden` attribute / `display:none`), con backdrop y contenedor.
El contenido ya generado por 3.3/3.4/3.6 se mueve dentro de ese contenedor
sin cambios en su lógica de generación.

## Impacto en el código
- `size_guide.liquid`: envolver `.coolway-size-guide-block__content` en la
  estructura de modal; añadir botón "Cerrar"; añadir `<script>` inline con
  la lógica de abrir/cerrar/foco.
- Sin nuevas dependencias externas.

## Riesgos
- Primer JS de cliente del bloque — validar que no genera errores de
  consola ni bloquea el renderizado del resto de la página.
