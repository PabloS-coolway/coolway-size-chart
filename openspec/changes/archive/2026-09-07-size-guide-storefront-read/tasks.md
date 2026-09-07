## 1. Implementación (3.3.1)
- [x] 1.1 Extender `size_guide.liquid`: cuando hay `resolved_size_guide`, leer
      `.value.title`, `.value.description` y `.value.blocks` del metaobject
      referenciado, mostrando el título a modo de confirmación visual — no
      el render final (eso es 3.4).
- [x] 1.2 Manejar el caso de referencia rota/no resuelta sin lanzar error de
      Liquid visible (el `{%- if resolved_guide -%}` ya cubre este caso:
      `resolved_guide` es `nil` si la referencia no resuelve).

## 2. Validación en coolway-sandbox (3.3.2)
- [x] 2.1 Probado con "Goal Green Forest" (`goal-green-forest-mujer`) sobre
      el storefront público — muestra "Guía de tallas: Guía de tallas -
      Calzado adulto", confirmando que el título real llega sin error.
- [x] 2.2 Probado con "Nilo Altitude Hike" (`nilo-kak`) — sigue sin mostrar
      nada, igual que en 3.2.
- [x] 2.3 Documentado en `docs/storefront-read.md`: la pregunta crítica
      (¿resuelve Liquid el metaobject gracias al acceso Storefront público
      de la 1.4?) queda confirmada — SÍ funciona sin ajuste adicional.

## 3. Estado final
- [x] 3.1 Documento de contexto del proyecto actualizado con el cierre de
      la 3.3 y el hallazgo sobre el acceso Storefront.
