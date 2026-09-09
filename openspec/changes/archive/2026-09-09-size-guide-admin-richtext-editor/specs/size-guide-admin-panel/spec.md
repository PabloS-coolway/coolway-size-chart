## ADDED Requirements

### Requirement: Editor de texto enriquecido (WYSIWYG)
El panel de administración DEBE permitir crear y editar el contenido de un bloque de tipo texto mediante un editor WYSIWYG con formato básico, en lugar de un campo de texto plano que aplana la estructura. El contrato de datos hacia el backend (metaobject `size_guide_block_text`, campo `content` de tipo `rich_text_field`) NO cambia.

#### Scenario: Aplicar negrita o cursiva
- **WHEN** el usuario selecciona texto en el editor y pulsa el botón de Negrita (o Cursiva)
- **THEN** el texto seleccionado se muestra en negrita (o cursiva) dentro del editor

#### Scenario: Crear una lista
- **WHEN** el usuario pulsa el botón de lista con viñetas (o numerada)
- **THEN** el párrafo actual se convierte en un elemento de una lista del tipo correspondiente

#### Scenario: Insertar un enlace
- **WHEN** el usuario selecciona texto y pulsa el botón de Enlace, introduciendo una URL
- **THEN** el texto seleccionado se convierte en un enlace a esa URL dentro del editor

#### Scenario: Guardado usa el esquema rich_text_field de Shopify
- **WHEN** el usuario envía el formulario del bloque de texto
- **THEN** el contenido editado se serializa al campo oculto `content` como JSON válido del esquema `rich_text_field` de Shopify (nodos `paragraph`/`list`/`list-item`/`link`/`text` con marcas `bold`/`italic`), sin cambios en el backend

#### Scenario: Carga fiel de contenido existente
- **WHEN** el usuario abre un bloque de texto ya existente con formato (varios párrafos, listas, negrita, enlaces)
- **THEN** el editor muestra el contenido con su formato real, no como texto plano concatenado

#### Scenario: Round-trip sin pérdida de formato
- **WHEN** el usuario guarda un bloque de texto con formato y vuelve a abrirlo
- **THEN** el formato se mantiene igual que antes de guardar (párrafos, listas, negrita, cursiva y enlaces preservados)
