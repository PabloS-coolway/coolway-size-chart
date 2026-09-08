# size-guide-rendering Specification

## Purpose

App Block de Theme App Extension que renderiza la guía de tallas de un producto en el PDP, leyendo la resolución ya calculada por el backend (Fase 2) sin lógica de matching propia en el storefront.

## Requirements

### Requirement: Colocación del bloque en el PDP
El App Block `size_guide` SHALL declararse de forma que pueda insertarse junto al selector de variantes de la página de producto, coherente con el modo de visualización "Link modal" decidido en la tarea 3.1 (un enlace de texto, no una sección aislada del PDP). El bloque SHALL aparecer en el editor de temas de `coolway-sandbox` bajo el bloque de variantes/compra del producto, no como sección suelta.

#### Scenario: Añadir el bloque en el editor de temas
- **WHEN** un usuario abre el editor de temas de `coolway-sandbox` en una página de producto y añade el bloque "Guía de tallas" dentro del bloque de variantes
- **THEN** el bloque se añade sin error y aparece en el lugar donde se insertó, junto al selector de variantes

### Requirement: Lectura de la guía resuelta del producto
El bloque SHALL comprobar la presencia de `product.metafields.custom.resolved_size_guide` antes de intentar mostrar cualquier contenido. Cuando el metafield tiene valor, el bloque SHALL resolver el metaobject referenciado (título, descripción y la lista `blocks`) usando la resolución nativa de metaobjects de Liquid, sin ninguna llamada explícita a la Storefront GraphQL API desde el bloque. Traer y renderizar visualmente el contenido de cada tipo de bloque (tabla/texto/imagen/vídeo) queda fuera de esta capability.

#### Scenario: Producto con guía resuelta
- **WHEN** el producto tiene `product.metafields.custom.resolved_size_guide` con valor
- **THEN** el bloque SHALL poder leer `title`, `description` y `blocks` del metaobject referenciado directamente en Liquid, sin error, gracias al acceso `storefront: PUBLIC_READ` configurado en las definiciones de metaobject (1.4)

#### Scenario: Producto sin guía resuelta
- **WHEN** el producto no tiene `product.metafields.custom.resolved_size_guide` (metafield ausente)
- **THEN** el bloque SHALL NOT renderizar ningún enlace, texto o marcador de guía de tallas, y SHALL NOT producir ningún error de Liquid visible en la página

#### Scenario: Acceso Storefront no resuelto como se esperaba
- **WHEN** el metaobject referenciado no puede resolverse en Liquid pese a tener `resolved_size_guide` con valor (por ejemplo, si el acceso `storefront: PUBLIC_READ` no se aplicó como se esperaba)
- **THEN** el bloque SHALL NOT lanzar un error de Liquid visible en la página, y el hallazgo SHALL quedar documentado explícitamente para revisión, en vez de asumirse en silencio

### Requirement: Ausencia de lógica de negocio en el storefront
El bloque SHALL NOT evaluar reglas de asignación (`size_guide_rule`) ni recalcular qué guía corresponde a un producto. Toda esa lógica ya vive en el backend (Fase 2); el bloque solo lee el resultado ya escrito en el metafield del producto.

#### Scenario: Cambio de reglas no requiere cambios en el bloque
- **WHEN** cambian las condiciones de una `size_guide_rule` en el Admin
- **THEN** el bloque no necesita ningún cambio de código — sigue leyendo el mismo metafield, cuyo valor lo actualiza el backend

### Requirement: Renderizado de cada tipo de bloque de contenido
Cuando el bloque resuelve un `resolved_guide` con `blocks` no vacío, el sistema SHALL recorrer los metaobjects ya resueltos (`blocks.value`) y renderizar cada entrada según el campo distintivo que tenga (`headers`+`rows` para tabla, `content` para texto, `image` para imagen, `video_url` para vídeo), respetando el orden en que aparecen. Un bloque en estado Draft, de tipo no reconocido, o cuyos campos no resuelven SHALL omitirse en silencio (sin romper el renderizado del resto de bloques ni de la página).

#### Scenario: Guía con bloque de tabla
- **WHEN** un bloque resuelto tiene `headers` y `rows` con valor
- **THEN** el sistema SHALL renderizar una tabla HTML con esas cabeceras y filas (ya parseadas vía `.value`), en el mismo orden que los datos

