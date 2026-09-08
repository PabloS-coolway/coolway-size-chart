# Tasks — 3.8 Traducciones del bloque en sí

- [x] 1. Crear `locales/en.default.json` con claves `general.size_guide_link`
      (con interpolación `{{ title }}`), `general.close`,
      `general.block_name`
- [x] 2. Crear `locales/es.json` y `locales/fr.json` con las mismas claves
      traducidas
- [x] 3. Sustituir los literales hardcodeados en `size_guide.liquid` por
      `| t` (enlace/título del modal, `aria-label` del botón de cierre)
- [x] 4. Traducir el `name` del `{% schema %}` vía `t:general.block_name`
      (hallazgo real: requiere ficheros `*.schema.json` aparte, ver
      docs/translations.md)
- [x] 5. Confirmar `theme check` sin errores nuevos
- [x] 6. Validar en vivo en `coolway-sandbox`: idioma por defecto real es
      inglés (no español, corrige asunción del proposal); `?locale=es`/
      `?locale=fr` caen a inglés por no estar publicados — texto fijo en
      inglés, título de la guía sin verse afectado
- [x] 7. Confirmar sin regresión en producto sin guía
- [x] 8. Documentar en `docs/translations.md`, incluida la limitación real
      encontrada (solo inglés publicado en el sandbox)
