# Validar para remuneraciones (Ficha)

## Decisión: opción B

La ficha **completa** según el helper **no** pasa sola a apta. El usuario debe ejecutar la acción explícita **«Validar para remuneraciones»**.

## Condiciones para mostrar el botón

- `paso_alta_avanzada === null`
- Helper sin bloqueos (`bloqueos.length === 0`) y sin `defaultsTecnicosDetectados`
- `tipoPrevision` distinto de `NINGUNA`; AFP o IPS deben tener salud completa segun el helper central
- Sin secciones pendientes bloqueantes
- Aún no validada (`estado_ficha` / `apto_para_remuneraciones` según reglas del contrato)
- Estado operativo **en proceso** o **activo** (no borrador operativo, no `estado_ficha` BORRADOR, etc.)

## Confirmación

Diálogo breve (título con «¿…?», cuerpo con tildes). Botones **Cancelar** y **Validar**.

## Persistencia

1. Comprobar estado operativo en servidor; si no aplica, error sin persistir.
2. Reejecutar `evaluarCompletitudYAptitudEmpleado` con `paso_alta_avanzada` desde BD.
3. Si hay bloqueos: no actualizar; mostrar hasta cinco pendientes y conteo «y X pendientes más».
4. Si no hay bloqueos: actualizar **solo** `persona` - `estado_ficha = VALIDO`, `apto_para_remuneraciones = true`, `estado = ACTIVO` si venía en proceso, `fecha_activacion` si estaba vacía, `paso_alta_avanzada = null`.

**No** actualiza: contrato, remuneración detallada, previsión, banco, APVI ni otros datos de ficha. No completa datos faltantes. No duplica persona.

## Guardado parcial

Guardar una sección **no** valida automáticamente. Si no hay bloqueos, la UI puede mostrar «Ficha completa» y «Pendiente de validación» hasta que el usuario valide.

## Referencias

- Contrato íntegro (mismo texto que §21 del documento consolidado): [`contrato-general.md`](./contrato-general.md) sección **21. Validación explícita desde Ficha empleado**.
- Implementación: `empleados.repository.ts` → `validarFichaParaRemuneraciones`; `ficha-empleado-container`.
