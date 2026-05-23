import { describe, expect, it } from 'vitest';

import {
  buildCondicionesEspecialesDetalleItems,
  buildCondicionesEspecialesEstados,
  enriquecerSnapshotConPerfilRpc,
  etiquetaTramoEdadLaboral,
  mapPerfilLaboralRpcRow,
} from './empleado-perfil-laboral.rules';
import type { EmpleadoFichaValidacionSnapshot } from './empleado-ficha-validacion.rules';

const perfilFormVacio = {
  pensionado: false,
  pensionadoInvalidezParcial: false,
  pensionadoInvalidezTotal: false,
  exentoCotizacionPension: false,
  trabajadorAdolescenteProtegido: false,
  autorizacionMenorRegistrada: false,
  tecnicoExtranjeroExento: false,
  discapacidad: false,
  vigenciaInicio: '2026-01-01',
  vigenciaFin: '',
  respaldoRegistrado: false,
  observacion: '',
};

describe('empleado-perfil-laboral.rules', () => {
  it('mapPerfilLaboralRpcRow normaliza fila RPC', () => {
    const perfil = mapPerfilLaboralRpcRow({
      id_persona: 10,
      periodo: '2026-05',
      edad_periodo: 17,
      tramo_edad_laboral: 'MENOR_18',
      es_menor_18: true,
      es_adulto_18_65: false,
      es_mayor_65: false,
      es_pensionado: false,
      es_pensionado_invalidez_parcial: false,
      es_pensionado_invalidez_total: false,
      exento_cotizacion_pension: false,
      trabajador_adolescente_protegido: false,
      autorizacion_menor_registrada: false,
      aplica_imm_general: false,
      aplica_imm_menor18_mayor65: true,
      requiere_revision_rrhh: true,
    });

    expect(perfil.esMenor18).toBe(true);
    expect(perfil.tramoEdadLaboral).toBe('MENOR_18');
    expect(perfil.requiereRevisionRrhh).toBe(true);
  });

  it('etiquetaTramoEdadLaboral no expone codigos tecnicos', () => {
    expect(etiquetaTramoEdadLaboral('ADULTO_18_65', 32)).toBe('Adulto 18 a 65 años (32 años)');
    expect(etiquetaTramoEdadLaboral('SIN_FECHA_NACIMIENTO', null)).toBe(
      'Pendiente de fecha de nacimiento',
    );
  });

  it('buildCondicionesEspecialesDetalleItems lista condiciones declaradas', () => {
    const items = buildCondicionesEspecialesDetalleItems({
      perfil: mapPerfilLaboralRpcRow({
        id_persona: 1,
        periodo: '2026-05',
        edad_periodo: 40,
        tramo_edad_laboral: 'ADULTO_18_65',
        es_menor_18: false,
        es_adulto_18_65: true,
        es_mayor_65: false,
        es_pensionado: true,
        es_pensionado_invalidez_parcial: false,
        es_pensionado_invalidez_total: false,
        exento_cotizacion_pension: false,
        trabajador_adolescente_protegido: false,
        autorizacion_menor_registrada: false,
        aplica_imm_general: true,
        aplica_imm_menor18_mayor65: false,
        requiere_revision_rrhh: true,
      }),
      formPerfil: { ...perfilFormVacio, pensionado: true, respaldoRegistrado: true },
      periodoEtiqueta: 'Mayo 2026',
      categoriaBaseLabel: 'Dependiente / contrato',
    });

    expect(items.find((item) => item.label === 'Condiciones declaradas')?.value).toContain(
      'Pensionado',
    );
    expect(items.find((item) => item.label === 'Tramo detectado')?.value).toContain('Adulto');
  });

  it('buildCondicionesEspecialesEstados marca menor sin declarar como pendiente', () => {
    const estados = buildCondicionesEspecialesEstados({
      perfil: mapPerfilLaboralRpcRow({
        id_persona: 1,
        periodo: '2026-05',
        edad_periodo: 16,
        tramo_edad_laboral: 'MENOR_18',
        es_menor_18: true,
        es_adulto_18_65: false,
        es_mayor_65: false,
        es_pensionado: false,
        es_pensionado_invalidez_parcial: false,
        es_pensionado_invalidez_total: false,
        exento_cotizacion_pension: false,
        trabajador_adolescente_protegido: false,
        autorizacion_menor_registrada: false,
        aplica_imm_general: false,
        aplica_imm_menor18_mayor65: true,
        requiere_revision_rrhh: true,
      }),
      formPerfil: perfilFormVacio,
    });

    const adolescente = estados.find(
      (item) => item.codigo === 'TRABAJADOR_ADOLESCENTE_PROTEGIDO',
    );
    expect(adolescente?.estado).toBe('pendiente');
  });

  it('enriquecerSnapshotConPerfilRpc usa edad del periodo', () => {
    const base: EmpleadoFichaValidacionSnapshot = {
      perfilLaboralMenorEdad: false,
      trabajadorAdolescenteProtegido: false,
      autorizacionMenorRegistrada: false,
      tieneCondicionesEspeciales: false,
      respaldoRegistrado: true,
    };

    const enriched = enriquecerSnapshotConPerfilRpc(
      base,
      mapPerfilLaboralRpcRow({
        id_persona: 1,
        periodo: '2026-05',
        edad_periodo: 17,
        tramo_edad_laboral: 'MENOR_18',
        es_menor_18: true,
        es_adulto_18_65: false,
        es_mayor_65: false,
        es_pensionado: false,
        es_pensionado_invalidez_parcial: false,
        es_pensionado_invalidez_total: false,
        exento_cotizacion_pension: false,
        trabajador_adolescente_protegido: false,
        autorizacion_menor_registrada: false,
        aplica_imm_general: false,
        aplica_imm_menor18_mayor65: true,
        requiere_revision_rrhh: true,
      }),
    );

    expect(enriched.perfilLaboralMenorEdad).toBe(true);
  });
});
