## 1. Implementación (3.4.1)
- [x] 1.1 `{% for block in resolved_guide.blocks.value %}` (no `.blocks`
      directo — da GIDs sin resolver) + detección de tipo por campo
      distintivo (`block.type` viene vacío, no sirve para dispatch).
- [x] 1.2 Renderizar tabla: `block.headers.value`/`block.rows.value`
      (parseo nativo, sin `parse_json` — ese filtro no existe), tabla
      HTML, soporte visible de doble unidad.
- [x] 1.3 Renderizar texto: `block.content.value`, vía snippet
      `coolway-rich-text.liquid` (cobertura mínima: párrafos y listas).
- [x] 1.4 Renderizar imagen: `image`, `alt_text`, `caption` — implementado
      por el mismo patrón, sin validar con dato real Active (ver 2.2).
- [x] 1.5 Renderizar vídeo: `video_url`, `caption` — igual que imagen, sin
      validar con dato real Active.
- [x] 1.6 Cada bloque queda blindado con `{%- elsif -%}` en cadena — un
      bloque roto, Draft o de tipo no reconocido no rompe el resto.

## 2. Validación en coolway-sandbox (3.4.2)
- [x] 2.1 Validado con datos reales de "Goal Green Forest" (guía "Calzado
      adulto"): descripción y tabla (Talla EU/CM, 3 filas) renderizan
      correctamente en el storefront público. "Nilo Altitude Hike" (sin
      guía) sigue sin mostrar nada.
- [x] 2.2 Imagen y vídeo NO se pudieron validar con datos reales: los
      bloques de esos tipos en la guía de prueba estaban en Draft (mismo
      hallazgo que motivó el Scenario "Bloque en estado Draft"). Queda
      documentado como pendiente en `docs/render-blocks.md`, no bloqueante.
- [x] 2.3 Documentados en `docs/render-blocks.md` los 6 hallazgos reales
      (blocks.value, filtro Draft, block.type vacío, .value para JSON/rich
      text, texto plano directo, estructura de rich text).

## 3. Estado final
- [x] 3.1 Documento de contexto del proyecto actualizado con el cierre de
      la 3.4.
