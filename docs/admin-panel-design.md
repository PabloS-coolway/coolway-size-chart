# Diseño del panel de administración — Tarea 2.9

**Objetivo (decidido en la 2.8):** recrear en `coolway-size-chart` la apariencia y estructura de Kiwi tanto como sea razonable, para que Marketing pueda seguir trabajando con una experiencia ya conocida — excluyendo únicamente lo que no tiene sentido en una app privada propia (ayuda/soporte externo, solicitud de funciones, programa de afiliados, gestión de plan de suscripción).

**Metodología:** exploración en vivo de Kiwi en `Coolway EU` (plan Ultimate — el más alto de las 14 tiendas, para ver el catálogo de pantallas más completo posible), el 01-sept-2026. No se ha usado ningún vídeo — se navegó directamente por el panel real con datos de producción.

**Estado:** ✅ Diseño y las 6 decisiones pendientes, cerradas — respondidas por el equipo (Pablo/Marketing) el 01-sept-2026. Ver resumen final al final del documento.

---

## 1. Estructura de navegación de Kiwi (menú lateral dentro de la app)

| Pantalla Kiwi | ¿Replicar? | Nota |
|---|---|---|
| Dashboard | ✅ Sí | Listado de guías — pantalla principal |
| Analytics | ❌ No (decisión 3) | Nos apoyamos en las herramientas nativas de Shopify en su lugar |
| Products | ✅ Sí | Ver sección 6 — incluye el informe "sin guía" (decisión 6) |
| Styles & Settings | ✅ Sí (parcial) | Ver sección 7 |
| Translations | ✅ Sí | Ver sección 8 — ajustado a 3 idiomas (decisión 5) |
| Feature Requests | ❌ No | Excluido explícitamente (equivalente a "request a feature") |
| Affiliate Program | ❌ No | No aplica |
| Plan | ❌ No | No aplica, app privada y gratuita |
| Account | ❌ No | No aplica |
| Visit help center / Contact support | ❌ No | Excluido explícitamente por Juanmi |

---

## 2. Dashboard — listado de guías

**Elementos de la cabecera:**
- Botón negro destacado **"Add New Size Chart"**.
- Menú **"Actions"** (acciones masivas — no explorado en detalle, pendiente).
- **"Analytics"**, **"Request a Feature"** — excluidos (ver decisiones 3 y navegación).

**Barra de filtros:**
- Buscador de texto libre ("Filter size charts") — filtra por nombre.
- Filtro **"Status"** (published/unpublished, se infiere).
- Selector de orden ("Sort by Newest update").
- Contador **"Showing N size charts"**.
- Filtro **"Recommender"** — excluido, no aplica (decisión de la 0.3, sin Recommender).

**Cada fila de la lista muestra:**
- Nombre de la guía.
- Badge de estado: **"Unpublished"** (naranja) o sin badge si está publicada.
- **Chips de condiciones de match**, en línea: `Match ANY`/`Match ALL` + chips tipo `Tag is: women`, `Collection is: <nombre o ID>`, `Product is: <miniatura + nombre>`.
- Fecha relativa: `updated 3 weeks ago`.
- Acciones en línea: **Edit / Duplicate / Delete**.

**No se replica (decisión 1 — MVP sin sincronización cross-store):**
- El badge `Import from <tienda>.myshopify.com` y el estado de solo-lectura asociado.
- Panel lateral de ayuda contextual ("Popular Help Guides") — excluido, contenido de ayuda de terceros.
- Banners promocionales del proveedor ("Kiwi has a new look", "Kiwi Product Variants") — excluidos.

---

## 3. Editor de una guía ("Edit sizing")

Equivalente directo a crear/editar una entrada `size_guide` con sus bloques y su regla.

**Cabecera:**
- Campo de texto para el **nombre de la guía** (`title`).
- Toggle **Published / Unpublished** (estado nativo Active/Draft).
- Botones: **Preview**, **Duplicate**, **More actions**, **Save**. (**History** — no tenemos equivalente todavía, no bloqueante).

**Sobre la sincronización entre tiendas (decisión 1 — confirmada por el equipo):**
> *"De momento no, lo vamos a incorporar pero como MVP no hace falta tenerlo."*

Es decir: **queda confirmado como fuera del alcance del MVP**, pero **no descartado para siempre** — el equipo ya cuenta con incorporarlo en una iteración futura. Se documenta aquí la referencia completa (banner de solo lectura, bloqueo de contenido salvo la condición de match) para cuando se retome como tarea propia, probablemente en una fase posterior a la 2, dado que implica diseñar un mecanismo de sincronización entre las 14 tiendas — no es una función suelta del panel, es un sub-proyecto en sí mismo.

**Sección "Size Chart Layout":**
- Contenido renderizado en vivo (WYSIWYG), con botón **"+ Add a Section"**.
- **Solo los 4 tipos ya existentes** (decisión 2 — confirmada): *"Esperamos, ya que actualmente solo tenemos texto, imagen y tabla."* No se añaden Cross Table, Divider, Layout, Tabs, Accordion, Intl. conversion, HTML Code, Image group ni Image+caption como bloques nuevos en esta fase.
- Botón **"Use layout template"** — plantillas predefinidas, no explorado en detalle, no bloqueante.

**Sección "Apply to Products"** (equivale a `size_guide_rule`):
- Radio ANY/ALL, chips de condición (`Tag`, `Collection`, `Product`), contador **"Matched with N products"**, botón **"+ Add new matching condition"**.
- *"Synchronize matching conditions with all linked size charts"* — no se replica (mismo motivo que la decisión 1, ligado a la sincronización cross-store).

**Sección "Size Recommender":** no se replica — decisión ya tomada en la 0.3 (cutover directo, cero uso real).

