# Criterios de cierre de fases

Para cerrar una fase del ERP de remuneraciones se deben cumplir todos los criterios definidos a continuacion. 
No se permite cerrar fases parcialmente implementadas ni saltar criterios sin justificacion documental.

## Criterios generales

- **Documentacion completa**: se debe publicar un `contrato-general.md` para el modulo o fase, describiendo objetivo, alcance, reglas funcionales y pruebas.
- **Implementacion acorde**: el codigo debe seguir las reglas de la documentacion y respetar las guias de UI (`AGENTS.md`, `ui-form-guidelines.md`).
- **Pruebas exitosas**: se deben incluir pruebas unitarias y E2E; todas las suites deben pasar sin errores.
- **Revision de QA**: cualquier auditoria o revision debe completar sus hallazgos y actualizaciones.
- **Actualizacion del orquestador**: el tablero `estado-fases.md` y el `roadmap-operativo.md` deben reflejar el cambio de estado.
- **No hay brechas graves**: se pueden aceptar pendientes menores, pero no debe existir ningun bloqueo funcional o contradiccion critica en la documentacion.

## Criterios especificos

Cada fase puede anadir criterios particulares. 
Por ejemplo, una fase de **Parametros** puede exigir que se verifique la carga de catalogo mensual con fuentes oficiales; una fase de **Haberes y descuentos** puede requerir que se validen rangos de vigencia y cierres controlados. 
Dichos criterios deben describirse en el contrato de la fase y listarse aqui para referencia.

## Proceso de cierre

1. El equipo de desarrollo y QA revisan el cumplimiento de los criterios en su totalidad.
2. Se actualiza el `estado-fases.md` con el estado `Cerrada` y se mueve la fase al registro historico.
3. Se actualiza o crea documentos en `mapa-documentacion.md` con los cambios correspondientes.
4. Si existe alguna inconsistencia, se registra como **Pendiente** para la siguiente fase.
