import { describe, expect, it } from 'vitest';

import {
  esRolAdministradorRemuneraciones,
  esRolConsultaRemuneraciones,
  etiquetaRolRemuneraciones,
  resolverPermisosNominaMensual,
  resolverRolRemuneracionesDesdeClaims,
} from './erp-permisos-remuneraciones.rules';

describe('erp-permisos-remuneraciones.rules', () => {
  it('eleva admin solo desde app_metadata', () => {
    expect(
      resolverRolRemuneracionesDesdeClaims({
        autenticado: true,
        appMetadataRole: 'ADMIN_REMUNERACIONES',
      }),
    ).toBe('admin_remuneraciones');

    expect(
      resolverRolRemuneracionesDesdeClaims({
        autenticado: true,
        userMetadataRole: 'admin',
      }),
    ).toBe('operador_remuneraciones');
  });

  it('reconoce consulta desde user_metadata', () => {
    expect(
      resolverRolRemuneracionesDesdeClaims({
        autenticado: true,
        userMetadataRole: 'CONSULTA_REMUNERACIONES',
      }),
    ).toBe('consulta_remuneraciones');
  });

  it('default operador cuando hay sesion sin rol explicito', () => {
    expect(
      resolverRolRemuneracionesDesdeClaims({ autenticado: true }),
    ).toBe('operador_remuneraciones');
  });

  it('matriz §8.1: operador crea/edita; admin acciones criticas', () => {
    const operador = resolverPermisosNominaMensual('operador_remuneraciones');
    expect(operador.puedeCrearNomina).toBe(true);
    expect(operador.puedeEditarNomina).toBe(true);
    expect(operador.puedeEliminarNomina).toBe(false);
    expect(operador.puedeCerrarNomina).toBe(false);
    expect(operador.puedeRecargarParametrosBase).toBe(false);

    const admin = resolverPermisosNominaMensual('admin_remuneraciones');
    expect(admin.puedeEliminarNomina).toBe(true);
    expect(admin.puedeCerrarNomina).toBe(true);
    expect(admin.puedeRecargarParametrosBase).toBe(true);

    const consulta = resolverPermisosNominaMensual('consulta_remuneraciones');
    expect(consulta.puedeVerNomina).toBe(true);
    expect(consulta.puedeCrearNomina).toBe(false);
    expect(consulta.puedeEditarNomina).toBe(false);
  });

  it('normaliza aliases de rol', () => {
    expect(esRolAdministradorRemuneraciones('admin-sistema')).toBe(true);
    expect(esRolConsultaRemuneraciones('solo-lectura')).toBe(true);
  });

  it('etiquetaRolRemuneraciones traduce roles a copy RRHH', () => {
    expect(etiquetaRolRemuneraciones('admin_remuneraciones')).toBe('Admin remuneraciones');
    expect(etiquetaRolRemuneraciones('consulta_remuneraciones')).toBe('Consulta');
    expect(etiquetaRolRemuneraciones('sin_sesion')).toBe('RRHH');
  });
});
