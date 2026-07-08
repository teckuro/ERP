import { describe, expect, it } from 'vitest';

import {
  mapGuardarLicenciaToRpc,
  mapRowToLicenciaIngreso,
  mapRowToLicenciaMedica,
} from './licencias-medicas.mapper';

describe('licencias-medicas.mapper', () => {
  it('mapea fila de licencia con persona', () => {
    const licencia = mapRowToLicenciaMedica({
      id_licencia: 10,
      id_empresa: 1,
      id_persona: 5,
      id_contrato: 8,
      folio: 'LM-2026-001',
      tipo: 'comun',
      fecha_inicio: '2026-04-01',
      fecha_termino: '2026-04-07',
      dias: 7,
      estado: 'pendiente_revision',
      monto_subsidio: 100000,
      observacion: null,
      origen: 'correo',
      id_ingreso: 3,
      fecha_creacion: '2026-04-08T12:00:00Z',
      creado_por: null,
      persona: {
        rut: '12.345.678-9',
        nombres: 'Ana',
        apellido_paterno: 'Pérez',
        apellido_materno: 'López',
      },
    });

    expect(licencia.idLicencia).toBe(10);
    expect(licencia.nombreTrabajador).toBe('Ana Pérez López');
    expect(licencia.origen).toBe('correo');
  });

  it('mapea ingreso de correo', () => {
    const ingreso = mapRowToLicenciaIngreso({
      id_ingreso: 1,
      id_empresa: 1,
      remitente: 'compin@ejemplo.cl',
      asunto: 'Licencia',
      cuerpo_texto: 'Texto',
      cuerpo_html: null,
      adjuntos: [],
      message_id: 'msg-1',
      recibido_en: '2026-04-08T12:00:00Z',
      id_licencia: null,
      estado: 'pendiente_revision',
      fecha_creacion: '2026-04-08T12:00:00Z',
    });

    expect(ingreso.remitente).toBe('compin@ejemplo.cl');
    expect(ingreso.messageId).toBe('msg-1');
  });

  it('mapea guardar a RPC', () => {
    expect(
      mapGuardarLicenciaToRpc({
        idLicencia: 2,
        idPersona: 4,
        folio: 'LM-2026-002',
        tipo: 'comun',
        fechaInicio: '2026-04-01',
        fechaTermino: '2026-04-03',
        dias: 3,
        estado: 'pendiente_revision',
        origen: 'manual',
      }),
    ).toMatchObject({
      p_id_licencia: 2,
      p_id_persona: 4,
      p_folio: 'LM-2026-002',
      p_origen: 'manual',
    });
  });
});
