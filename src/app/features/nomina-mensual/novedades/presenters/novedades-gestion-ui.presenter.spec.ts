import { describe, expect, it } from 'vitest';

import {
  breadcrumbGestionModalHijo,
  leyendaEstadosGestion,
  mensajeAccionBloqueadaCorto,
  mensajeAccionBloqueadaMensual,
} from './novedades-gestion-ui.presenter';

describe('novedades-gestion-ui.presenter', () => {
  it('arma breadcrumb del modal hijo', () => {
    expect(
      breadcrumbGestionModalHijo({ trabajador: 'Ana Pérez', accion: 'mensual', editando: false }),
    ).toBe('Gestionar · Ana Pérez · Registrar movimiento del mes');
  });

  it('expone leyenda de estados RRHH', () => {
    expect(leyendaEstadosGestion()).toHaveLength(4);
  });

  it('expone mensaje corto para acciones bloqueadas', () => {
    expect(mensajeAccionBloqueadaCorto('Aprobada', 'mensual')).toBe('Solo consulta');
    expect(mensajeAccionBloqueadaCorto('Activa', 'recurrente')).toBe('Vigente');
  });
});
