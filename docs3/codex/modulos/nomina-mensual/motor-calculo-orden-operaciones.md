# MOTOR-00 - Orden de operaciones del motor

Este documento fija el orden esperado para MOTOR-01. No implementa calculos.

## Orden obligatorio

1. Validar pre-nomina sin bloqueos.
2. Cargar parametros legales del periodo.
3. Determinar trabajadores calculables.
4. Consolidar haberes imponibles.
5. Consolidar haberes no imponibles.
6. Aplicar gratificacion si corresponde.
7. Calcular bases imponibles.
8. Aplicar topes previsionales.
9. Calcular AFP.
10. Calcular SIS.
11. Calcular salud.
12. Calcular AFC.
13. Calcular SANNA.
14. Calcular Ley 16.744 empleador.
15. Calcular impuesto unico.
16. Aplicar descuentos voluntarios.
17. Calcular liquido.
18. Generar trazabilidad.
19. Marcar resultado como calculado no cerrado.

## Reglas normativas iniciales

| Regla | Contrato para MOTOR-01 |
|---|---|
| IMM | Validar sueldo base contra `parametros_generales.sueldo_minimo` o campo IMM confirmado del periodo. |
| Jornada parcial e IMM proporcional | Jornada parcial `<= 30` puede permitir IMM proporcional si la politica contractual lo define; jornada `> 30` exige IMM completo. |
| Jornada 40 horas | Validar jornada maxima vigente por periodo: 44 desde 2024-04-26, 42 desde 2026-04-26, 40 desde 2028-04-26 salvo cambio legal. |
| Gratificacion legal | Calcular solo si la politica de empresa lo habilita; tope 4,75 IMM derivado desde IMM vigente. |
| Haberes imponibles/no imponibles | Dependen de clasificacion de conceptos; concepto sin clasificacion bloquea. |
| AFP | Usar AFP del trabajador, `afp` y `afp_vigencia` vigente. |
| SIS | Usar `parametros_generales.sis` y/o `afp_vigencia.sis`; no hardcodear. |
| SANNA | Usar `parametros_generales.sanna` cuando aplique. |
| Salud | Fonasa o Isapre con `salud` / `salud_plan`; minimo legal y plan pactado segun corresponda. |
| AFC | Usar `afc_parametro` segun tipo de contrato. |
| Ley 16.744 | Usar `ley_16744_parametros` y configuracion empresa en `empresa_ley_16744`. |
| Asignacion familiar | Usar `tramo_carga`; haber no imponible. |
| Impuesto unico | Usar `tabla_impuesto_unico` vigente. |
| Topes imponibles | Usar campos confirmados en `parametros_generales`; no usar tabla separada no confirmada. |

## Invariantes

- El motor no corrige datos maestros.
- El motor no crea parametros legales.
- El motor no cierra periodos.
- El motor no genera archivos externos.
- El motor no persiste snapshots hasta una fase posterior que lo defina.
- Cada resultado debe ser reproducible desde sus entradas y trazabilidad.
