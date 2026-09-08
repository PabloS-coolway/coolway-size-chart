# Prueba end-to-end en `coolway-sandbox` — cierre de la Fase 3 (3.9)

## Why
La Fase 3 ha construido el bloque pieza a pieza (estructura, lectura,
render de bloques, caso sin guía, unidad, modal, RTL, traducciones), cada
una validada por separado. Falta una comprobación final, de extremo a
extremo, que confirme que todas esas piezas funcionan juntas en el flujo
real que seguiría un cliente: entrar a un producto real con guía
asignada, ver el enlace, abrir el modal, ver el contenido — sin ningún
JavaScript de test ni parámetro forzado, tal como llegaría un visitante
real a la tienda.

## What Changes
- Ningún cambio de código: esta tarea es una verificación explícita, no
  una nueva funcionalidad (mismo patrón que la 3.5).
- Se confirma que el bloque sigue instalado y visible en el editor de
  temas de `coolway-sandbox`, y se repite la prueba visual completa en el
  storefront público sobre "Goal Green Forest", como cierre formal de la
  Fase 3 funcional.
- Fuera de alcance: cualquier mejora visual (eso es 3.10-3.14) y cualquier
  instalación en tiendas reales (eso es Fase 5).

## Capabilities
- Modified: `size-guide-rendering` (formaliza el criterio de aceptación
  "flujo completo verificado de extremo a extremo" como cierre de la fase)

## Impact
- Ningún archivo de código modificado.
- Verificación manual en `coolway-sandbox`, editor de temas + storefront
  público.
