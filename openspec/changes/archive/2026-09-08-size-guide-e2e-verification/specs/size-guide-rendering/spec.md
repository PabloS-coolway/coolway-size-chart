## ADDED Requirements

### Requirement: Verificación de extremo a extremo del flujo completo
El bloque de guía de tallas SHALL funcionar correctamente como un flujo
completo, verificado sin herramientas de desarrollador ni parámetros de
query forzados, sobre el storefront público real de `coolway-sandbox`,
en un producto con guía ya resuelta.

#### Scenario: Recorrido completo como cliente real
- **WHEN** un visitante real entra a la ficha de un producto con
  `resolved_size_guide`, sin ningún parámetro de query ni script de test
- **THEN** el bloque SHALL mostrar únicamente el enlace de la guía en la
  carga inicial, SHALL abrir un modal con el contenido real de la guía al
  hacer clic en ese enlace, y SHALL permitir cerrarlo (botón, backdrop o
  Escape) devolviendo el foco al enlace, sin errores de consola
