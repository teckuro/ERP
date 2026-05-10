# Exportacion LRE

Este documento describe el contrato futuro de exportacion del Libro de Remuneraciones Electronico. En DOC-04 es solo documental.

## Proceso general

1. Consolidar liquidaciones reales del periodo.
2. Validar que todos los conceptos usados tengan clasificacion y codigo LRE cuando corresponda.
3. Ejecutar validaciones previas del modulo LRE.
4. Generar archivo CSV/TXT con separador punto y coma (`;`).
5. Registrar metadata de exportacion y hash del archivo.
6. Marcar el envio con estado operativo.
7. Permitir rectificacion documental cuando exista rechazo u observacion.

## Metadata obligatoria futura

| Campo | Descripcion |
|---|---|
| `version_exportacion_lre` | Version del layout/regla usada para generar el archivo. |
| `fecha_generacion` | Fecha y hora de generacion. |
| `hash_archivo` | Hash del archivo generado para auditoria. |
| `usuario_generador` | Usuario que genero la exportacion. |
| `estado_envio` | Estado operativo del envio. |

## Restriccion

No implementar exportacion real hasta contar con motor, liquidaciones snapshot, conceptos clasificados y validaciones previas cerradas.