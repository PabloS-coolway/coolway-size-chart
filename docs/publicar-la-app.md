# Publicar la app en Shopify

Dos cosas distintas que se confunden a menudo:

| Qué | Quién lo hace | Cuándo |
|---|---|---|
| **El servidor web** (el panel embebido, OAuth, webhooks) | DigitalOcean, solo | En cada merge a `main` |
| **La versión de la app** (configuración + Theme App Extension) | El workflow **Publicar la app en Shopify** | Cuando lo lanza una persona |

El segundo NO es automático **a propósito**. `shopify app deploy` publica una versión, y al
publicarla la extensión llega de golpe a **todas** las tiendas donde la app esté instalada. El
`CLAUDE.md` manda desplegar por olas (piloto → 3 tiendas → resto, con parada humana entre ellas),
así que lanzarlo en cada merge dejaría esa regla en nada.

## Lo que hay que tener una vez

Un **App Automation Token**, en los secretos del repositorio como `SHOPIFY_APP_AUTOMATION_TOKEN`.

1. Dev Dashboard → la app `coolway-size-chart` → **Settings** → sección **App Automation Token** →
   generar. (Sustituye a los CLI tokens del Partner Dashboard: Shopify los reemplazó en mayo de
   2026. Los viejos siguen valiendo hasta que caduquen, pero se llaman por otra variable —
   `SHOPIFY_CLI_PARTNERS_TOKEN`— y no es la que usa este workflow.)
2. GitHub → el repo → **Settings** → **Secrets and variables** → **Actions** → **New repository
   secret** → nombre exacto `SHOPIFY_APP_AUTOMATION_TOKEN`, y pegar el token.

Opcional pero recomendable: **Settings → Environments → `produccion` → Required reviewers**. El
workflow ya apunta a ese entorno, así que con eso cada publicación necesita que alguien la apruebe.

## Publicar

GitHub → pestaña **Actions** → **Publicar la app en Shopify** → **Run workflow**:

- **mensaje** (obligatorio): qué se publica y por qué. Queda guardado en la versión de la app, que
  es donde se mira cuando algo se rompe y hay que saber qué cambió.
- **solo_crear_version**: márcalo para crear la versión **sin** soltarla a las tiendas, y revisarla
  antes en el Dev Dashboard. Es la opción prudente cuando el cambio toca la extensión.

## Lo que el workflow no hará nunca

- **No borra.** Usa `--allow-updates` y nunca `--allow-deletes`: borrar configuración o extensiones
  borra también los datos que tengan en las tiendas. Si algún día hay que borrar algo de verdad, se
  hace aparte y a conciencia.
- **No usa `@latest`.** El CLI está fijado (hoy `4.8.2`). Si no, el día que Shopify saque una
  versión nueva el despliegue cambiaría de comportamiento solo, sin que nadie tocara el repo.
  Subirlo es un cambio deliberado, en su PR.

## Después de publicar

Instalar por olas, nunca las 14 tiendas de golpe: primero `coolway-sandbox`, después Chile, y solo
entonces el resto, con un punto de control humano entre cada ola.
