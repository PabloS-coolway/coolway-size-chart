# Delta — size-guide-admin-panel

## MODIFIED Requirements

### Requirement: Editor de guía
El panel de administración DEBE permitir editar los datos básicos de
una guía, sus bloques de contenido y su regla de asignación desde una
única pantalla, sin navegar entre páginas distintas para cada uno.

#### Scenario: Editar datos básicos sin salir de la pantalla de la guía
- **WHEN** el usuario cambia el título, la descripción, la prioridad o
  el estado y guarda
- **THEN** se guarda solo esa sección, sin afectar a los bloques ni a
  la regla, y sin recargar la página completa

#### Scenario: Editar un bloque existente sin navegar a otra pantalla
- **WHEN** el usuario pulsa "Editar" sobre un bloque de la lista
- **THEN** el formulario completo de ese bloque (según su tipo) se
  expande en el mismo sitio, sin cambiar de URL

#### Scenario: Añadir un bloque nuevo sin navegar a otra pantalla
- **WHEN** el usuario elige un tipo de bloque para añadir
- **THEN** se muestra un formulario vacío de ese tipo al final de la
  lista, en la misma pantalla

#### Scenario: Editar la regla de asignación desde la misma pantalla
- **WHEN** el usuario cambia el operador raíz o las condiciones de la
  regla de asignación y guarda
- **THEN** se guarda solo la regla, visible en todo momento en la
  columna lateral de la pantalla de la guía, sin navegar a otra URL
