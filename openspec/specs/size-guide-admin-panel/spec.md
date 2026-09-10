# size-guide-admin-panel Specification

## Purpose

Panel de administración (Remix embebido en Shopify Admin) para crear y editar guías de tallas y sus bloques de contenido, con una experiencia de edición lo más cercana posible a la de Kiwi Size Chart, sin exponer JSON en bruto al usuario.

## Requirements

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


### Requirement: Editor de texto enriquecido (WYSIWYG)
El panel de administraciÃ³n DEBE permitir crear y editar el contenido de un bloque de tipo texto mediante un editor WYSIWYG con formato bÃ¡sico, en lugar de un campo de texto plano que aplana la estructura. El contrato de datos hacia el backend (metaobject `size_guide_block_text`, campo `content` de tipo `rich_text_field`) NO cambia.

#### Scenario: Aplicar negrita o cursiva
- **WHEN** el usuario selecciona texto en el editor y pulsa el botÃ³n de Negrita (o Cursiva)
- **THEN** el texto seleccionado se muestra en negrita (o cursiva) dentro del editor

#### Scenario: Crear una lista
- **WHEN** el usuario pulsa el botÃ³n de lista con viÃ±etas (o numerada)
- **THEN** el pÃ¡rrafo actual se convierte en un elemento de una lista del tipo correspondiente

#### Scenario: Insertar un enlace
- **WHEN** el usuario selecciona texto y pulsa el botÃ³n de Enlace, introduciendo una URL
- **THEN** el texto seleccionado se convierte en un enlace a esa URL dentro del editor

#### Scenario: Guardado usa el esquema rich_text_field de Shopify
- **WHEN** el usuario envÃ­a el formulario del bloque de texto
- **THEN** el contenido editado se serializa al campo oculto `content` como JSON vÃ¡lido del esquema `rich_text_field` de Shopify (nodos `paragraph`/`list`/`list-item`/`link`/`text` con marcas `bold`/`italic`), sin cambios en el backend

#### Scenario: Carga fiel de contenido existente
- **WHEN** el usuario abre un bloque de texto ya existente con formato (varios pÃ¡rrafos, listas, negrita, enlaces)
- **THEN** el editor muestra el contenido con su formato real, no como texto plano concatenado

#### Scenario: Round-trip sin pÃ©rdida de formato
- **WHEN** el usuario guarda un bloque de texto con formato y vuelve a abrirlo
- **THEN** el formato se mantiene igual que antes de guardar (pÃ¡rrafos, listas, negrita, cursiva y enlaces preservados)