---

## 4. Catálogo de tipos de bloque de Kiwi — decisión 2 (confirmada)

**No se añade ningún tipo nuevo en esta fase.** Los 4 existentes (`size_guide_block_table`, `_text`, `_image`, `_video`) cubren el 100% del contenido real detectado en el inventario de la 0.1 (Tabla 100%, Texto 53%, Imagen 43%, Vídeo 0% pero en alcance v1). Los 8 tipos avanzados de Kiwi (Cross Table, Divider, Layout, Image+caption, Image group, Intl. conversion size chart, Tabs, Accordion, HTML Code) quedan documentados como referencia, para revisar solo si Marketing los pide explícitamente al usar el panel nuevo.

---

## 5. Analytics — decisión 3 (confirmada): no se construye panel propio

> *"Apoyarnos en Shopify."*

No se replica la pantalla de Analytics de Kiwi (gráficas de "Pop-up link click", "Page views with size chart loaded", etc.). En su lugar, Marketing usará las herramientas nativas de Shopify (Analytics/Web Pixels) para métricas de uso del bloque — coherente con que nuestro bloque es una Theme App Extension nativa, no un widget externo como el de Kiwi, que sí necesita analítica propia por vivir fuera del ecosistema de Shopify.

---

## 6. Products — decisión 6 (confirmada): sí, replicar el informe de cobertura

> *"Sí, replicarlo."*

Se incluye en el panel un informe equivalente a **"View products without size charts"** de Kiwi — qué productos no tienen ninguna guía aplicable. Técnicamente: comprobar qué productos no tienen valor en el metafield `resolved_size_guide` (ya existente desde la 2.3). Es una función de QA barata (no requiere lógica nueva, solo una consulta) y de alto valor para detectar huecos de cobertura.

Se mantiene también el buscador de productos y el enlace de detalle por producto, igual que en Kiwi.

---

## 7. Styles & Settings

Estructura de pestañas prevista: **General Settings** (Display), **Size Chart** (ajustes de unidad — ver más abajo), **Advanced** (Custom CSS, y posiblemente un futuro "Sizing Sync" si se retoma la decisión 1). Se excluye la pestaña **Recommender** (sin Recommender, decisión de la 0.3).

**Auto-selección de unidad por geolocalización — decisión 4 (confirmada): sí, se necesita.**

> *"Sí."*

A diferencia de la recomendación inicial (que quedaba abierta, sin opinión fuerte), el equipo confirma que **sí hace falta** replicar el ajuste de Kiwi *"Auto select unit based on buyer location"*. Esto añade alcance real a la Fase 2/3:
- **Impacto en el modelo de datos (Fase 1, ya cerrada):** `unit_primary`/`unit_secondary`/`has_dual_unit_selector` en `size_guide_block_table` siguen siendo válidos como base, pero la lógica de **qué unidad mostrar por defecto según la ubicación del comprador** es nueva — no está en el motor de resolución actual (2.2), que decide *qué guía* aplica, no *qué unidad* mostrar dentro de ella.
- **Dónde debería vivir esta lógica:** probablemente en la Theme App Extension (Fase 3, todavía sin empezar) más que en el panel de admin — el panel solo necesita un ajuste de configuración ("¿activar auto-detección de unidad?"), la lógica de detección real (geolocalización del visitante) se ejecuta en el storefront.
- **Queda anotado como requisito nuevo para la Fase 3**, no se implementa en la 2.10 — el panel de admin solo necesita el toggle de configuración correspondiente.

**"Sizing Sync" (Advanced):** no se replica en esta fase, coherente con la decisión 1.

---

## 8. Translations — decisión 5 (confirmada): solo 3 idiomas

> *"Solamente las 3."*

Se ajusta el alcance de idiomas del proyecto de "12+" a **English, Spanish y French** — los mismos 3 que Kiwi tiene realmente publicados en producción. **No se construye ninguna pantalla de Translations propia** — ya tenemos "Traducciones" nativas habilitadas en los 6 metaobjects desde la Fase 1 (capacidad `translatable`, gestionada vía Translate & Adapt de Shopify), que ya cubre esos 3 (y cualquier otro) idioma sin necesidad de UI propia.

**Nota importante para el resto del proyecto:** este ajuste de alcance (3 idiomas, no 12+) debería reflejarse también en cualquier otro sitio donde se hubiera asumido el número "12+" — revisar el brief original y `claude_SDD_Modelo_Trabajo_Shopify_Coolway.md` si mencionan ese número explícitamente.

---

## Resumen final de las 6 decisiones (respondidas por el equipo, 01-sept-2026)

| # | Decisión | Respuesta |
|---|---|---|
| 1 | ¿Replicar guía sincronizada entre tiendas? | No en el MVP — se incorporará más adelante |
| 2 | ¿Añadir tipos de bloque nuevos? | No — esperar, solo texto/imagen/tabla por ahora |
| 3 | ¿Panel de Analytics propio? | No — apoyarse en Shopify |
| 4 | ¿Auto-selección de unidad por geolocalización? | Sí — nuevo requisito, anotado para la Fase 3 |
| 5 | ¿Se mantiene "12+ idiomas"? | No — ajustado a 3 (English, Spanish, French) |
| 6 | ¿Replicar informe "productos sin guía"? | Sí |

## Siguiente paso

2.10 — Implementación del panel (rutas Remix + Polaris), con el alcance ya acotado por las decisiones de arriba: Dashboard, editor de guía (sin sincronización cross-store, sin tipos de bloque nuevos), Products (con el informe de cobertura), Styles & Settings (sin Analytics propio, sin pantalla de Translations propia; con el toggle de auto-unidad como configuración, aunque la lógica real de detección se implemente en la Fase 3).
