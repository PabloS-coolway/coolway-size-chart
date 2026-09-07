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
