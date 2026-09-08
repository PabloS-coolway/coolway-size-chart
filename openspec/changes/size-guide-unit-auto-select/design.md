# Design — Auto-selección de unidad por geolocalización (3.6)

## Contexto

La 2.9 identificó que la guía debe adaptar la unidad "por defecto" (cm vs.
pulgadas) según la ubicación del visitante, para tablas con
`has_dual_unit_selector`. La 3.4 ya renderiza ambas unidades en columnas
separadas cuando ese flag está activo; lo que falta es decidir cuál de las
dos se marca como "la del visitante".

## Alternativas consideradas

1. **Geolocalización de navegador (`navigator.geolocation`)**
   - Requiere permiso explícito del visitante (prompt del navegador) —
     fricción alta, y probablemente denegada por defecto en la mayoría de
     visitantes de un PDP de e-commerce.
   - Requiere JavaScript en cliente; el bloque es hoy 100% server-side
     (Liquid puro), lo que simplifica cache y evita hidratación.
   - Descartada: fricción/UX inaceptable para un dato "de cortesía" (no es
     crítico si falla).

2. **Cabecera `Accept-Language` / idioma del navegador**
   - Idioma no equivale a país (un visitante en EEUU con navegador en
     español seguiría viendo cm si se infiriera desde idioma).
   - Descartada: la correlación idioma→sistema de unidades es demasiado
     débil para ser fiable.

3. **Mercado de Shopify activo (`localization.country`)**
   - Ya disponible en Liquid sin JS, sin permisos, sin latencia añadida
     (es una variable global del contexto de render).
   - Coherente con cómo Coolway ya segmenta sus 14 tiendas (Markets).
   - Riesgo conocido y aceptado: en tiendas sin Markets configurado como
     multi-país real, o cuando el visitante no ha sido geolocalizado por
     Shopify (proxies, CDN edge cases), `localization.country` puede
     reflejar el mercado *activo/seleccionado* en vez de la ubicación real
     del visitante. Se documenta como comportamiento esperado, no como bug.
   - **Elegida.**

## Decisión

Usar `localization.country.iso_code` para determinar el sistema de unidades
por defecto: un conjunto cerrado de países que usan sistema imperial
(EE.UU., Liberia, Myanmar — la lista real de excepciones al SI) implica
"pulgadas primero"; cualquier otro país implica "cm primero". Se marca
visualmente la unidad primaria (por ejemplo con una clase CSS / orden de
columnas) pero **ambas se siguen mostrando siempre** — no se oculta ninguna.

No se introduce ningún selector interactivo cliente-servidor: es un ajuste
de presentación por defecto, no una preferencia persistida ni un control
que el visitante pueda cambiar. Si en el futuro se pide esa interactividad,
será una tarea aparte (fuera de alcance de la 3.6).

## Impacto en el código

- `size_guide.liquid`: dentro del bloque de tabla con
  `has_dual_unit_selector`, calcular `imperial_first` a partir de
  `localization.country.iso_code` y usarlo para decidir el orden/marcado
  visual de columnas de unidad. No afecta a tablas sin ese flag.
- Sin nuevas dependencias, sin nuevo JS, sin nuevas llamadas a API.

## Riesgos / limitaciones documentadas

- `localization.country` depende de que la tienda tenga Markets
  configurado; su fiabilidad como "geolocalización real" variará según la
  configuración real de cada una de las 14 tiendas — se valida el
  comportamiento real observado en `coolway-sandbox` y se deja constancia
  en `docs/unit-auto-select.md`.
