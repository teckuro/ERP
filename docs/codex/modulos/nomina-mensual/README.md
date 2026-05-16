# Módulo Nómina mensual — punto de entrada

## Estado

**Prevalidaciones 9.5A + 9.5B** implementadas (sin motor ni liquidaciones): recurrentes por mes, grupos minimos de parametros + catalogos, resumen en UI. Proceso productivo end-to-end sigue **pendiente**. Vision de producto: [`vision-futura.md`](./vision-futura.md); orquestador: [`../../orquestador/estado-fases.md`](../../orquestador/estado-fases.md).

## REM-MOV-UNIFY-01 aplicado

El nombre visible oficial del flujo de hechos puntuales del periodo es **Movimientos del mes**. La ruta canonica visible se mantiene en `/remuneraciones/novedades-mensuales` por compatibilidad tecnica, pero RRHH no debe ver `Novedades mensuales`, `Movimientos variables` ni `Entradas mensuales` como nombres equivalentes del flujo.

La pantalla usa `PeriodoActivoService.periodoYm()` como fuente unica, muestra resumen por estado, formulario guiado y listado operativo. Los movimientos aprobados del periodo son los que se consideran al preparar nomina; borradores y pendientes quedan fuera hasta su aprobacion.

## REM-MOV-MODAL-01 aplicado

La accion **Registrar movimiento** abre un modal grande responsive dentro de `Movimientos del mes`. El periodo activo global se muestra solo como contexto del registro y no puede editarse desde el modal.

El modal mantiene header y footer estables, scroll interno para el formulario, accion primaria unica **Guardar movimiento** y accion secundaria **Cancelar**. Cancelar descarta directo si no hay cambios; con cambios sin guardar solicita confirmacion con el patron `app-message-box`.

## NOM-MOVIMIENTOS-MODAL-MENSUAL-UX-01 aplicado

El modal visible se titula **Registrar movimiento del mes** y queda enfocado solo en movimientos puntuales del periodo activo. No contiene duracion, recurrentes ni cuotas; las cuotas pertenecen al flujo recurrente de Haberes y descuentos.

La estructura queda compacta y vertical: bloque Movimiento, Detalle administrativo opcional y Resumen inferior antes del footer.

## Documentos

| Archivo | Rol |
|---------|-----|
| [`contrato-general.md`](./contrato-general.md) | Objetivo, alcance, relaciones con Parametros, empleados, conceptos, MV, motor futuro |
| [`prevalidaciones-9-5A.md`](./prevalidaciones-9-5A.md) | Reglas base 9.5A (periodo, fila PG, calendario, empleados, conceptos, MV) |
| [`prevalidaciones-9-5B.md`](./prevalidaciones-9-5B.md) | Recurrentes por `YYYY-MM`, grupos minimos de parametros, archivos y pruebas 9.5B |
| [`vision-futura.md`](./vision-futura.md) | Checklist orientativo y relación con otros módulos |

## Relación con flujos documentados

Pantalla **Proceso mensual**: **`/remuneraciones/proceso-mensual`** (redirect desde `/proceso-remuneraciones`). UI: `src/app/features/nomina-mensual/containers/proceso-mensual-container/`; pagina `src/app/pages/proceso-remuneraciones.page.ts` wrapper (`docs/codex/arquitectura/frontend-interfaces.md`). Servicio: `ProcesoMensualService`; reglas: `proceso-mensual-prevalidacion.rules.ts`. Limpieza demo previa: [`../../auditorias/param-chile-01-parametros-y-demo-proceso.md`](../../auditorias/param-chile-01-parametros-y-demo-proceso.md).

[`../../temas/flujos/proceso-remuneraciones.md`](../../temas/flujos/proceso-remuneraciones.md) y [`../../orquestador/contexto-proyecto.md`](../../orquestador/contexto-proyecto.md) §11–§15.

**Movimientos variables** (entrada del proceso): [`../movimientos-variables/README.md`](../movimientos-variables/README.md), [`../movimientos-variables/ui-9-4E.md`](../movimientos-variables/ui-9-4E.md).

<!-- UX-COMERCIAL-01-NOMINA -->

## Hito funcional y siguiente foco UX

El flujo de nomina queda validado hasta liquidaciones internas:

```txt
Preparar nomina
-> Resultado preliminar
-> Aprobacion operativa
-> Cierre operativo
-> Liquidaciones oficiales internas
```

Para fases siguientes de UI, `Preparar nomina` debe presentarse como tablero operativo/comercial del periodo:

```txt
estado principal
resumen ejecutivo
siguiente accion
bloqueos/advertencias
resultado guardado
cierre
liquidaciones
trazabilidad secundaria
```

No agregar Previred, LRE, banco, contabilidad, PDF ni firma en esta etapa.

## UX-COMERCIAL-01 V4 aplicado

`Preparar nomina` mantiene el patron:

```txt
header operativo
avanzar cierre mensual
resumen ejecutivo
siguiente accion
bloqueos / advertencias / informacion
resultado y cierre
trazabilidad secundaria
```

Tambien se reforzaron entradas del flujo:

- Movimientos del mes explica impacto en nomina y guia el empty state hacia registrar bonos, descuentos, anticipos o ajustes.
- Asignaciones recurrentes muestra motivo visible cuando no se puede crear sin trabajador seleccionado.
- Dashboard y Reportes ya no presentan salidas futuras como acciones disponibles.

## REM-UX-FLOWS-01 V2 aplicado

