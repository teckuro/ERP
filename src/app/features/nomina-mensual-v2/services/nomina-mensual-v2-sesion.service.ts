import { Injectable, inject } from '@angular/core';

import { etiquetaPeriodoDesdeYm, PeriodoActivoService } from '../../../core/services/periodo-activo.service';
import type { PayrollStepId } from '../models/nomina-mensual-v2.models';
import type {
  EstadoBaseParametrosPeriodoView,
  OrigenBaseParametrosAlAvanzar,
} from '../models/nomina-parametros-base.models';
import type { NominaParametrosResumen } from '../models/nomina-parametros-resumen.models';
import type { ContextoTrazabilidadPasoNomina } from '../models/nomina-trazabilidad.models';
import { resolverOrigenBaseDesdeSnapshot } from '../mappers/nomina-parametros-base.mapper';
import { NominaCalculoSnapshotRepository } from '../../nomina-mensual/data-access/nomina-calculo-snapshot.repository';
import { NominaParametrosBaseService } from './nomina-parametros-base.service';
import { NominaParametrosResumenService } from './nomina-parametros-resumen.service';

export type EstadoSesionNominaV2 = {
  pasoInicial: PayrollStepId;
  parametrosPreparados: boolean;
  estadoBase: EstadoBaseParametrosPeriodoView;
  origenBase: OrigenBaseParametrosAlAvanzar | null;
  idCalculoPeriodoBase: number | null;
  contextoTrazabilidad: ContextoTrazabilidadPasoNomina | null;
};

@Injectable({ providedIn: 'root' })
export class NominaMensualV2SesionService {
  private readonly periodoActivo = inject(PeriodoActivoService);
  private readonly parametrosBaseService = inject(NominaParametrosBaseService);
  private readonly parametrosResumenService = inject(NominaParametrosResumenService);
  private readonly snapshotRepository = inject(NominaCalculoSnapshotRepository);

  async resolverEstadoSesion(periodo = this.periodoActivo.periodoYm()): Promise<EstadoSesionNominaV2> {
    const [estadoBase, resumen] = await Promise.all([
      this.parametrosBaseService.obtenerEstadoBasePeriodo(periodo),
      this.parametrosResumenService.obtenerResumen(periodo),
    ]);

    const parametrosPreparados = estadoBase.idCalculoPeriodoBase != null;
    let origenBase: OrigenBaseParametrosAlAvanzar | null = null;

    if (parametrosPreparados) {
      const snapshot = await this.snapshotRepository.obtenerSnapshotParametrosBase(periodo);
      origenBase = snapshot ? resolverOrigenBaseDesdeSnapshot(snapshot) : 'existenteSinDiferencias';
    }

    return {
      pasoInicial: parametrosPreparados ? 'scope' : 'parameters',
      parametrosPreparados,
      estadoBase,
      origenBase,
      idCalculoPeriodoBase: estadoBase.idCalculoPeriodoBase,
      contextoTrazabilidad: this.buildContextoTrazabilidad(resumen, estadoBase, origenBase),
    };
  }

  private buildContextoTrazabilidad(
    resumen: NominaParametrosResumen,
    estadoBase: EstadoBaseParametrosPeriodoView,
    origenBase: OrigenBaseParametrosAlAvanzar | null,
  ): ContextoTrazabilidadPasoNomina {
    return {
      periodo: resumen.periodo,
      parametrosResumen: {
        seccionesListas: resumen.seccionesListas,
        seccionesTotal: resumen.seccionesTotales,
        controlesVerificados: resumen.controlesVerificados,
        bloqueos: resumen.bloqueos,
        advertencias: resumen.requiereRevision,
      },
      parametrosBase: origenBase && estadoBase.idCalculoPeriodoBase
        ? {
            origen: origenBase,
            idCalculoPeriodoBase: estadoBase.idCalculoPeriodoBase,
            fechaBaseGuardada: estadoBase.fechaBaseGuardada,
          }
        : undefined,
    };
  }

  etiquetaPeriodo(periodo: string): string {
    return etiquetaPeriodoDesdeYm(periodo);
  }
}
