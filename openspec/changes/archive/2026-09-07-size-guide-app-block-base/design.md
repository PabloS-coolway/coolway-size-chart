## Context

Ver `proposal.md` - Why. Dato ya confirmado en la tarea 0.6 (Fase 0): las 14 tiendas están en tema 3.0.0 y `sections/main-product.liquid` tiene `"blocks": [{"type": "@app"}]` en las 14, verificado en código — es la garantía técnica de que un App Block cabrá ahí llegado el rollout (Fase 5). Esta change solo trabaja contra `coolway-sandbox` (tema `Horizon` por defecto, según el setup inicial documentado en `Contexto_Proyecto_Kiwi_PROPIO.md`).

## Goals / Non-Goals

**Goals:**
- Decidir y validar empíricamente cómo se coloca el App Block dentro de la sección de producto para que quede junto al selector de variantes, sin depender de una sección propia.
- Dejar el bloque leyendo la señal correcta (`resolved_size_guide`) sin todavía traer ni renderizar el contenido de la guía.

**Non-Goals:**
- No se decide el mecanismo de auto-selección de unidad (3.6) ni RTL (3.7) — esos afectan al renderizado de contenido, no a la estructura base.
- No se implementa el modal ni su JS (eso empieza en una subtarea posterior, cuando ya haya contenido que mostrar dentro).

## Decisions

### Target del bloque: mantener `"target": "section"`, no crear un app embed block
El ejemplo generado por el scaffold (`star_rating.liquid`) ya usa `"target": "section"`, y es el target correcto para este caso: un App Block con `target: "section"` es el tipo que Shopify permite insertar dentro de la lista de bloques de una sección que declare `{"type": "@app"}` en su propio schema — exactamente lo que ya tiene `main-product.liquid` en las 14 tiendas (confirmado en la 0.6). La alternativa considerada, un *app embed block* (`target: "body"`, activado globalmente desde "App embeds" del editor de temas), se descarta: ese tipo se inyecta una vez por página en una posición fija definida por el tema, no permite que el merchant lo reordene junto al selector de variantes dentro de la sección de producto, que es justo el control que necesitamos para la decisión "Link modal" de la 3.1 (el enlace debe quedar pegado al selector, no suelto en cualquier punto de la página).

La posición exacta dentro de la sección (antes/después del selector de variantes) la decide quien edita el tema, añadiendo el bloque en el punto que quiera dentro de la lista de bloques — esta change no fija una posición fija por código, y eso es intencional: cada tema real de las 14 tiendas coloca su selector de variantes de forma distinta (ver fragmentación de repos, tarea 0.6), así que fijar la posición aquí iría contra el propio principio de "selector de inyección configurable" ya recogido en el ticket original.

### Lectura del metafield: solo existencia, no el contenido referenciado
`product.metafields.custom.resolved_size_guide` es de tipo `metaobject_reference`. En Liquid, comprobar `{% if product.metafields.custom.resolved_size_guide %}` no dispara ninguna llamada adicional ni resuelve el metaobject referenciado — es una comprobación barata de presencia/ausencia, coherente con dejar la lectura real del contenido (título, `blocks`, y de ahí a sus propios campos) para la 3.3, que es quien decide cómo se trae esa información (Liquid vs. Storefront API, con el punto crítico de `access.storefront: PUBLIC_READ` pendiente de probar por primera vez).

### Limpieza del ejemplo `star_rating`
Se elimina `snippets/stars.liquid` y `assets/thumbs-up.png` en vez de dejarlos sin referenciar: no tienen ningún uso futuro previsible en este bloque (el patrón de "estrellas" no aparece en ningún requisito de guía de tallas) y dejarlos como código muerto invita a confusión sobre si son parte del bloque real.

## Risks / Trade-offs

- [Riesgo] El tema por defecto de `coolway-sandbox` (`Horizon`) puede renderizar su sección de producto de forma distinta a los temas reales de Coolway (`shopify-theme-coolway` y los 2 repos independientes de la 0.6) → Mitigación: esta change valida solo que el bloque se coloca y lee el metafield correctamente en un entorno con soporte `@app` confirmado; la validación contra el tema real de Coolway (recuperado como borrador persistente) es una decisión ya abierta desde el setup inicial, no bloqueante para esta change.
- [Riesgo] Sin contenido visible todavía, es fácil confundir "el bloque no aparece" con "el bloque no tiene guía" durante las pruebas manuales en el editor de temas → Mitigación: el placeholder visual de esta change debe ser inconfundible cuando SÍ hay guía (ej. texto "Guía de tallas" en vez de vacío), para distinguir "no implementado" de "sin guía asignada" (caso real de la 3.5).