#### Scenario: Tabla con selector de doble unidad
- **WHEN** un bloque de tabla tiene `has_dual_unit_selector` a `true`
- **THEN** el sistema SHALL mostrar de forma visible ambas unidades (`unit_primary` y `unit_secondary`), sin necesidad de que el bloque implemente él mismo la lógica de conversión entre unidades

#### Scenario: Guía con bloque de texto
- **WHEN** un bloque resuelto tiene `content` con valor
- **THEN** el sistema SHALL renderizar su contenido (texto enriquecido) recorriendo la estructura ya parseada de `.value`, sin necesidad de ningún filtro de parseo externo

#### Scenario: Guía con bloque de imagen
- **WHEN** un bloque resuelto tiene `image` con valor
- **THEN** el sistema SHALL renderizar una etiqueta de imagen con `image`, `alt_text` (como atributo alt) y `caption` (si tiene valor)

#### Scenario: Guía con bloque de vídeo
- **WHEN** un bloque resuelto tiene `video_url` con valor
- **THEN** el sistema SHALL renderizar un reproductor/embed con `video_url` y `caption` (si tiene valor)

#### Scenario: Bloque en estado Draft
- **WHEN** un bloque referenciado en `blocks` está en estado Draft
- **THEN** el sistema SHALL NOT mostrarlo (no aparece siquiera en `blocks.value`), sin lanzar ningún error de Liquid visible en la página

#### Scenario: Bloque con campos que no resuelven
- **WHEN** un bloque resuelto no tiene ninguno de los campos distintivos esperados, o un campo obligatorio está vacío
- **THEN** el sistema SHALL omitir ese bloque concreto sin lanzar ningún error de Liquid visible en la página, y sin afectar al renderizado del resto de bloques

### Requirement: Comportamiento sin regresión para productos sin guía
Los cambios en la lectura (3.3) y el renderizado (3.4) del contenido de la guía SHALL NOT alterar el comportamiento ya establecido en la 3.2 para un producto sin `resolved_size_guide`: ningún elemento visible ni espacio reservado en el layout del PDP.

#### Scenario: Producto sin guía tras añadir lectura y renderizado real
- **WHEN** un producto no tiene `product.metafields.custom.resolved_size_guide`
- **THEN** el bloque SHALL NOT renderizar ningún enlace, tabla, texto, imagen ni vídeo, y el contenedor que Shopify añade al App Block SHALL seguir colapsándose (sin hueco vacío en el layout), exactamente igual que en la 3.2, independientemente de cuánto contenido real gestione ahora el bloque para productos que sí tienen guía


### Requirement: Unidad por defecto según mercado en tablas de doble unidad
En tablas con `has_dual_unit_selector`, el bloque SHALL determinar cuál de
las dos unidades (métrica o imperial) se marca visualmente como la unidad
por defecto del visitante, a partir de `localization.country.iso_code`, sin
ocultar en ningún caso ninguna de las dos unidades ya renderizadas por la
tarea 3.4.

#### Scenario: Visitante en un país de sistema imperial
- **GIVEN** una tabla con `has_dual_unit_selector` activo
- **AND** `localization.country.iso_code` corresponde a un país de sistema
  imperial (EE.UU., Liberia, Myanmar)
- **WHEN** se renderiza el bloque
- **THEN** la columna/unidad en pulgadas se marca como la unidad por
  defecto
- **AND** la columna/unidad en cm se sigue mostrando igualmente

#### Scenario: Visitante en un país de sistema métrico
- **GIVEN** una tabla con `has_dual_unit_selector` activo
- **AND** `localization.country.iso_code` corresponde a un país de sistema
  métrico
- **WHEN** se renderiza el bloque
- **THEN** la columna/unidad en cm se marca como la unidad por defecto
- **AND** la columna/unidad en pulgadas se sigue mostrando igualmente

#### Scenario: Tabla sin selector de doble unidad
- **GIVEN** una tabla sin `has_dual_unit_selector`
- **WHEN** se renderiza el bloque
- **THEN** no se aplica ninguna lógica de unidad por defecto (el
  comportamiento es idéntico al de la 3.4)

#### Scenario: `localization.country` no disponible
- **GIVEN** una tabla con `has_dual_unit_selector` activo
- **AND** `localization.country` no resuelve un `iso_code` válido
- **WHEN** se renderiza el bloque
- **THEN** se aplica cm como unidad por defecto (fallback seguro, sin
  romper el renderizado)
