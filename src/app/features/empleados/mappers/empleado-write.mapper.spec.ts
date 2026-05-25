import { describe, expect, it } from 'vitest';

import {
  payloadUsuarioCasaParticular,
  payloadUsuarioDependienteCompleto,
  payloadUsuarioExclusionJornada,
  payloadUsuarioHonorarios,
} from '../testing/empleado-payload.fixtures';
import { parseRut } from '../utils/empleado-rut';
import {
  buildContratoInsert,
  buildCuentaBancariaInsert,
  buildPersonaInsert,
  buildPrevisionInsert,
  buildRemuneracionInsert,
  buildSaludTrabajadorInsert,
} from './empleado-write.mapper';

describe('empleado-write.mapper persistencia', () => {
  const personaId = 101;
  const empresaId = 1;
  const contratoId = 202;

  it('usuario dependiente completo: persona y contacto mapean todos los campos de identificación', () => {
    const payload = payloadUsuarioDependienteCompleto();
    const rut = parseRut(payload.rut);
    const persona = buildPersonaInsert(payload, rut);

    expect(persona.nombres).toBe('Camila Andrea');
    expect(persona.apellido_paterno).toBe('Soto');
    expect(persona.apellido_materno).toBe('Rojas');
    expect(persona.numero_direccion).toBe('1234');
    expect(persona.departamento_direccion).toBe('502');
    expect(persona.email).toBe('camila.soto@empresa.cl');
    expect(persona.telefono).toBe('+56 9 1234 5678');
  });

  it('usuario dependiente completo: contrato incluye relacion_laboral y remuneración', () => {
    const payload = payloadUsuarioDependienteCompleto();
    const contrato = buildContratoInsert(payload, personaId, empresaId);
    const remuneracion = buildRemuneracionInsert(payload, contratoId);

    expect(contrato.relacion_laboral).toBe('CONTRATO');
    expect(contrato.cargo).toBe('Analista de remuneraciones');
    expect(contrato.excluido_limite_jornada).toBe(false);
    expect(remuneracion.sueldo_base).toBe(850000);
    expect(remuneracion.horas_semanales).toBe(42);
    expect(remuneracion.distribucion_jornada).toBe('Lunes a viernes');
  });

  it('usuario casa particular: persiste bloque normativo solo si aplica tipo contrato', () => {
    const payload = payloadUsuarioCasaParticular();
    const contrato = buildContratoInsert(payload, personaId, empresaId);

    expect(contrato.codigo_tipo_contrato).toBe('CASA_PARTICULAR');
    expect(contrato.casa_particular_modalidad).toBe('PUERTAS_ADENTRO');
    expect(contrato.casa_particular_labores).toBe('Limpieza y cuidado');
    expect(contrato.casa_particular_asistencia_cuidado).toBe(true);
    expect(contrato.causal_exclusion_jornada).toBeNull();
  });

  it('usuario exclusión jornada: persiste causal y justificación', () => {
    const payload = payloadUsuarioExclusionJornada();
    const contrato = buildContratoInsert(payload, personaId, empresaId);

    expect(contrato.excluido_limite_jornada).toBe(true);
    expect(contrato.causal_exclusion_jornada).toBe('ALTA_RESPONSABILIDAD');
    expect(contrato.justificacion_exclusion_jornada).toBe(
      'Cargo de confianza documentado en anexo.',
    );
  });

  it('usuario honorarios: previsión AFP nula y salud no insertable', () => {
    const payload = payloadUsuarioHonorarios();
    const prevision = buildPrevisionInsert(payload, contratoId);
    const salud = buildSaludTrabajadorInsert(payload, contratoId);

    expect(prevision.id_afp).toBeNull();
    expect(prevision.tipo_prevision).toBe('NINGUNA');
    expect(salud).toBeNull();
  });

  it('usuario dependiente completo: previsión, salud y cuenta bancaria listos para insert', () => {
    const payload = payloadUsuarioDependienteCompleto();
    const prevision = buildPrevisionInsert(payload, contratoId);
    const salud = buildSaludTrabajadorInsert(payload, contratoId);
    const cuenta = buildCuentaBancariaInsert(payload, personaId);

    expect(prevision.id_afp).toBe(1);
    expect(salud?.id_salud).toBe(1);
    expect(salud?.valor_plan).toBe(4.2);
    expect(cuenta.numero_cuenta).toBe('123456789012');
  });

  it('INDEFINIDO no deja residuos de casa particular en contrato', () => {
    const payload = payloadUsuarioDependienteCompleto({ tipoContrato: 'INDEFINIDO' });
    const contrato = buildContratoInsert(payload, personaId, empresaId);

    expect(contrato.casa_particular_modalidad).toBeNull();
    expect(contrato.casa_particular_labores).toBeNull();
  });
});
