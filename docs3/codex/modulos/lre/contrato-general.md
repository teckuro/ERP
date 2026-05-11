# Libro de Remuneraciones Electronico - Contrato general

Este modulo queda documentado como contrato operativo futuro. No implementa codigo, SQL, migraciones, servicios ni exportadores en DOC-04.

## Alcance documental

- Definir reglas para generar, validar y exportar el Libro de Remuneraciones Electronico (LRE).
- Mantener trazabilidad entre conceptos internos y codigos LRE.
- Preparar validaciones previas, estados de envio, errores y rectificaciones.
- Declarar dependencia de liquidaciones reales, conceptos clasificados y proceso mensual validado.

## Plazo y formato

- El LRE debe informarse dentro de los primeros 15 dias habiles del mes siguiente al pago de remuneraciones.
- La carga masiva debe considerar archivos CSV/TXT.
- El separador operativo documentado para exportacion masiva es punto y coma (`;`).

## Metadata minima de exportacion

Toda exportacion futura debe registrar:

- `version_exportacion_lre`
- `fecha_generacion`
- `hash_archivo`
- `usuario_generador`
- `estado_envio`

## Documentos del modulo

- [`catalogo-lre.md`](./catalogo-lre.md)
- [`estructura-archivo-lre.md`](./estructura-archivo-lre.md)
- [`exportacion-lre.md`](./exportacion-lre.md)
- [`validaciones-previas-lre.md`](./validaciones-previas-lre.md)
- [`estados-envio-lre.md`](./estados-envio-lre.md)
- [`errores-y-rectificaciones-lre.md`](./errores-y-rectificaciones-lre.md)

## Fuera de alcance DOC-04

- Implementar LRE en Angular.
- Crear tablas, migraciones o SQL.
- Crear exportadores reales.
- Enviar archivos a organismos oficiales.

## Estado canonico 2026-05-10

LRE se mantiene como documentacion normativa/futura. No esta implementado como salida operativa actual.

No debe quedar como prioridad inmediata antes de:

```txt
cierre operativo
-> liquidaciones oficiales
-> UX comercial
```
