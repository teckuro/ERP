import { inject, Injectable } from '@angular/core';

import { LiquidacionesOficialesRepository } from '../../liquidaciones-oficiales/data-access/liquidaciones-oficiales.repository';
import { nominasConLiquidacionesDisponibles } from '../../nomina-mensual/rules/nomina-liquidaciones-internas-ui.rules';
import type { NominaPeriodoResumen } from '../../nomina-mensual/models/nomina-periodo.models';
import { NominaPeriodoService } from '../../nomina-mensual/services/nomina-periodo.service';
import type { LreBorradorExport } from '../models/lre-export.model';
import { construirBorradorLre } from '../rules/lre-export.rules';

@Injectable({ providedIn: 'root' })
export class LreExportService {
  private readonly liquidaciones = inject(LiquidacionesOficialesRepository);
  private readonly nominaService = inject(NominaPeriodoService);

  async listarNominasExportables(): Promise<NominaPeriodoResumen[]> {
    const resumenes = await this.nominaService.listarResumenes();
    return nominasConLiquidacionesDisponibles(resumenes);
  }

  async construirBorradorDesdeNomina(nominaPeriodoId: string): Promise<LreBorradorExport | null> {
    const nomina = await this.nominaService.obtenerCabeceraNomina(nominaPeriodoId);
    if (!nomina?.evidenciaCalculo?.idCalculoPeriodo) return null;

    const liquidacion = await this.liquidaciones.obtenerLiquidacionPeriodo(
      nomina.periodo,
      nomina.evidenciaCalculo.idCalculoPeriodo,
    );
    if (!liquidacion) return null;

    const trabajadores = await this.liquidaciones.obtenerLiquidacionesTrabajadores(
      liquidacion.idLiquidacionPeriodo,
    );
    const detalles = await Promise.all(
      trabajadores.map(async (trabajador) => ({
        trabajador,
        conceptos: await this.liquidaciones.obtenerDetalleTrabajador(trabajador.idLiquidacionTrabajador),
      })),
    );

    return construirBorradorLre({
      periodo: nomina.periodo,
      empresaNombre: nomina.empresaNombre,
      idLiquidacionPeriodo: liquidacion.idLiquidacionPeriodo,
      versionLiquidacion: liquidacion.version,
      trabajadores: detalles,
    });
  }
}
