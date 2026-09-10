# 2.15 — Editor de guía unificado en una sola pantalla (estilo Kiwi)

## Why
Durante el repaso visual acordado antes de la Fase 5 (10-sept-2026),
Juanmi comparó la edición de una guía en Kiwi (una sola pantalla: datos
básicos + bloques inline con "+Add a Section" + reglas de asignación a
la derecha, todo visible sin navegar) con el panel propio actual, que
reparte lo mismo en 4 pantallas distintas (guía → lista de bloques →
editor de bloque individual → editor de regla), cada una con su propia
navegación de ida y vuelta. Pidió acercar la experiencia a la de Kiwi.

## What Changes
- Nueva pantalla única en `/app/size-guides/:id` que sustituye a la
  actual, combinando:
  - Datos básicos de la guía (título, descripción, prioridad, estado)
    — igual que hoy.
  - Lista de bloques de contenido, con cada bloque como una sección
    expandible/colapsable en línea (no una fila con enlace a otra
    pantalla): al expandir un bloque se muestra su formulario de
    edición completo (tabla/texto/imagen/vídeo) en el sitio, sin
    navegar. Añadir un bloque nuevo también abre su formulario inline.
  - Editor de regla de asignación, en la columna lateral (misma
    posición que "Apply to Products" en Kiwi), siempre visible.
- Las páginas actuales `blocks.tsx`, `blocks_.$type.$blockId.tsx` y
  `rule.tsx` dejan de ser rutas de navegación independientes; su lógica
  de loader/action se conserva pero se invoca desde la misma pantalla
  (fetchers independientes por sección, para no recargar todo al
  guardar solo una parte).
- Sin cambios en el modelo de datos (metaobjects `size_guide`,
  `size_guide_block_*`, `size_guide_rule`) ni en el storefront — es
  exclusivamente una reorganización de la UI del panel de
  administración.

## Capabilities
- Modified: `size-guide-admin-panel` (sustituye el requisito de
  navegación multi-pantalla del editor de guía por un requisito de
  pantalla única)

## Impact
- `app/routes/app.size-guides.$id.tsx` (reescritura: pasa a cargar y
  combinar guía + bloques + regla, y a despachar las 3 acciones)
- `app/routes/app.size-guides.$id_.blocks.tsx` (retirada como ruta de
  navegación; su loader/action se reutilizan o se inline-an en la
  ruta anterior)
- `app/routes/app.size-guides.$id_.blocks_.$type.$blockId.tsx` (deja de
  navegarse directamente; sus formularios por tipo de bloque se
  reutilizan como componentes montados inline)
- `app/routes/app.size-guides.$id_.rule.tsx` (retirada como ruta de
  navegación independiente; su formulario se reutiliza inline)
- Nuevo(s) componente(s) en `app/components/` para el bloque expandible
  y el contenedor de la pantalla unificada
- Validado exclusivamente en `coolway-sandbox`, nunca en tienda real
