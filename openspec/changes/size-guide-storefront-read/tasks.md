## 1. Implementación (3.3.1)
- [ ] 1.1 Extender `size_guide.liquid`: cuando hay `resolved_size_guide`, leer
      `.value.title`, `.value.description` y `.value.blocks` del metaobject
      referenciado, mostrando algo mínimo (ej. el título) a modo de
      confirmación visual — no el render final (eso es 3.4).
- [ ] 1.2 Manejar el caso de referencia rota/no resuelta sin lanzar error de
      Liquid visible (ver Scenario "Acceso Storefront no resuelto").

## 2. Validación en coolway-sandbox (3.3.2)
- [ ] 2.1 Probar con "Goal Green Forest" (tiene `resolved_size_guide`) y
      confirmar que el título de la guía referenciada se muestra sin error.
- [ ] 2.2 Confirmar que "Nilo Altitude Hike" (sin guía) sigue sin mostrar
      nada, igual que en 3.2.
- [ ] 2.3 Documentar el resultado real de la pregunta crítica (¿resuelve
      Liquid el metaobject gracias al acceso Storefront público de la 1.4?)
      en `docs/`, sea cual sea el resultado.

## 3. Estado final
- [ ] 3.1 Actualizar el documento de contexto del proyecto con el cierre de
      la 3.3 y el hallazgo sobre el acceso Storefront.
