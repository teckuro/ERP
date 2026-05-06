# Documentacion base ERP – indice general

Este documento es el punto de entrada para la base documental del proyecto ERP de remuneraciones.
Define la estructura de la documentacion, el orden de lectura recomendado y la relacion entre los documentos. 
Se ha reorganizado y consolidado la informacion a partir de las fuentes originales para proporcionar una guia clara y mantenible.

## Objetivo

Crear una base documental coherente y trazable que permita a desarrolladores, QA y agentes comprender el contexto del producto, los contratos de cada modulo y las reglas de UI. Se busca separar el negocio de la presentacion, establecer dependencias explicitas y dar visibilidad al estado de cada fase del proyecto.

## Orden de lectura

1. **Orquestador** – contexto global del proyecto, diseño operativo y estados de las fases: consulte `orquestador/README.md`, `estado-fases.md`, `roadmap-operativo.md`, `criterios-cierre-fases.md` y `matriz-roles-permisos.md`.
2. **Mapa de documentacion** – inventario de todos los documentos creados y su proposito: `orquestador/mapa-documentacion.md`.
3. **Contrato general** – reglas globales y criterios transversales: `contrato-general.md`.
4. **Guias de agente y UI** – `AGENTS.md`, `temas/ui-form-guidelines.md` y `temas/estilos-readme.md`.
5. **Glosario e inconsistencias** – consulte `glosario.md` para entender la terminología común y `inconsistencias.md` para conocer vacíos o contradicciones.
6. **Normativa chilena** – revise `normativa-remuneraciones.md` para obtener un resumen legal de las remuneraciones en Chile (definiciones, exclusiones, sueldo mínimo, gratificación legal, reducción de jornada y reglas del LRE).
7. **Plan de pruebas y changelog** – consulte `plan-pruebas.md` para la cobertura de pruebas y `CHANGELOG.md` para seguir la evolución de la documentación.
8. **Modulos** – consulte la carpeta `modulos/` para el módulo correspondiente (`empleados`, `parametros`, etc.) y lea el `README.md` y los contratos/flujo dentro de la carpeta.
9. **Temas** – reglas transversales o históricas, guías y temas específicos que no pertenecen a un módulo en particular.

## Estructura de carpetas

| Carpeta | Contenido |
|---------|-----------|
| `codex/` | Documentos globales, contrato general, peticiones de estilos y este indice. |
| `codex/orquestador/` | Contexto de proyecto, fases, mapa de documentacion y reglas de cierre. |
| `codex/modulos/` | Contratos y guias por modulo (`empleados`, `parametros`, `conceptos-remuneracion`, `haberes-descuentos`, `nomina-mensual`). |
| `codex/temas/` | Guias de UI, estandares de estilos, recomendaciones transversales y temas historicos. |
| `codex/glosario.md` | Definiciones oficiales y nomenclatura comun. |
| `codex/inconsistencias.md` | Registro de contradicciones, vacíos y decisiones pendientes. |
| `codex/normativa-remuneraciones.md` | Resumen legal de remuneraciones: definición de remuneración, ingreso mínimo mensual, gratificación legal, jornada de 40 horas y LRE. |
| `codex/plan-pruebas.md` | Plan de pruebas consolidado por módulo. |
| `codex/CHANGELOG.md` | Registro de cambios de la documentación. |

Recuerde seguir siempre las jerarquias de reglas establecidas: primero `AGENTS.md`, luego este indice, despues las guias de UI y finalmente los contratos especificos de cada modulo. 
Cuando exista conflicto entre documentos, prevalece el de mayor jerarquia.