`Preparar nomina` consume el periodo activo global expuesto por el header/padre. La pantalla ya no muestra un segundo selector editable de periodo ni duplica el boton `Validar periodo` en el header.

La prioridad visual queda:

```txt
Periodo activo global
-> Estado del flujo
-> Siguiente accion recomendada
-> Que falta ahora
-> Detalle operativo
-> Trazabilidad secundaria
```

Para cambiar el periodo se usa el selector superior global. La pantalla hija solo muestra el periodo como contexto y ejecuta sus acciones sobre esa fuente.

## REM-UX-FLOWS-01 V3 aplicado

`Preparar nomina` separa lectura de cliente y trazabilidad interna:

```txt
Periodo activo global
-> Estado visible del periodo
-> Siguiente accion recomendada
-> Que falta ahora
-> Resumen final visible
-> Detalle y trazabilidad secundaria
```

El avance visible usa etapas de negocio: `Preparacion`, `Revision`, `Aprobacion y cierre`, `Liquidaciones`. Los pasos internos de validacion, base, calculo, guardado y persistencia quedan dentro del detalle operativo secundario.

## REM-UX-FLOWS-02 aplicado

`Preparar nomina` queda como hub operativo guiado por estado:

```txt
estado del periodo
accion principal unica
resumen minimo
pendientes / bloqueos / advertencias
revision operativa del periodo
informacion interna y alcance
```

La pantalla conserva solo el avance compacto superior y elimina el rail lateral duplicado. La revision operativa renderiza la etapa relevante segun `estadoClave` / `disclosureActivo`; en estado pendiente de validacion no expone todas las etapas internas.

`Movimientos del mes` usa el periodo activo global como fuente unica para listar y crear movimientos. Ya no muestra selector local editable de periodo ni boton `Buscar` asociado a ese selector.

## REM-PERIOD-GLOBAL-01 / REM-NAV-IA-01 aplicado

El header global es la unica fuente editable de periodo en Remuneraciones. `Preparar nomina` limpia resultado, pre-nomina, calculo, snapshot, aprobacion/cierre y mensajes al cambiar el periodo, y consulta el snapshot activo del nuevo periodo.

Rutas visibles del flujo:

```txt
/remuneraciones/proceso-mensual
/remuneraciones/novedades-mensuales
/remuneraciones/haberes-descuentos
/remuneraciones/liquidaciones
/remuneraciones/conceptos
```

`/remuneraciones/movimientos-variables` queda como redirect legacy a `novedades-mensuales`.

## ERP-AUDIT-REPAIR-UX-01 aplicado

`Preparar nomina` reemplaza confirmaciones nativas (`window.confirm`) por `app-message-box` modal en acciones criticas:

- Guardar resultado preliminar.
- Aprobar resultado preliminar.
- Cerrar nomina del periodo.

La confirmacion muestra motivo, alcance y puntos de revision RRHH. Cancelar no ejecuta persistencia. No cambia motor, SQL/RPC/RLS, liquidaciones oficiales ni salidas externas.
## ERP-NOIA-BITACORA-OPERATIVA-00 - Lectura de modulo

Nomina mensual queda alineada a [`NOIA / Bitacora Operativa`](../../diseno/bitacora-operativa-noia.md) como `Bitacora del periodo`.

- Preparar nomina debe comunicar periodo, trabajadores incluidos/excluidos, incidencias, decisiones RRHH y cierre operativo.
- Los resultados preliminares y cierres deben sentirse como registros del periodo, no como pantallas sueltas de calculo.
- Fase futura recomendada: `NOM-MOVIMIENTOS-UNIFICADOS-UX-01` para ordenar `Movimientos de remuneracion`.
- Esta referencia es documental; no cambia motor, SQL, liquidaciones, servicios ni estilos globales.

## NOM-MOVIMIENTOS-SIMPLE-00

La decision documental vigente define `Movimientos de remuneracion` como experiencia futura que unifica `Movimientos del mes` y `Asignaciones recurrentes` desde la duracion del registro: `Solo este mes`, `Recurrente` o `En cuotas`. Documento rector: [`../remuneraciones/movimientos-remuneracion-simple.md`](../remuneraciones/movimientos-remuneracion-simple.md).

Esta fase no cambia rutas, servicios, SQL, motor ni pantallas actuales.

## NOM-MOVIMIENTOS-SIMPLE-01

Preparar nomina queda alineado a la primera capa visible de `Movimientos de remuneracion`: sus accesos y textos hablan de movimientos del periodo y recurrentes como vistas de una misma gestion. No duplica edicion ni cambia el calculo, SQL, servicios, mappers o payloads.

## NOM-MOVIMIENTOS-POR-TRABAJADOR-01

Movimientos de remuneracion queda administrado por trabajador en la vista mensual. La grilla del periodo muestra contadores de movimientos del mes, recurrentes y pendientes de revision. El modal mensual queda restringido a movimientos puntuales del periodo y no muestra duracion ni cuotas.

## NOM-MOVIMIENTOS-GESTION-INTEGRAL-01

`Movimientos de remuneración` es el menú único para gestionar movimientos mensuales y recurrentes por trabajador. La pantalla mantiene la grilla de trabajadores como entrada principal y usa un modal de gestión del trabajador con tres secciones: movimientos del mes, recurrentes y pendientes de revisión.

El alta mensual y el alta recurrente son formularios separados. El modal mensual registra solo movimientos puntuales del período activo. El modal recurrente registra o edita asignaciones recurrentes y concentra la futura sección de cuotas. No se agregan tablas, SQL, motor ni payloads nuevos.
