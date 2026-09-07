## MODIFIED Requirements

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
