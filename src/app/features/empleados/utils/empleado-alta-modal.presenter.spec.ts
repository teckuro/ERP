import { describe, expect, it } from 'vitest';

import type { ReglaValidacionEvaluada } from '../models/empleado-alta-avanzada.vm';
import {
  buildFieldItemsFromBorradorIssues,
  buildFieldItemsFromRules,
  buildNextStepBlockingModalContent,
  buildPendientePrincipalDesdeFieldItems,
  groupFieldItemsByStep,
  mensajesNegocioDesdeReglas,
  pendientesCierreDesdeReglas,
  sortFieldGroupsByStep,
} from './empleado-alta-modal.presenter';
import { collectBorradorAvanzadoIssues } from './empleado-borrador-form.validation';
import { EmpleadosFormOrchestratorService } from '../services/empleados-form-orchestrator.service';

function regla(partial: Partial<ReglaValidacionEvaluada>): ReglaValidacionEvaluada {
  return {
    id: 'test.rule',
    stepId: 'contrato',
    wizardStep: 2,
    sectionTitle: 'Contrato',
    label: 'Campo test',
    detail: 'Detalle test',
    severity: 'error',
    blocking: true,
    complete: false,
    visible: true,
    sourcePath: 'contrato.cargo',
    ...partial,
  };
}

describe('empleado-alta-modal.presenter', () => {
  it('ordena field items por paso y deduplica por id', () => {
    const items = buildFieldItemsFromRules([
      regla({ id: 'b', wizardStep: 7, sourcePath: 'bancario.idBanco', label: 'Banco' }),
      regla({ id: 'a', wizardStep: 0, sourcePath: 'datosPersonales.rut', label: 'RUT' }),
      regla({ id: 'a', wizardStep: 0, sourcePath: 'datosPersonales.rut', label: 'RUT dup' }),
    ]);

    expect(items.map((i) => i.wizardStep)).toEqual([0, 7]);
    expect(items).toHaveLength(2);
  });

  it('agrupa y ordena pasos del modal', () => {
    const items = buildFieldItemsFromRules([
      regla({ id: 'b', wizardStep: 3 }),
      regla({ id: 'a', wizardStep: 0, sourcePath: 'datosPersonales.rut' }),
    ]);
    const groups = sortFieldGroupsByStep(
      groupFieldItemsByStep(items, (s) => `Paso ${s + 1}`),
    );
    expect(groups[0]?.wizardStep).toBe(0);
    expect(groups[1]?.wizardStep).toBe(3);
  });

  it('mapea issues de borrador con controlPath', () => {
    const form = new EmpleadosFormOrchestratorService().createForm();
    const issues = collectBorradorAvanzadoIssues(form);
    expect(issues.length).toBeGreaterThan(0);
    const fields = buildFieldItemsFromBorradorIssues(issues);
    expect(fields[0]?.controlPath).toBe('datosPersonales.rut');
  });

  it('mensajesNegocioDesdeReglas usa MENSAJES_FINALIZAR_ALTA', () => {
    const msgs = mensajesNegocioDesdeReglas([
      regla({ id: 'personal.identity', complete: false, blocking: true, severity: 'error' }),
    ]);
    expect(msgs[0]).toContain('RUT válido');
  });

  it('pendientesCierreDesdeReglas incluye paso y controlPath accionables', () => {
    const items = pendientesCierreDesdeReglas([
      regla({
        id: 'personal.identity',
        complete: false,
        blocking: true,
        severity: 'error',
        wizardStep: 0,
        sourcePath: 'datosPersonales.rut',
        label: 'RUT',
      }),
    ]);
    expect(items[0]?.id).toBe('personal.identity');
    expect(items[0]?.wizardStep).toBe(0);
    expect(items[0]?.controlPath).toBe('datosPersonales.rut');
    expect(items[0]?.mensaje).toContain('RUT válido');
  });

  it('buildPendientePrincipalDesdeFieldItems pluraliza', () => {
    const items = buildFieldItemsFromRules([
      regla({ id: 'a', wizardStep: 0 }),
      regla({ id: 'b', wizardStep: 1 }),
    ]);
    expect(buildPendientePrincipalDesdeFieldItems(items, 'Identidad')).toContain('2 datos');
  });

  it('buildNextStepBlockingModalContent arma copy y lista corta', () => {
    const items = buildFieldItemsFromRules([
      regla({
        id: 'personal.identity',
        wizardStep: 0,
        sourcePath: 'datosPersonales.rut',
        label: 'Ingresa un RUT valido',
      }),
      regla({
        id: 'personal.birthdate',
        wizardStep: 0,
        sourcePath: 'datosPersonales.fechaNacimiento',
        label: 'Ingresa la fecha de nacimiento',
      }),
    ]);
    const content = buildNextStepBlockingModalContent('Datos personales', items);

    expect(content.title).toBe('Faltan datos obligatorios');
    expect(content.message).toContain('«Datos personales» tiene 2 campos obligatorios pendientes');
    expect(content.message).toContain('para finalizar correctamente');
    expect(content.message).not.toContain('aún tiene');
    expect(content.sections[0]?.title).toBe('Campos pendientes');
    expect(content.sections[0]?.items).toEqual(['RUT', 'Fecha de nacimiento']);
    expect(content.sections[1]?.text).toContain('Podrás continuar');
    expect(content.sections[1]?.tone).toBe('info');
  });
});
