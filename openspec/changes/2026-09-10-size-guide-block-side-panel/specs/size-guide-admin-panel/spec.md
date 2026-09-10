## MODIFIED Requirements

### Requirement: Editor de guía
El panel de administración DEBE permitir editar los datos básicos de
una guía, sus bloques de contenido y su regla de asignación desde una
única pantalla, sin navegar entre páginas distintas para cada uno. Los
bloques de contenido se muestran como una lista de resumen compacto
(tipo + resumen + acciones subir/bajar/quitar); el formulario completo
de un bloque se edita en un panel lateral que se abre desde la
derecha, no inline en la lista.

#### Scenario: Editar datos básicos sin salir de la pantalla de la guía
- **WHEN** el usuario cambia el título, la descripción, la prioridad o
  el estado y guarda
- **THEN** se guarda solo esa sección, sin afectar a los bloques ni a
  la regla, y sin recargar la página completa

#### Scenario: Editar un bloque existente sin navegar a otra pantalla
- **WHEN** el usuario pulsa "Editar" sobre un bloque de la lista
- **THEN** se abre un panel lateral desde la derecha con el formulario
  completo de ese bloque, sin cambiar de URL ni afectar a los demás
  bloques

#### Scenario: Guardar un bloque desde el panel lateral
- **WHEN** el usuario modifica los campos del formulario en el panel y
  pulsa "Guardar bloque"
- **THEN** se guarda solo ese bloque y el panel se cierra
  automáticamente

#### Scenario: Cerrar el panel lateral sin guardar
- **WHEN** el usuario pulsa "Cerrar", hace clic fuera del panel, o
  pulsa Escape
- **THEN** el panel se cierra sin enviar ningún formulario

#### Scenario: Añadir un bloque nuevo sin navegar a otra pantalla
- **WHEN** el usuario elige un tipo de bloque para añadir
- **THEN** se muestra un formulario vacío de ese tipo al final de la
  lista, en la misma pantalla

#### Scenario: Editar la regla de asignación desde la misma pantalla
- **WHEN** el usuario cambia el operador raíz o las condiciones de la
  regla de asignación y guarda
- **THEN** se guarda solo la regla, visible en todo momento en la
  columna lateral de la pantalla de la guía, sin navegar a otra URL
