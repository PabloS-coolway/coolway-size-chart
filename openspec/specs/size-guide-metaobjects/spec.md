# size-guide-metaobjects Specification

## Purpose

Modelo de datos nativo de Shopify (Metaobjects) para la guía de tallas de Coolway,
y el script idempotente que despliega sus definiciones contra cualquier tienda del
grupo. Sustituye al plugin de terceros Kiwi Size Chart en la capa de datos.

## Requirements

### Requirement: Definición del metaobject `size_guide`
El sistema SHALL definir un metaobject de tipo `size_guide` con los campos `title`
(texto de una línea, máx. 70 caracteres, obligatorio por convención), `description`
(texto enriquecido, opcional), `priority` (entero, default 0), `legacy_kiwi_id`
(texto de una línea, opcional) y `blocks` (lista de referencia mixta a los 4 tipos
de bloque de contenido). El estado activo/borrador SHALL usar el mecanismo nativo
de Shopify, sin un campo `status` propio. `size_guide` SHALL NOT tener ningún campo
que referencie `size_guide_rule` — la relación entre guía y regla vive en la
dirección opuesta (ver Requirement de reglas de asignación).

#### Scenario: Crear una guía de tallas válida
- **WHEN** se crea una entrada de `size_guide` con `title` y sin más campos
- **THEN** la entrada se guarda correctamente, con `priority` en 0 por defecto

#### Scenario: Orden de render de los bloques
- **WHEN** una guía tiene varias entradas enlazadas en `blocks`
- **THEN** el orden en que aparecen en esa lista es el orden en que deben renderizarse

### Requirement: Metaobjects de bloques de contenido
El sistema SHALL definir un metaobject independiente por tipo de bloque de
contenido — `size_guide_block_table`, `size_guide_block_text`,
`size_guide_block_image`, `size_guide_block_video` — en vez de un único metaobject
con campos opcionales combinados. `size_guide_block_table` SHALL incluir `label`,
`headers` (JSON), `rows` (JSON), `unit_primary`, `unit_secondary` (opcional) y
`has_dual_unit_selector` (booleano). `size_guide_block_text` SHALL incluir
`content` (texto enriquecido, traducible). `size_guide_block_image` SHALL incluir
`image`, `alt_text` y `caption`. `size_guide_block_video` SHALL incluir `video_url`
y `caption`.

#### Scenario: Tabla con selector de doble unidad
- **WHEN** una tabla de tallas tiene selector de doble unidad (ej. INCHES|CM)
- **THEN** `has_dual_unit_selector` SHALL ser `true` y `unit_secondary` SHALL tener
  la unidad secundaria, para permitir señalar el bloque para revisión manual (mismo
  patrón de riesgo que causó la incidencia "Hoodie Roomy SYA" documentada en la 0.1)

#### Scenario: Tabla con sistemas de talla y orden de columnas variable
- **WHEN** distintas tiendas usan sistemas de talla distintos u orden de columnas
  distinto en la misma tabla (ej. CM/US/UK/EU vs CM/EU/US/UK)
- **THEN** `headers` y `rows` en JSON SHALL representar cualquier combinación de
  columnas y valores sin cambios de esquema

### Requirement: Reglas de asignación de guía (`size_guide_rule`)
El sistema SHALL definir un metaobject `size_guide_rule` con una referencia simple
a la guía que activa (`size_guide`), un `root_operator` (`ANY` o `ALL`), un campo
`conditions` (JSON, array de `{field, operator, value}`) y `legacy_kiwi_id`. La
referencia SHALL ir de la regla hacia la guía, nunca al revés, de forma que una
misma guía pueda tener varias reglas independientes que se combinan como OR entre
sí. `size_guide_rule` SHALL NOT tener un campo de prioridad propio — el desempate
entre guías vive en `size_guide.priority`.

#### Scenario: Varias reglas para la misma guía
- **WHEN** dos entradas de `size_guide_rule` distintas apuntan a la misma guía
- **THEN** la guía se activa si se cumple cualquiera de las dos reglas (OR entre
  reglas), y cada regla evalúa sus propias `conditions` con su propio
  `root_operator` (ANY/ALL) de forma independiente

### Requirement: Convención de trazabilidad `legacy_kiwi_id`
El valor de `legacy_kiwi_id` SHALL ser idéntico, carácter por carácter, al nombre
de la guía tal como aparece en el panel de Kiwi de esa tienda y como quedó
recogido en el inventario de la tarea 0.1 (sin normalizar mayúsculas, sin
traducir, sin recortar espacios). Las guías duplicadas dentro de la misma tienda
que no se hayan fusionado todavía SHALL usar un sufijo secuencial entre paréntesis
según el orden de aparición en Kiwi.

#### Scenario: Guía duplicada sin fusionar
- **WHEN** existen dos guías idénticas en Kiwi para la misma tienda (ej. "2003 men"
  en Coolway US) y todavía no se han fusionado
- **THEN** sus `legacy_kiwi_id` SHALL ser `2003 men (1)` y `2003 men (2)`, en el
  orden en que aparecen en el panel de Kiwi

### Requirement: Despliegue idempotente multi-tienda
El sistema SHALL desplegar las 6 definiciones (`size_guide`, los 4
`size_guide_block_*`, `size_guide_rule`) contra cualquier tienda mediante un script
propio contra la Admin GraphQL API — nunca mediante la configuración nativa de
metaobjects en `shopify.app.toml`, ni a mano desde el Admin. El script SHALL
respetar el orden de dependencias (los 4 bloques primero, luego `size_guide`, luego
`size_guide_rule`), SHALL crear una definición si no existe, SHALL añadir solo los
campos que falten si la definición ya existe, y SHALL NOT borrar ni cambiar el tipo
de un campo ya existente bajo ninguna circunstancia — si detecta una discrepancia de
tipo, SHALL avisar para revisión manual en vez de modificar o fallar.

#### Scenario: Ejecutar el despliegue dos veces seguidas
- **WHEN** el script se ejecuta contra una tienda donde las 6 definiciones ya
  existen con todos sus campos
- **THEN** el script SHALL NOT realizar ninguna llamada de escritura, y SHALL
  informar que no hay nada que hacer, sin duplicados ni errores

#### Scenario: Despliegue desde cero en una tienda nueva
- **WHEN** el script se ejecuta contra una tienda donde ninguna de las 6
  definiciones existe todavía
- **THEN** el script SHALL crearlas las 6 en el orden de dependencias correcto,
  con las capacidades de estados, traducciones y acceso a Storefront API activadas

#### Scenario: Modo `--dry-run`
- **WHEN** el script se ejecuta con `--dry-run`
- **THEN** el script SHALL mostrar qué crearía o añadiría sin realizar ninguna
  escritura real contra la Admin API
