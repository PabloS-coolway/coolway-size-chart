## 1. Fix
- [x] 1.1 Cambiar `api_version = "2026-10"` a `api_version = "2026-07"` en
      `[webhooks]` de `shopify.app.toml`. Hecho y confirmado con
      `Select-String` sobre el fichero.

## 2. Verificación
- [x] 2.1 `shopify app deploy` NO se ejecuta manualmente (regla dura del
      repo, `CLAUDE.md`: el deploy real va siempre vía CI, nunca desde una
      máquina local). El cambio de `api_version` quedará confirmado contra
      `coolway-sandbox` en el próximo deploy vía CI — no bloquea el cierre
      de este fix, que es puramente de configuración.
- [ ] 2.2 Pendiente: confirmar en el siguiente deploy por CI que las
      suscripciones de webhook siguen registradas correctamente en 2026-07
      (dejar anotado para quien revise ese pipeline).

## 3. Estado final
Fix de configuración aplicado y validado (`openspec validate --changes
fix-webhook-api-version-mismatch --strict` → OK). Pendiente solo la
confirmación pasiva en el próximo deploy por CI (tarea 2.2), que no depende
de este repositorio ni de este chat.
