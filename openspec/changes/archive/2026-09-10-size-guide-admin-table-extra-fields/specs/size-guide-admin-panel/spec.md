## MODIFIED Requirements

### Requirement: Editor de tabla tipo hoja de cálculo
El panel de administración DEBE permitir crear y editar el contenido de un bloque de tipo tabla (`headers`/`rows`) mediante una cuadrícula editable, en lugar de campos de texto JSON en bruto, y DEBE permitir configurar un texto de pie de tabla opcional y ocultar visualmente la tabla sin borrar sus datos. El contrato de datos hacia el backend (metaobject `size_guide_block_table`, campos `headers` y `rows` como JSON, y ahora también `footer_text` y `hide_table`) NO cambia para los campos ya existentes.

#### Scenario: Edición directa de celdas
- **WHEN** el usuario hace clic en una celda de la cuadrícula (cabecera o dato) y escribe
- **THEN** el valor de esa celda se actualiza en el estado local del editor sin recargar la página

#### Scenario: Añadir fila
- **WHEN** el usuario pulsa el botón "+ Fila"
- **THEN** se añade una nueva fila vacía al final de la tabla, con tantas columnas como las existentes

#### Scenario: Añadir columna
- **WHEN** el usuario pulsa el botón "+ Columna"
- **THEN** se añade una nueva columna vacía al final de cada fila, incluida la cabecera

#### Scenario: Guardado usa el mismo contrato JSON
- **WHEN** el usuario envía el formulario del bloque de tabla
- **THEN** los datos de la cuadrícula se serializan a los mismos campos ocultos `headers` (JSON array de strings) y `rows` (JSON array de arrays de strings) que consume la `action` existente, sin cambios en el backend

#### Scenario: Configurar texto de pie de tabla
- **WHEN** el usuario escribe un texto en el campo "Footer text" del bloque de tabla y guarda
- **THEN** el texto se guarda en el campo `footer_text` del metaobject y se muestra bajo la tabla en el storefront

#### Scenario: Ocultar la tabla sin perder los datos
- **WHEN** el usuario activa el interruptor "Hide table" y guarda
- **THEN** el campo `hide_table` se guarda como `true`, la tabla deja de mostrarse en el storefront, y `headers`/`rows`/`footer_text` se conservan intactos en el metaobject para cuando se reactive
