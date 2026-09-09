## ADDED Requirements

### Requirement: Editor de tabla tipo hoja de cálculo
El panel de administración DEBE permitir crear y editar el contenido de un bloque de tipo tabla (`headers`/`rows`) mediante una cuadrícula editable, en lugar de campos de texto JSON en bruto. El contrato de datos hacia el backend (metaobject `size_guide_block_table`, campos `headers` y `rows` como JSON) NO cambia.

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

### Requirement: Menú contextual de la cuadrícula
El editor DEBE ofrecer un menú contextual (clic derecho) sobre las celdas de la cuadrícula con acciones básicas de edición de estructura, inspirado en el editor de Kiwi.

#### Scenario: Abrir menú contextual
- **WHEN** el usuario hace clic derecho sobre una celda
- **THEN** se muestra un menú con las opciones: Eliminar fila, Eliminar columna, Insertar fila arriba, Insertar fila abajo, Insertar columna a la izquierda, Insertar columna a la derecha, Vaciar valores, Copiar tabla, Pegar tabla

#### Scenario: Eliminar fila vía menú contextual
- **WHEN** el usuario selecciona "Eliminar fila" sobre una celda de la fila N
- **THEN** la fila N se elimina de la cuadrícula y el resto de filas se reindexan

#### Scenario: Insertar columna vía menú contextual
- **WHEN** el usuario selecciona "Insertar columna a la izquierda" (o "a la derecha") sobre una celda de la columna N
- **THEN** se inserta una nueva columna vacía en la posición correspondiente en todas las filas, incluida la cabecera

#### Scenario: Vaciar valores
- **WHEN** el usuario selecciona "Vaciar valores" sobre una celda
- **THEN** el contenido de esa celda se borra, manteniendo la estructura de la tabla

### Requirement: Navegación por teclado
La cuadrícula DEBE soportar navegación básica por teclado entre celdas.

#### Scenario: Tab avanza a la siguiente celda
- **WHEN** el usuario pulsa Tab estando en una celda
- **THEN** el foco pasa a la siguiente celda de la misma fila, o a la primera celda de la fila siguiente si estaba en la última columna

#### Scenario: Shift+Tab retrocede
- **WHEN** el usuario pulsa Shift+Tab estando en una celda
- **THEN** el foco pasa a la celda anterior

#### Scenario: Enter confirma y baja
- **WHEN** el usuario pulsa Enter estando en una celda
- **THEN** el foco pasa a la misma columna de la fila siguiente

### Requirement: Importar tabla desde texto pegado
El editor DEBE permitir importar el contenido de una tabla pegando texto delimitado por tabulaciones o comas (TSV/CSV), como alternativa a la edición celda a celda.

#### Scenario: Importar tabla vía pegado de texto
- **WHEN** el usuario abre "Importar tabla", pega texto en formato TSV o CSV y confirma
- **THEN** la cuadrícula se reemplaza por el contenido parseado, usando la primera línea como cabecera y el resto como filas de datos

#### Scenario: Importación con formato inválido
- **WHEN** el texto pegado no puede interpretarse como una tabla (por ejemplo, filas con número de columnas inconsistente)
- **THEN** se muestra un aviso de error y no se modifica la cuadrícula existente
