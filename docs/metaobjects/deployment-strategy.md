# Estrategia de despliegue de definiciones de metaobject — Tarea 1.4

**Estado:** ✅ Completada — script escrito, ejecutado y validado contra `coolway-sandbox` el 12-ago-2026. Los 4 puntos que estaban marcados como "sin verificar" se confirmaron correctos en la ejecución real, sin necesidad de corregir nada.

## Decisión de arquitectura: script propio, no config nativa de `shopify.app.toml`

Shopify ofrece un mecanismo nativo para declarar metaobjects como parte de `shopify.app.toml` (de hecho el repo ya tenía un bloque `[metaobjects.app.example]` generado por el CLI de plantilla). Se evaluaron ambas opciones y se decidió **script propio contra la Admin GraphQL API**, siguiendo la instrucción explícita del jefe de proyecto en `CLAUDE.md`:

> *"Metaobjects y metafields: sus definiciones se crean y actualizan únicamente mediante el script idempotente del repo contra la Admin GraphQL API. Nunca se crean o editan a mano desde el admin de Shopify."*

El bloque `[metaobjects.app.example]` de `shopify.app.toml` queda sin usar — no se ha borrado por si se decide reconsiderar esta decisión más adelante, pero no forma parte del mecanismo de despliegue real del proyecto.

## Qué hace el script

`scripts/deploy-metaobject-definitions.js` — ver comentario de cabecera del propio fichero para el detalle completo. Resumen:

- Crea (si no existen) o actualiza (añadiendo solo los campos que falten) las 6 definiciones: `size_guide`, `size_guide_block_table`, `size_guide_block_text`, `size_guide_block_image`, `size_guide_block_video`, `size_guide_rule`.
- Es **idempotente**: ejecutarlo dos veces seguidas no crea duplicados — la segunda vez detecta que todo ya existe y no hace ninguna llamada de escritura. **Verificado con ejecución real (ver más abajo).**
- **Nunca borra ni cambia el tipo de un campo existente** — solo añade lo que falte.
- Respeta el orden de dependencias: primero los 4 bloques, luego `size_guide` (que referencia los bloques), luego `size_guide_rule` (que referencia `size_guide`) — igual que hicimos a mano en el sandbox.
- Activa las mismas capacidades que activamos a mano en el sandbox para las 6 definiciones: estados Active/Draft, traducciones, y acceso a la Storefront API.

## Cómo ejecutarlo

```bash
# Modo de prueba, no escribe nada — solo muestra qué haría
node scripts/deploy-metaobject-definitions.js --store=coolway-sandbox.myshopify.com --token=<TOKEN> --dry-run

# Ejecución real
node scripts/deploy-metaobject-definitions.js --store=coolway-sandbox.myshopify.com --token=<TOKEN>
```

También disponible como scripts de npm:
```bash
npm run deploy:metaobjects:dry-run -- --store=coolway-sandbox.myshopify.com --token=<TOKEN>
npm run deploy:metaobjects -- --store=coolway-sandbox.myshopify.com --token=<TOKEN>
```

### De dónde sacar el `--token`

Usar el **token de acceso offline de la propia app `coolway-size-chart`**, ya instalada en `coolway-sandbox` — no crear una app custom aparte solo para esto (más fiel a cómo se hará en las 14 tiendas reales, donde tampoco se crearán apps sueltas).

1. `npx prisma studio` desde la raíz del repo → tabla `Session` → fila con `shop = coolway-sandbox.myshopify.com` e `isOnline = false` → columna `accessToken`.
2. **Importante — el token caduca cada ~24h** (por `expiringOfflineAccessTokens: true` en `app/shopify.server.ts`). Si al ejecutar el script da `Invalid API key or access token`, comprueba la columna `expires` de esa fila en Prisma Studio:
   - Si ya pasó: hay que refrescar la sesión. `npm run dev` sin más **no la refresca** si la app ya estaba instalada — hace falta **desinstalar la app desde el Admin (Apps → coolway-size-chart → Desinstalar) y volver a instalarla** (el enlace `[1]` que muestra `shopify app dev` al arrancar dispara el flujo OAuth completo). Tras reinstalar, la fila de `Session` tendrá un `accessToken` y `expires` nuevos.
   - Usar el token dentro de esa ventana de 24h; si tarda la revisión, sacar uno fresco de nuevo.

## Validación realizada (10-ago-2026, contra `coolway-sandbox`)

