# Contrato general del sistema ERP de remuneraciones

## Objetivo

Establecer las reglas de negocio y criterios transversales que aplican a todos los modulos del ERP de remuneraciones. Este contrato define un marco comun para el desarrollo de UI, la persistencia de datos y la interaccion entre modulos, asegurando consistencia y trazabilidad.

## Alcance

- Define la jerarquia de documentos y reglas.
- Especifica principios de separacion entre funcionalidad y presentacion.
- Introduce criterios de datos comunes (periodos, vigencias y catalogos).
- Resuelve conflictos entre modulos y establece reglas globales para estados y flujos.
- No describe detalles especificos de cada modulo; esos se tratan en su propio `contrato-general.md`.

## Fuera de alcance

- Implementacion tecnica de cada modulo.
- Definicion de roles y permisos especificos (ver `orquestador/matriz-roles-permisos.md`).
- Calculo de liquidaciones y motor de remuneraciones (futuras fases).

## Dependencias

- `AGENTS.md` - guia para agentes y buenas practicas de UI.
- `temas/ui-form-guidelines.md` y `temas/estilos-readme.md`.
- `orquestador/estado-fases.md` - contexto de fases del proyecto.
- Contratos especificos bajo `modulos/`.
 - `normativa-remuneraciones.md` - resumen legal aplicable a todos los modulos: definicion de remuneracion, ingreso minimo mensual, gratificacion legal, jornada laboral y obligaciones del LRE.

## Principios generales

1. **Separacion de preocupaciones**: los documentos separan claramente la UI del negocio. Los cambios de estilo se registran en `peticiones-estilos.md` y no deben alterar la logica.
2. **Periodo y vigencia**: el periodo activo `YYYY-MM` es contexto global para la remuneracion. Sin embargo, algunos datos se versionan por vigencia (`vigencia_inicio`, `vigencia_fin`) o son catalogos globales. Ver `parametros/vigencia-y-periodo.md`.
3. **Estados y flujo**: cada modulo debe definir estados de sus entidades y flujos de transicion. Los estados deben derivarse de campos de negocio, no de textos libres.
4. **Trazabilidad y referencias cruzadas**: cada documento debe enlazar sus dependencias y archivos relacionados. El `mapa-documentacion.md` provee una vista completa.
5. **Cierre de fases**: ninguna fase se marca como cerrada hasta que se cumplan los criterios de cierre. Fases en desarrollo o definidas deben mantenerse claramente identificadas.

## Flujo resumido

1. **Definicion**: se documenta un contrato funcional y reglas UI antes de implementar codigo.
2. **Implementacion**: se desarrolla la funcionalidad siguiendo las guias de UI y contratos. 
3. **Pruebas y validacion**: se ejecutan pruebas unitarias y E2E segun las guias del modulo. 
4. **Cierre**: una fase se cierra cuando todos sus criterios estan validados. Documentar el cierre en `orquestador/estado-fases.md`.

## Archivos relacionados

- `AGENTS.md` - contrato visual y tecnico para agentes.
- `criterios-globales.md` - criterios y estados globales.
- `orquestador/criterios-cierre-fases.md` - define criterios de cierre.
- `orquestador/matriz-roles-permisos.md` - roles y permisos del sistema.

## Pruebas o validacion

La validacion se realiza en cada modulo mediante pruebas unitarias y E2E. Este contrato asegura que dichas pruebas consideren las reglas globales. Cualquier excepcion debe justificarse en el contrato del modulo correspondiente.

## Criterios de cierre

Un cambio o fase se considera completa cuando:

- Se documenta el alcance y las reglas funcionales.
- Se implementa la UI siguiendo las guias de estilo.
- Se ejecutan las pruebas pertinentes sin fallos.
- Se actualiza el estado en `estado-fases.md`.

## Relacion con fases siguientes

Este contrato sirve como base para las fases futuras, incluyendo el motor de liquidacion y la integracion de roles/RLS. Cualquier fase nueva debe respetar estos principios y actualizar el contrato general si introduce reglas transversales nuevas.


## Contrato documental canonico 2026-05-10

Para nuevas fases, la fuente de avance rapido es `orquestador/mapa-global-fases.md` y el detalle historico sigue en `orquestador/estado-fases.md`.

Regla de producto vigente:

```txt
Cierre operativo
-> Liquidaciones oficiales
-> UX comercial
-> Previred/LRE/banco/contabilidad como futuras
```

No documentar una fase futura como implementada sin evidencia en changelog, estado de fases o tests.

NOM-CIERRE-DESIGN-01 cierra solo el diseno del cierre operativo. La implementacion sigue pendiente en `NOM-CIERRE-01 - Implementar cierre operativo controlado`.
