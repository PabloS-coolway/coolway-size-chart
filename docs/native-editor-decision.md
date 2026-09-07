# Tarea 2.11 — Qué hacer con el editor nativo de metaobjects

**Estado:** ✅ Completada — decisión tomada.
**Fecha:** 01-sept-2026

## La pregunta

Ahora que el panel propio (2.10) cubre la edición completa de guías, bloques y reglas, ¿qué hacemos con el editor nativo de Shopify (Contenido → Metaobjetos), que sigue existiendo y sigue siendo editable en paralelo?

## Matiz técnico importante

**No es posible restringir el acceso al editor nativo desde nuestra app.** Shopify no expone ninguna API para que una app oculte o bloquee secciones del Admin a usuarios concretos — eso solo se controla desde los **permisos de staff nativos de Shopify** (Configuración → Usuarios → permisos por sección), una decisión de cuenta de VANYOR SAU, no algo programable desde `coolway-size-chart`.

Así que la decisión real no era "¿restringimos técnicamente o no?" (no podemos), sino **si merece la pena pedir también una restricción de permisos a nivel de cuenta**, o dejarlo solo como una norma de uso.

## Decisión

**Solo documentarlo como norma de uso para Marketing — no se pide restricción de permisos de Shopify.**

**Motivos:**
1. El panel propio ya cubre el 100% de la edición diaria (título, descripción, prioridad, estado, gestión de bloques de los 4 tipos incluida subida de imágenes, regla de asignación) — Marketing no debería necesitar entrar al editor nativo en el uso normal.
2. Pedir una restricción de permisos añade fricción de gestión de cuentas de VANYOR SAU sin necesidad real.
3. El editor nativo sigue siendo útil como red de seguridad — por ejemplo, si el panel propio tuviera un fallo puntual, o para consultas rápidas de solo lectura sin necesidad de entrar en la app.

## Qué comunicar a Marketing

> A partir de ahora, edita las guías de tallas desde el panel propio de la app (Apps → coolway-size-chart), no desde Contenido → Metaobjetos. El panel ya cubre todo lo necesario para el día a día. El editor nativo de Shopify sigue estando ahí y sigue funcionando — no se ha bloqueado — pero usarlo en paralelo puede generar confusión (dos sitios donde editar lo mismo), así que se recomienda usar solo el panel a partir de ahora.

## Riesgo aceptado, documentado

Si alguien edita desde el editor nativo en vez del panel, **no hay ningún control técnico que lo impida ni que avise de ello** — es un riesgo aceptado conscientemente, mitigado solo por la comunicación al equipo, no por una barrera técnica. Si en el futuro se detectan ediciones accidentales desde ahí con frecuencia, se puede reconsiderar pedir la restricción de permisos de Shopify como medida adicional.