1. **Con las 6 definiciones ya existentes** (creadas a mano en 1.1/1.2/1.3): `--dry-run` y ejecución real ambas dijeron correctamente "ya existe con todos los campos — nada que hacer" para las 6. Esto solo prueba la rama de "detectar que ya existe", no la de creación real.
2. **Para probar la creación real desde cero**, se borraron a mano las 6 definiciones en el Admin (acción destructiva realizada por Juanmi, nunca por el agente) — esto también borró sus entradas de prueba (la guía "Calzado adulto", su bloque de tabla, y la regla "ANY"), como es esperado y ya documentado en la sección de rollback.
3. **Ejecución real (`npm run deploy:metaobjects`) contra las 6 ya borradas:** las 6 se crearon sin ningún error —
   ```
   ✅ Creada la definición "size_guide_block_table" (gid://shopify/MetaobjectDefinition/16847994985)
   ✅ Creada la definición "size_guide_block_text" (gid://shopify/MetaobjectDefinition/16848027753)
   ✅ Creada la definición "size_guide_block_image" (gid://shopify/MetaobjectDefinition/16848060521)
   ✅ Creada la definición "size_guide_block_video" (gid://shopify/MetaobjectDefinition/16848093289)
   ✅ Creada la definición "size_guide" (gid://shopify/MetaobjectDefinition/16848126057)
   ✅ Creada la definición "size_guide_rule" (gid://shopify/MetaobjectDefinition/16848158825)
   ```
   Esto confirma que los 4 puntos que estaban marcados como "mejor estimación, sin verificar" eran correctos: el tipo `list.mixed_reference` para `blocks`, las validaciones `metaobject_definition_ids` / `metaobject_definition_id`, y `access: { storefront: "PUBLIC_READ" }`. No hizo falta corregir nada.
4. **Segunda ejecución real inmediatamente después, sin borrar nada:** las 6 dijeron `"..." ya existe con todos los campos — nada que hacer`, sin duplicados ni errores. **Esto es la comprobación exacta que pide el criterio de aceptación de la 1.4** ("ejecutar el despliegue dos veces no genera duplicados ni errores").
5. **Confirmación visual en el Admin:** las 6 definiciones aparecen en Configuración → Metacampos y metaobjetos, con "Agregado por: coolway-size-chart" (creadas por la app, vía API, no a mano) y 0 entradas cada una (esperado, ver punto 2).

## Rollback

El script está diseñado para ser **seguro por construcción**: nunca borra campos ni definiciones, así que no hay un escenario de "deshacer una escritura destructiva" que automatizar. El procedimiento de rollback es:

1. **Config incorrecta detectada antes de ejecutar en más tiendas:** revertir el commit de `scripts/deploy-metaobject-definitions.js` en git. La versión anterior del fichero es la fuente de verdad; no hace falta "deshacer" nada en Shopify porque el script de la versión nueva no llegó a ejecutarse en esas tiendas todavía.
2. **Campo creado con el tipo equivocado en una tienda concreta:** no es automatizable sin riesgo de pérdida de datos (Shopify no permite cambiar el tipo de un campo con entradas). Corregirlo a mano en el Admin de esa tienda concreta: borrar el campo (con las entradas afectadas ya migradas o vacías) y volver a ejecutar el script para que lo recree con el tipo correcto. Documentar el incidente y la tienda afectada antes de continuar con el resto de la ola.
3. **Definición completa creada de más o por error:** eliminar la definición manualmente desde el Admin de la tienda afectada (Configuración → Metacampos y metaobjetos) — es una acción destructiva que borra también las entradas, así que requiere confirmación humana explícita, nunca automatizada. **Verificado de primera mano en esta misma validación** (punto 2 de arriba): borrar una definición efectivamente borra sus entradas sin posibilidad de deshacerlo.

## Rollout a las 14 tiendas reales

Importante: **la app `coolway-size-chart` no está instalada todavía en ninguna de las 14 tiendas reales de Coolway** (solo en `coolway-sandbox`), según lo verificado en la Fase 0 (tarea 0.6). Antes de poder ejecutar este script contra una tienda real, hace falta:

1. Instalar la app en esa tienda (obtiene el token de acceso necesario, vía el mismo flujo de Prisma Studio documentado arriba).
2. Ejecutar el script contra esa tienda.

Siguiendo el modelo de trabajo del proyecto (rollout por olas, nunca las 14 de golpe):
- **Ola 0 (hecho):** `coolway-sandbox` — validación del esquema (1.1-1.3) y del script de despliegue (1.4), incluida la prueba de creación desde cero y de idempotencia.
- **Ola 1 (piloto):** 1 tienda real a decidir por el equipo.
- **Punto de control humano.**
- **Ola 2:** 3 tiendas.
- **Punto de control humano.**
- **Ola 3:** resto de tiendas.

El mismo comando, el mismo script — solo cambia `--store` y `--token` en cada ejecución, y el número de tiendas por tanda.

## Hallazgo aparte, fuera del alcance de esta tarea

Al revisar `app/shopify.server.ts` para confirmar la versión de API, se observó `distribution: AppDistribution.AppStore` — pero el proyecto está definido en todo el resto de la documentación como una app **privada**, distribuida por enlace de instalación desde la Partner organization, nunca listada en la App Store pública. Puede ser simplemente el valor por defecto que deja el scaffold del CLI sin que nadie lo haya cambiado; el valor más correcto para este proyecto sería `AppDistribution.SingleMerchant`. No se ha modificado — queda como nota para que el equipo lo revise y decida.
